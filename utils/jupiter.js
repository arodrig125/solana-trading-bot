const { createJupiterApiClient } = require('@jup-ag/api');
const { Connection, PublicKey } = require('@solana/web3.js');
const BigNumber = require('bignumber.js');
const { TOKEN_PAIRS, TOKENS, TRIANGULAR_PATHS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const settings = require('../config/settings');
const logger = require('./logger');
const pathFinder = require('./pathFinder');
const pathHistory = require('./pathHistory');
const positionSizing = require('./positionSizing');
const gasOptimizer = require('./gasOptimizer');

// Initialize Jupiter API client
async function initJupiterClient() {
  // Get Solana connection
  const connection = getSolanaConnection();

  // Initialize Jupiter API client with enhanced options
  const jupiterClient = createJupiterApiClient({
    // Optional parameters that can improve performance
    cacheExpiry: 30000, // Cache expiry in milliseconds
    retryCount: 3 // Number of retries for failed requests
  });

  // Initialize gas optimizer if enabled
  if (settings.gasOptimization?.enabled) {
    await gasOptimizer.initializeGasOptimizer(connection);
    logger.info('Gas optimizer initialized');
  }

  return jupiterClient;
}

// Get Solana connection
function getSolanaConnection() {
  const endpoint = process.env.RPC_ENDPOINT || settings.advanced.rpcEndpoint || 'https://api.mainnet-beta.solana.com';
  logger.info(`Using RPC endpoint: ${endpoint}`);
  return new Connection(endpoint, 'confirmed');
}

// Get token info by mint address
function getTokenByMint(mintAddress) {
  return Object.values(TOKENS).find(token => token.mint === mintAddress);
}

// Get token by symbol
function getTokenBySymbol(symbol) {
  return Object.values(TOKENS).find(token => token.symbol === symbol);
}

// Format amount based on token decimals
function formatAmount(amount, decimals) {
  return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toNumber();
}

// Parse amount to token decimals
function parseAmount(amount, decimals) {
  return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals)).integerValue().toString();
}

// Calculate profit percentage
function calculateProfitPercentage(inputAmount, outputAmount) {
  return new BigNumber(outputAmount).minus(inputAmount).dividedBy(inputAmount).multipliedBy(100).toNumber();
}

// Check if a token is allowed (not blacklisted or is whitelisted)
function isTokenAllowed(mintAddress) {
  // Check if token is blacklisted
  if (BLACKLISTED_TOKENS.includes(mintAddress)) {
    return false;
  }

  // If whitelist is empty, all non-blacklisted tokens are allowed
  if (WHITELISTED_TOKENS.length === 0) {
    return true;
  }

  // If whitelist is not empty, only whitelisted tokens are allowed
  return WHITELISTED_TOKENS.includes(mintAddress);
}

// Sleep function to add delay between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting variables
let lastApiCallTime = 0;
const minTimeBetweenCalls = 200; // 200ms between calls to avoid rate limiting
let consecutiveFailures = 0;
const maxRetries = 3;

// Exponential backoff function
function getBackoffTime() {
  // Start with 1 second, then 2, then 4, etc.
  return Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 10000); // Max 10 seconds
}

// Get quote for a token swap
async function getQuote(jupiterClient, inputMint, outputMint, amount, slippageBps = 100, onlyDirectRoutes = false) {
  try {
    // Check if tokens are allowed
    if (!isTokenAllowed(inputMint) || !isTokenAllowed(outputMint)) {
      logger.warn(`Quote skipped: Token not allowed (${inputMint} -> ${outputMint})`);
      return null;
    }

    // Convert mint addresses to strings if they are PublicKey objects
    const inputMintStr = inputMint instanceof PublicKey ? inputMint.toString() : inputMint;
    const outputMintStr = outputMint instanceof PublicKey ? outputMint.toString() : outputMint;

    // Log the Jupiter client structure to debug
    logger.info(`Jupiter client methods: ${Object.keys(jupiterClient).join(', ')}`);

    // Try the direct method first (for v6)
    try {
      // Check if quote method exists
      if (typeof jupiterClient.quote === 'function') {
        logger.info('Using direct quote method');
        const quoteResponse = await jupiterClient.quote({
          inputMint: inputMintStr,
          outputMint: outputMintStr,
          amount,
          slippageBps,
          onlyDirectRoutes
        });

        return quoteResponse;
      } else {
        throw new Error('Direct quote method not found');
      }
    } catch (directError) {
      logger.warn(`Direct quote method failed: ${directError.message}`);

      // Try alternative methods
      if (jupiterClient.quoteApi && typeof jupiterClient.quoteApi.getQuote === 'function') {
        logger.info('Using quoteApi.getQuote method');
        const quoteResponse = await jupiterClient.quoteApi.getQuote({
          inputMint: inputMintStr,
          outputMint: outputMintStr,
          amount,
          slippageBps,
          onlyDirectRoutes
        });
        return quoteResponse;
      } else if (typeof jupiterClient.quoteGet === 'function') {
        logger.info('Using quoteGet method');
        const quoteResponse = await jupiterClient.quoteGet({
          inputMint: inputMintStr,
          outputMint: outputMintStr,
          amount,
          slippageBps,
          onlyDirectRoutes
        });
        return quoteResponse;
      }

      // Try fallback method for compatibility - direct API call
      try {
        logger.info('Attempting fallback direct API call');

        // Apply rate limiting
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCallTime;
        if (timeSinceLastCall < minTimeBetweenCalls) {
          const delayNeeded = minTimeBetweenCalls - timeSinceLastCall;
          logger.debug(`Rate limiting: Waiting ${delayNeeded}ms before API call`);
          await sleep(delayNeeded);
        }
        lastApiCallTime = Date.now();

        // Construct a basic request
        const requestUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMintStr}&outputMint=${outputMintStr}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=${onlyDirectRoutes}`;

        // Use axios to make a direct API call
        const axios = require('axios');
        const response = await axios.get(requestUrl, {
          headers: {
            'User-Agent': 'SolarBot/1.0',
            'Accept': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });

        if (response.data && response.status === 200) {
          logger.info('Successfully got quote using fallback API call');
          return response.data;
        }
      } catch (fallbackError) {
        // Check if it's a rate limiting error
        if (fallbackError.response && fallbackError.response.status === 429) {
          consecutiveFailures++;
          const backoffTime = getBackoffTime();
          logger.warn(`Rate limit exceeded (${consecutiveFailures}/${maxRetries}). Backing off for ${backoffTime}ms`);

          // If we haven't exceeded max retries, wait and try again
          if (consecutiveFailures <= maxRetries) {
            await sleep(backoffTime);
            // Recursive call with the same parameters
            return getQuote(jupiterClient, inputMint, outputMint, amount, slippageBps, onlyDirectRoutes);
          }
        }

        logger.warn(`Fallback API call failed: ${fallbackError.message}`);
        // Reset consecutive failures if it's not a rate limiting error
        if (!fallbackError.response || fallbackError.response.status !== 429) {
          consecutiveFailures = 0;
        }
      }

      // If we get here, no compatible method was found
      throw new Error('No compatible Jupiter API method found');
    }
  } catch (error) {
    logger.error(`Error getting quote for ${inputMint} to ${outputMint}:`, error);
    return null;
  }
}

// Check for triangular arbitrage opportunity
async function checkTriangularArbitrage(jupiterClient, path, amount) {
  try {
    const { a, b, c, name, minProfitPercent } = path;
    const pathMinProfit = minProfitPercent || settings.trading.defaultMinProfitPercent;

    logger.info(`Checking triangular arbitrage for path: ${name}`);

    // A -> B
    const quoteAB = await getQuote(jupiterClient, a, b, amount);
    if (!quoteAB) return null;

    // B -> C
    const quoteBC = await getQuote(jupiterClient, b, c, quoteAB.outAmount);
    if (!quoteBC) return null;

    // C -> A (to complete the triangle)
    const quoteCA = await getQuote(jupiterClient, c, a, quoteBC.outAmount);
    if (!quoteCA) return null;

    // Calculate profit
    const startAmount = new BigNumber(amount);
    const endAmount = new BigNumber(quoteCA.outAmount);
    const profitAmount = endAmount.minus(startAmount);
    const profitPercent = calculateProfitPercentage(startAmount, endAmount);

    // Check if profit meets minimum threshold
    if (profitPercent >= pathMinProfit) {
      const tokenAInfo = getTokenByMint(a);
      const tokenBInfo = getTokenByMint(b);
      const tokenCInfo = getTokenByMint(c);

      const result = {
        type: 'triangular',
        name,
        path: [
          { from: tokenAInfo.symbol, to: tokenBInfo.symbol, fromAmount: formatAmount(startAmount, tokenAInfo.decimals), toAmount: formatAmount(quoteAB.outAmount, tokenBInfo.decimals) },
          { from: tokenBInfo.symbol, to: tokenCInfo.symbol, fromAmount: formatAmount(quoteAB.outAmount, tokenBInfo.decimals), toAmount: formatAmount(quoteBC.outAmount, tokenCInfo.decimals) },
          { from: tokenCInfo.symbol, to: tokenAInfo.symbol, fromAmount: formatAmount(quoteBC.outAmount, tokenCInfo.decimals), toAmount: formatAmount(endAmount, tokenAInfo.decimals) }
        ],
        startAmount: formatAmount(startAmount, tokenAInfo.decimals),
        endAmount: formatAmount(endAmount, tokenAInfo.decimals),
        profitAmount: formatAmount(profitAmount, tokenAInfo.decimals),
        profitPercent,
        timestamp: new Date().toISOString()
      };

      logger.opportunityFound(result);
      return result;
    }

    return null;
  } catch (error) {
    logger.error(`Error checking triangular arbitrage for path ${path.name}:`, error);
    return null;
  }
}

// Check for simple arbitrage opportunity between exchanges
async function checkSimpleArbitrage(jupiterClient, pair) {
  try {
    const { inputMint, outputMint, name, minProfitPercent } = pair;
    const pairMinProfit = minProfitPercent || settings.trading.defaultMinProfitPercent;

    logger.info(`Checking simple arbitrage for pair: ${name}`);

    // Get input token info
    const inputToken = getTokenByMint(inputMint);
    if (!inputToken) {
      logger.warn(`Token not found for mint: ${inputMint}`);
      return null;
    }

    // Calculate amount in token decimals
    const amount = parseAmount(
      settings.trading.defaultQuoteAmount,
      inputToken.decimals
    );

    // Get quote with default routing
    const quote1 = await getQuote(jupiterClient, inputMint, outputMint, amount);
    if (!quote1) return null;

    // Get quote with only direct routes
    const quote2 = await getQuote(jupiterClient, inputMint, outputMint, amount, 100, true);
    if (!quote2) return null;

    // Compare quotes to find arbitrage
    const outAmount1 = new BigNumber(quote1.outAmount);
    const outAmount2 = new BigNumber(quote2.outAmount);

    // If there's a significant difference, there might be an arbitrage opportunity
    const diff = outAmount1.minus(outAmount2).abs();
    const profitPercent = calculateProfitPercentage(
      BigNumber.min(outAmount1, outAmount2),
      BigNumber.max(outAmount1, outAmount2)
    );

    if (profitPercent >= pairMinProfit) {
      const outputToken = getTokenByMint(outputMint);

      const result = {
        type: 'exchange',
        pair: name,
        inputAmount: formatAmount(amount, inputToken.decimals),
        outputAmount1: formatAmount(outAmount1, outputToken.decimals),
        outputAmount2: formatAmount(outAmount2, outputToken.decimals),
        profitAmount: formatAmount(diff, outputToken.decimals),
        profitPercent,
        timestamp: new Date().toISOString()
      };

      logger.opportunityFound(result);
      return result;
    }

    return null;
  } catch (error) {
    logger.error(`Error checking simple arbitrage for pair ${pair.name}:`, error);
    return null;
  }
}

/**
 * Check for dynamic arbitrage opportunities using automatically generated paths
 * @param {Object} jupiterClient - Jupiter API client
 * @param {string} startTokenMint - The mint address of the starting token
 * @param {number} pathLength - The length of the path (3 for triangular, 4 for quadrangular, etc.)
 * @param {number} amount - The input amount in token decimals
 * @param {boolean} useDynamicPositionSizing - Whether to use dynamic position sizing
 * @returns {Promise<Object|null>} - Arbitrage opportunity if found, null otherwise
 */
async function checkDynamicArbitrage(jupiterClient, startTokenMint, pathLength, amount, useDynamicPositionSizing = false) {
  try {
    // Get token info
    const startToken = getTokenByMint(startTokenMint);
    if (!startToken) {
      logger.error(`Token not found for mint: ${startTokenMint}`);
      return null;
    }

    // Get path history to help with scoring
    const pathHistoryData = await pathHistory.getAllPathHistory();

    // Get top paths for this starting token
    const topPaths = pathFinder.getTopPaths(
      startTokenMint,
      pathLength,
      5, // Limit to top 5 paths
      WHITELISTED_TOKENS.length > 0 ? WHITELISTED_TOKENS : null,
      pathHistoryData
    );

    if (topPaths.length === 0) {
      logger.debug(`No valid paths found for token ${startToken.symbol} with length ${pathLength}`);
      return null;
    }

    // Check each path for arbitrage opportunities
    for (const pathData of topPaths) {
      const { path } = pathData;

      // Skip paths with blacklisted tokens
      if (path.some(mint => BLACKLISTED_TOKENS.includes(mint))) {
        continue;
      }

      // Determine position size if dynamic sizing is enabled
      let positionSizeUSDC = settings.trading.defaultQuoteAmount;
      let actualAmount = amount;

      if (useDynamicPositionSizing && settings.riskManagement.positionSizing?.enabled) {
        try {
          // Calculate optimal position size based on path history
          positionSizeUSDC = await positionSizing.calculateOptimalPositionSize(
            path,
            settings.riskManagement.positionSizing.maxPositionSize,
            {
              kellyFractionMultiplier: settings.riskManagement.positionSizing.kellyFractionMultiplier,
              minPositionSize: settings.riskManagement.positionSizing.minPositionSize,
              volatilityAdjustment: settings.riskManagement.positionSizing.volatilityAdjustment,
              marketVolatility: settings.riskManagement.positionSizing.marketVolatility,
              pathReliabilityWeight: settings.riskManagement.positionSizing.pathReliabilityWeight
            }
          );

          // Convert USDC amount to token amount
          actualAmount = parseAmount(positionSizeUSDC, startToken.decimals);
          logger.debug(`Using dynamic position size: ${positionSizeUSDC} USDC for path: ${pathData.tokenSymbols.join(' → ')}`);
        } catch (error) {
          logger.error('Error calculating dynamic position size:', error);
          // Fall back to default amount
          actualAmount = amount;
        }
      }

      // Execute the path and check for profit
      let currentAmount = new BigNumber(actualAmount);
      let currentTokenMint = startTokenMint;
      let currentTokenDecimals = startToken.decimals;
      const steps = [];

      // Execute each step in the path
      for (let i = 0; i < path.length - 1; i++) {
        const inputMint = path[i];
        const outputMint = path[i + 1];

        // Get quote for this step
        const quote = await getQuote(
          jupiterClient,
          inputMint,
          outputMint,
          currentAmount.toString()
        );

        if (!quote) {
          logger.debug(`Failed to get quote for step ${i+1} in path: ${pathData.tokenSymbols.join(' → ')}`);
          break;
        }

        // Update current amount and token for next step
        currentAmount = new BigNumber(quote.outAmount);
        currentTokenMint = outputMint;
        currentTokenDecimals = getTokenByMint(outputMint)?.decimals || 9;

        // Record this step
        steps.push({
          inputMint,
          outputMint,
          inputAmount: quote.inAmount,
          outputAmount: quote.outAmount,
          marketInfos: quote.marketInfos
        });
      }

      // If we completed all steps, check for profit
      if (steps.length === path.length - 1) {
        // Calculate profit
        const startAmount = new BigNumber(amount);
        const endAmount = currentAmount;
        const profitAmount = endAmount.minus(startAmount);
        const profitPercent = calculateProfitPercentage(startAmount, endAmount);

        // Record this attempt in path history
        await pathHistory.recordPathAttempt(
          path,
          profitPercent > 0,
          profitPercent
        );

        // If profitable, return the opportunity
        if (profitPercent > 0) {
          const result = {
            type: 'dynamic',
            pathLength,
            path: pathData.tokenSymbols,
            startToken: startToken.symbol,
            startAmount: formatAmount(actualAmount, startToken.decimals),
            endAmount: formatAmount(endAmount, startToken.decimals),
            profitAmount: formatAmount(profitAmount, startToken.decimals),
            profitPercent,
            positionSizeUSDC: useDynamicPositionSizing ? positionSizeUSDC : null,
            dynamicSizing: useDynamicPositionSizing,
            steps,
            timestamp: new Date().toISOString()
          };

          logger.opportunityFound(result);
          return result;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error checking dynamic arbitrage with path length ${pathLength}:`, error);
    return null;
  }
}

// Find arbitrage opportunities
async function findArbitrageOpportunities(jupiterClient, customMinProfitPercent = null) {
  try {
    logger.info('Scanning for arbitrage opportunities...');

    const opportunities = [];
    let minProfitPercent = customMinProfitPercent || settings.trading.defaultMinProfitPercent;

    // Adjust profit threshold based on gas prices if enabled
    if (settings.gasOptimization?.enabled && settings.gasOptimization?.adjustProfitThresholds) {
      const connection = getSolanaConnection();
      minProfitPercent = await gasOptimizer.adjustProfitThreshold(connection, minProfitPercent);
      logger.info(`Adjusted minimum profit threshold to ${minProfitPercent.toFixed(2)}% based on gas prices`);
    }

    // Limit concurrent requests
    const maxConcurrent = settings.scanning.maxConcurrentRequests || 3;

    // Check token pairs for simple arbitrage
    const pairPromises = [];
    for (const pair of TOKEN_PAIRS) {
      pairPromises.push(checkSimpleArbitrage(jupiterClient, pair));

      // Process in batches to avoid rate limiting
      if (pairPromises.length >= maxConcurrent) {
        const results = await Promise.all(pairPromises);
        opportunities.push(...results.filter(Boolean));
        pairPromises.length = 0;
      }
    }

    // Process any remaining pair promises
    if (pairPromises.length > 0) {
      const results = await Promise.all(pairPromises);
      opportunities.push(...results.filter(Boolean));
    }

    // Check for triangular arbitrage
    const triangularPromises = [];
    for (const path of TRIANGULAR_PATHS) {
      // Get token A info
      const tokenA = getTokenByMint(path.a);
      if (!tokenA) continue;

      // Calculate amount in token decimals
      const amount = parseAmount(
        settings.trading.defaultQuoteAmount,
        tokenA.decimals
      );

      triangularPromises.push(checkTriangularArbitrage(jupiterClient, path, amount));

      // Process in batches to avoid rate limiting
      if (triangularPromises.length >= maxConcurrent) {
        const results = await Promise.all(triangularPromises);
        opportunities.push(...results.filter(Boolean));
        triangularPromises.length = 0;
      }
    }

    // Process any remaining triangular promises
    if (triangularPromises.length > 0) {
      const results = await Promise.all(triangularPromises);
      opportunities.push(...results.filter(Boolean));
    }

    // Check for dynamic arbitrage opportunities if enabled
    if (settings.scanning.dynamicArbitrage?.enabled) {
      // Initialize path history
      await pathHistory.initializePathHistory();

      // Get dynamic arbitrage settings
      const dynamicSettings = settings.scanning.dynamicArbitrage;
      const baseTokens = dynamicSettings.baseTokens || [TOKENS.USDC.mint];
      const pathLengths = dynamicSettings.pathLengths || [3, 4];

      // Process each base token
      for (const baseTokenMint of baseTokens) {
        const baseToken = getTokenByMint(baseTokenMint);
        if (!baseToken) {
          logger.warn(`Base token not found for mint: ${baseTokenMint}`);
          continue;
        }

        // Calculate amount in token decimals
        const baseAmount = parseAmount(
          settings.trading.defaultQuoteAmount,
          baseToken.decimals
        );

        // Check each path length
        for (const pathLength of pathLengths) {
          logger.debug(`Checking dynamic arbitrage with ${baseToken.symbol} as base token and path length ${pathLength}`);

          // Use dynamic position sizing if enabled
          const useDynamicSizing = settings.riskManagement.positionSizing?.enabled || false;

          const dynamicResult = await checkDynamicArbitrage(
            jupiterClient,
            baseTokenMint,
            pathLength,
            baseAmount,
            useDynamicSizing
          );

          if (dynamicResult) {
            opportunities.push(dynamicResult);

            const positionInfo = dynamicResult.dynamicSizing
              ? `(Position: ${dynamicResult.positionSizeUSDC} USDC)`
              : '';

            logger.info(`Found dynamic arbitrage opportunity with ${baseToken.symbol} and path length ${pathLength}: ${dynamicResult.profitPercent.toFixed(2)}% ${positionInfo}`);
          }
        }
      }
    }

    // Sort opportunities by profit percentage (highest first)
    opportunities.sort((a, b) => b.profitPercent - a.profitPercent);

    // Limit the number of opportunities to process
    const limitedOpportunities = opportunities.slice(0, settings.scanning.maxOpportunities);

    if (limitedOpportunities.length > 0) {
      logger.info(`Found ${limitedOpportunities.length} arbitrage opportunities!`);

      // Log the types of opportunities found
      const opportunityTypes = {};
      limitedOpportunities.forEach(opp => {
        opportunityTypes[opp.type] = (opportunityTypes[opp.type] || 0) + 1;
      });

      logger.info(`Opportunity types: ${JSON.stringify(opportunityTypes)}`);
    }

    return limitedOpportunities;
  } catch (error) {
    logger.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}

// Execute a trade (in simulation or live mode)
async function executeTrade(jupiterClient, connection, wallet, opportunity, simulationMode = true) {
  try {
    // Check if gas prices are favorable for this trade
    if (settings.gasOptimization?.enabled && !simulationMode) {
      // Convert profit amount to lamports for gas comparison
      const profitInToken = parseFloat(opportunity.profitAmount);
      const token = getTokenBySymbol(opportunity.startToken);
      const decimals = token?.decimals || 9;
      const profitLamports = profitInToken * (10 ** decimals);

      const isGasFavorable = await gasOptimizer.isGasPriceFavorable(connection, profitLamports);

      if (!isGasFavorable) {
        logger.warn(`Skipping trade due to unfavorable gas prices. Profit: ${opportunity.profitAmount} ${opportunity.startToken}, Profit %: ${opportunity.profitPercent.toFixed(2)}%`);
        return {
          success: false,
          reason: 'unfavorable-gas-price',
          gasStats: gasOptimizer.getGasStats()
        };
      }

      logger.info(`Gas prices are favorable for trade. Proceeding with execution.`);
    }

    if (simulationMode) {
      logger.info(`Simulating trade for opportunity: ${JSON.stringify(opportunity)}`);
      return {
        success: true,
        simulation: true,
        opportunity,
        txId: 'simulation-tx-id',
        timestamp: new Date().toISOString(),
        gasStats: settings.gasOptimization?.enabled ? gasOptimizer.getGasStats() : null
      };
    }

    // For live trading, implement the actual trade execution
    // This would involve creating and sending transactions using Jupiter API

    logger.warn('Live trading not implemented yet');
    return {
      success: false,
      simulation: false,
      error: 'Live trading not implemented yet',
      opportunity,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error executing trade:', error);
    return {
      success: false,
      error: error.message,
      opportunity,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  initJupiterClient,
  getSolanaConnection,
  findArbitrageOpportunities,
  checkDynamicArbitrage,
  executeTrade,
  getTokenByMint,
  getTokenBySymbol,
  formatAmount,
  parseAmount,
  calculateProfitPercentage,
  isTokenAllowed
};
