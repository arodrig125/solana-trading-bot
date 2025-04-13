/**
 * Jupiter API integration for Solana arbitrage bot
 * This file contains functions for interacting with Jupiter API
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { createJupiterApiClient } = require('@jup-ag/api');
const BigNumber = require('bignumber.js');
const logger = require('./logger');
const settings = require('../config/settings');
const { TOKENS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const gasOptimizer = require('./gas-optimizer');
const pathHistory = require('./path-history');
const positionSizing = require('./position-sizing');
const circuitBreaker = require('./circuit-breaker');
const pathFinder = require('./path-finder');

// Track consecutive failures for backoff
let consecutiveFailures = 0;

// Initialize Jupiter API client
async function initJupiterClient() {
  // Get Solana connection
  const connection = getSolanaConnection();

  // Initialize Jupiter API client with v6 options
  const jupiterClient = createJupiterApiClient({
    connection,
    cluster: 'mainnet-beta',
    wrapUnwrapSOL: true,
    routeCacheDuration: 30 // Cache routes for 30 seconds
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
  const endpoint = settings.rpc.endpoint;
  const connection = new Connection(endpoint, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60000
  });
  return connection;
}

// Calculate profit percentage
function calculateProfitPercentage(inputAmount, outputAmount) {
  return new BigNumber(outputAmount).minus(inputAmount).dividedBy(inputAmount).multipliedBy(100).toNumber();
}

// Format amount with token decimals
function formatAmount(amount, decimals) {
  return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toNumber();
}

// Parse amount to token decimals
function parseAmount(amount, decimals) {
  return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0);
}

// Get token by mint address
function getTokenByMint(mint) {
  return Object.values(TOKENS).find(token => token.mint === mint);
}

// Get token by symbol
function getTokenBySymbol(symbol) {
  return Object.values(TOKENS).find(token => token.symbol === symbol);
}

// Check if token is allowed
function isTokenAllowed(mint) {
  // If whitelist is empty, allow all tokens except blacklisted ones
  if (WHITELISTED_TOKENS.length === 0) {
    return !BLACKLISTED_TOKENS.includes(mint);
  }

  // Otherwise, only allow whitelisted tokens
  return WHITELISTED_TOKENS.includes(mint);
}

// Calculate backoff time based on consecutive failures
function calculateBackoffTime() {
  // Start with 1 second, then 2, then 4, etc.
  return Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 10000); // Max 10 seconds
}

// Performance metrics for API calls
let performanceMetrics;
try {
  performanceMetrics = require('./performance-metrics');
} catch (error) {
  logger.debug('Performance metrics module not available');
  performanceMetrics = null;
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

    // Since we know the direct method is failing, go straight to the fallback API call
    try {
      // Construct a basic request to Jupiter API v6
      const requestUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMintStr}&outputMint=${outputMintStr}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=${onlyDirectRoutes}`;

      // Track API call performance
      const apiCallStart = Date.now();

      // Use axios to make a direct API call
      const axios = require('axios');
      const response = await axios.get(requestUrl);

      // Record API call performance
      const apiCallDuration = Date.now() - apiCallStart;
      if (performanceMetrics) {
        performanceMetrics.recordApiCall('jupiter/quote', true, apiCallDuration);
      }

      if (response.data && response.status === 200) {
        // Only log on debug level to reduce noise
        logger.debug('Got quote using Jupiter API v6');
        return response.data;
      }
    } catch (error) {
      // Record failed API call
      if (performanceMetrics) {
        performanceMetrics.recordApiCall('jupiter/quote', false, Date.now() - (apiCallStart || Date.now()));
      }

      logger.warn(`Jupiter API call failed for ${inputMintStr} to ${outputMintStr}: ${error.message}`);
    }

    // If we get here, no compatible method was found
    throw new Error('No compatible Jupiter API method found');
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
    // Set a maximum reasonable profit percentage to filter out erroneous results
    const maxReasonableProfitPercent = 5.0; // 5% is already extremely high for arbitrage

    logger.info(`Checking triangular arbitrage for path: ${name}`);

    // Get token info
    const tokenAInfo = getTokenByMint(a);
    const tokenBInfo = getTokenByMint(b);
    const tokenCInfo = getTokenByMint(c);

    if (!tokenAInfo || !tokenBInfo || !tokenCInfo) {
      logger.warn(`One or more tokens not found for path: ${name}`);
      return null;
    }

    // A -> B
    const quoteAB = await getQuote(jupiterClient, a, b, amount);
    if (!quoteAB) return null;

    // B -> C
    const quoteBC = await getQuote(jupiterClient, b, c, quoteAB.outAmount);
    if (!quoteBC) return null;

    // C -> A (to complete the triangle)
    const quoteCA = await getQuote(jupiterClient, c, a, quoteBC.outAmount);
    if (!quoteCA) return null;

    // Validate the output amounts
    const outAmountAB = new BigNumber(quoteAB.outAmount);
    const outAmountBC = new BigNumber(quoteBC.outAmount);
    const outAmountCA = new BigNumber(quoteCA.outAmount);

    if (outAmountAB.isNaN() || outAmountBC.isNaN() || outAmountCA.isNaN() ||
        outAmountAB.lte(0) || outAmountBC.lte(0) || outAmountCA.lte(0)) {
      logger.warn(`Invalid output amounts for path ${name}`);
      return null;
    }

    // Calculate profit
    const startAmount = new BigNumber(amount);
    const endAmount = outAmountCA;
    const profitAmount = endAmount.minus(startAmount);
    const profitPercent = calculateProfitPercentage(startAmount, endAmount);

    // Filter out unrealistic profit percentages
    if (profitPercent > maxReasonableProfitPercent) {
      logger.warn(`Unrealistic profit percentage for ${name}: ${profitPercent.toFixed(2)}% - likely an error`);
      return null;
    }

    // Check if profit meets minimum threshold
    if (profitPercent >= pathMinProfit) {
      // Format amounts for display
      const formattedStartAmount = formatAmount(startAmount, tokenAInfo.decimals);
      const formattedEndAmount = formatAmount(endAmount, tokenAInfo.decimals);
      const formattedProfitAmount = formatAmount(profitAmount, tokenAInfo.decimals);

      // Sanity check: ensure the profit amount is reasonable
      if (formattedProfitAmount > formattedStartAmount * 0.1) { // Profit > 10% of start amount
        logger.warn(`Suspiciously high profit for ${name}: ${formattedProfitAmount} from ${formattedStartAmount} ${tokenAInfo.symbol}`);
        // We'll still return it but with a warning since triangular arb can sometimes have higher profits
      }

      const result = {
        type: 'triangular',
        name,
        path: [
          { from: tokenAInfo.symbol, to: tokenBInfo.symbol, fromAmount: formatAmount(startAmount, tokenAInfo.decimals), toAmount: formatAmount(outAmountAB, tokenBInfo.decimals) },
          { from: tokenBInfo.symbol, to: tokenCInfo.symbol, fromAmount: formatAmount(outAmountAB, tokenBInfo.decimals), toAmount: formatAmount(outAmountBC, tokenCInfo.decimals) },
          { from: tokenCInfo.symbol, to: tokenAInfo.symbol, fromAmount: formatAmount(outAmountBC, tokenCInfo.decimals), toAmount: formatAmount(endAmount, tokenAInfo.decimals) }
        ],
        startAmount: formattedStartAmount,
        endAmount: formattedEndAmount,
        profitAmount: formattedProfitAmount,
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
    // Set a maximum reasonable profit percentage to filter out erroneous results
    const maxReasonableProfitPercent = 5.0; // 5% is already extremely high for arbitrage

    logger.info(`Checking simple arbitrage for pair: ${name}`);

    // Get input token info
    const inputToken = getTokenByMint(inputMint);
    if (!inputToken) {
      logger.warn(`Token not found for mint: ${inputMint}`);
      return null;
    }

    // Get output token info
    const outputToken = getTokenByMint(outputMint);
    if (!outputToken) {
      logger.warn(`Token not found for mint: ${outputMint}`);
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

    // Validate the output amounts
    if (outAmount1.isNaN() || outAmount2.isNaN() || outAmount1.lte(0) || outAmount2.lte(0)) {
      logger.warn(`Invalid output amounts for pair ${name}: ${outAmount1.toString()} and ${outAmount2.toString()}`);
      return null;
    }

    // Sanity check: ensure the output amounts are within a reasonable range
    // For example, for BTC, if input is 100 USDC, output should be around 0.0015 BTC
    const formattedOutAmount1 = formatAmount(outAmount1, outputToken.decimals);
    const formattedOutAmount2 = formatAmount(outAmount2, outputToken.decimals);

    // If the output amounts are too large compared to input, it's likely an error
    const inputAmountFormatted = formatAmount(amount, inputToken.decimals);

    // Token-specific validation based on known price ranges
    if (outputToken.symbol === 'BTC') {
      // BTC price is ~65,000 USDC, so 100 USDC should get ~0.0015 BTC
      const maxReasonableBTC = inputAmountFormatted / 50000; // Conservative estimate
      if (formattedOutAmount1 > maxReasonableBTC || formattedOutAmount2 > maxReasonableBTC) {
        logger.warn(`Unrealistic BTC output amounts for ${name}: ${formattedOutAmount1} and ${formattedOutAmount2} from ${inputAmountFormatted} ${inputToken.symbol}`);
        return null;
      }
    } else if (outputToken.symbol === 'ETH') {
      // ETH price is ~3,000 USDC, so 100 USDC should get ~0.033 ETH
      const maxReasonableETH = inputAmountFormatted / 2000; // Conservative estimate
      if (formattedOutAmount1 > maxReasonableETH || formattedOutAmount2 > maxReasonableETH) {
        logger.warn(`Unrealistic ETH output amounts for ${name}: ${formattedOutAmount1} and ${formattedOutAmount2} from ${inputAmountFormatted} ${inputToken.symbol}`);
        return null;
      }
    } else if (outputToken.symbol === 'SOL') {
      // SOL price is ~150 USDC, so 100 USDC should get ~0.67 SOL
      const maxReasonableSOL = inputAmountFormatted / 100; // Conservative estimate
      if (formattedOutAmount1 > maxReasonableSOL * 1.5 || formattedOutAmount2 > maxReasonableSOL * 1.5) {
        logger.warn(`Unrealistic SOL output amounts for ${name}: ${formattedOutAmount1} and ${formattedOutAmount2} from ${inputAmountFormatted} ${inputToken.symbol}`);
        return null;
      }
    } else if (outputToken.category === 'major' && (formattedOutAmount1 > inputAmountFormatted * 10 || formattedOutAmount2 > inputAmountFormatted * 10)) {
      // General check for other major tokens
      logger.warn(`Unrealistic output amounts for ${name}: ${formattedOutAmount1} and ${formattedOutAmount2} from ${inputAmountFormatted} ${inputToken.symbol}`);
      return null;
    }

    // If there's a significant difference, there might be an arbitrage opportunity
    const diff = outAmount1.minus(outAmount2).abs();
    const profitPercent = calculateProfitPercentage(
      BigNumber.min(outAmount1, outAmount2),
      BigNumber.max(outAmount1, outAmount2)
    );

    // Filter out unrealistic profit percentages
    if (profitPercent > maxReasonableProfitPercent) {
      logger.warn(`Unrealistic profit percentage for ${name}: ${profitPercent.toFixed(2)}% - likely an error`);
      return null;
    }

    if (profitPercent >= pairMinProfit) {
      const result = {
        type: 'exchange',
        pair: name,
        inputAmount: inputAmountFormatted,
        outputAmount1: formattedOutAmount1,
        outputAmount2: formattedOutAmount2,
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
    // Set a maximum reasonable profit percentage to filter out erroneous results
    const maxReasonableProfitPercent = 10.0; // 10% is already extremely high for arbitrage

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

        // Validate the output amount
        const outAmount = new BigNumber(quote.outAmount);
        if (outAmount.isNaN() || outAmount.lte(0)) {
          logger.warn(`Invalid output amount in path step ${i+1}: ${outAmount.toString()}`);
          break;
        }

        // Update current amount and token for next step
        currentAmount = outAmount;
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

        // Filter out unrealistic profit percentages
        if (profitPercent > maxReasonableProfitPercent) {
          logger.warn(`Unrealistic profit percentage for path: ${pathData.tokenSymbols.join(' → ')}: ${profitPercent.toFixed(2)}% - likely an error`);
          continue;
        }

        // Record this attempt in path history
        await pathHistory.recordPathAttempt(
          path,
          profitPercent > 0,
          profitPercent
        );

        // If profitable, return the opportunity
        if (profitPercent > 0) {
          // Format amounts for display
          const formattedStartAmount = formatAmount(startAmount, startToken.decimals);
          const formattedEndAmount = formatAmount(endAmount, startToken.decimals);
          const formattedProfitAmount = formatAmount(profitAmount, startToken.decimals);

          // Sanity check: ensure the profit amount is reasonable
          if (formattedProfitAmount > formattedStartAmount * 0.1) { // Profit > 10% of start amount
            logger.warn(`Suspiciously high profit for path: ${pathData.tokenSymbols.join(' → ')}: ${formattedProfitAmount} from ${formattedStartAmount} ${startToken.symbol}`);
            // We'll still return it but with a warning
          }

          const result = {
            type: 'dynamic',
            pathLength,
            path: pathData.tokenSymbols,
            startToken: startToken.symbol,
            startAmount: formattedStartAmount,
            endAmount: formattedEndAmount,
            profitAmount: formattedProfitAmount,
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
    logger.error('Error checking dynamic arbitrage:', error);
    return null;
  }
}

// Execute a swap transaction
async function executeSwap(jupiterClient, wallet, inputMint, outputMint, amount, slippageBps = 100) {
  try {
    // Check if circuit breaker is triggered
    if (circuitBreaker.isTriggered()) {
      logger.warn('Circuit breaker triggered, skipping swap execution');
      return null;
    }

    // Get quote
    const quote = await getQuote(jupiterClient, inputMint, outputMint, amount, slippageBps);
    if (!quote) {
      logger.error('Failed to get quote for swap execution');
      return null;
    }

    // Create transaction
    const { swapTransaction } = await jupiterClient.createSwapTransaction({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toString(),
      wrapUnwrapSOL: true
    });

    // Sign and send transaction
    const signature = await wallet.signAndSendTransaction(swapTransaction);
    logger.info(`Swap transaction sent: ${signature}`);

    // Wait for confirmation
    const connection = getSolanaConnection();
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      logger.error(`Swap transaction failed: ${confirmation.value.err}`);
      return null;
    }

    logger.info(`Swap transaction confirmed: ${signature}`);
    return {
      signature,
      inputMint,
      outputMint,
      inputAmount: formatAmount(amount, getTokenByMint(inputMint).decimals),
      outputAmount: formatAmount(quote.outAmount, getTokenByMint(outputMint).decimals),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error executing swap:', error);
    circuitBreaker.recordFailure();
    return null;
  }
}

/**
 * Find arbitrage opportunities across different markets
 * @param {Object} jupiterClient - Jupiter API client
 * @param {number} minProfitPercent - Minimum profit percentage to consider
 * @returns {Promise<Array>} - Array of arbitrage opportunities
 */
async function findArbitrageOpportunities(jupiterClient, minProfitPercent) {
  // Import performance metrics
  let performanceMetrics;
  try {
    performanceMetrics = require('./performance-metrics');
  } catch (error) {
    logger.debug('Performance metrics module not available');
    performanceMetrics = null;
  }

  // Start performance tracking
  const scanStartTime = performanceMetrics ? performanceMetrics.recordScanStart() : Date.now();

  logger.info('Scanning for arbitrage opportunities...');
  logger.info(`Using RPC endpoint: ${settings.rpc.endpoint}`);

  // Adjust minimum profit threshold based on gas prices if enabled
  let adjustedMinProfit = minProfitPercent;
  if (settings.gasOptimization?.adjustProfitThresholds) {
    // Simple adjustment for now
    adjustedMinProfit = Math.max(minProfitPercent, 0.5);
    logger.info(`Adjusted minimum profit threshold to ${adjustedMinProfit.toFixed(2)}% based on gas prices`);
  }

  const opportunities = [];
  const parallelProcessor = require('./parallel-processor');

  // Check simple arbitrage opportunities (exchange arbitrage)
  const pairs = [
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'USDC-USDT' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'So11111111111111111111111111111111111111112', name: 'USDC-SOL' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'USDC-BTC' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'USDC-ETH' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'USDC-JUP' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', name: 'USDC-RAY' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'USDC-BONK' },
    { inputMint: 'So11111111111111111111111111111111111111112', outputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'SOL-BTC' },
    { inputMint: 'So11111111111111111111111111111111111111112', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'SOL-ETH' },
    { inputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'BTC-ETH' }
  ];

  // Process simple arbitrage opportunities in parallel
  const simpleResults = await parallelProcessor.processArbitragePairs(
    pairs,
    checkSimpleArbitrage,
    jupiterClient,
    settings.scanning.maxConcurrentRequests
  );

  // Add valid results to opportunities
  simpleResults.filter(Boolean).forEach(result => {
    opportunities.push(result);
    logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
    if (performanceMetrics) performanceMetrics.recordOpportunity(result);
  });

  // Check triangular arbitrage opportunities
  const paths = [
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'So11111111111111111111111111111111111111112', c: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'USDC-SOL-BTC' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'So11111111111111111111111111111111111111112', c: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'USDC-SOL-ETH' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', c: 'So11111111111111111111111111111111111111112', name: 'USDC-JUP-SOL' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', c: 'So11111111111111111111111111111111111111112', name: 'USDC-BONK-SOL' }
  ];

  // Process triangular arbitrage opportunities in parallel
  const amount = '100000000'; // 100 USDC with 6 decimals
  const triangularResults = await parallelProcessor.processArbitragePaths(
    paths,
    checkTriangularArbitrage,
    jupiterClient,
    amount,
    settings.scanning.maxConcurrentRequests
  );

  // Add valid results to opportunities
  triangularResults.filter(Boolean).forEach(result => {
    opportunities.push(result);
    logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
    if (performanceMetrics) performanceMetrics.recordOpportunity(result);
  });

  // Check dynamic arbitrage opportunities if enabled
  if (settings.scanning.dynamicArbitrage?.enabled) {
    try {
      // Get path history
      const pathHistoryData = await pathHistory.getAllPathHistory();

      // Prepare dynamic arbitrage tasks
      const dynamicTasks = [];

      // For each base token and path length, create a task
      for (const baseTokenMint of settings.scanning.dynamicArbitrage.baseTokens) {
        for (const pathLength of settings.scanning.dynamicArbitrage.pathLengths) {
          // Get amount based on token
          const baseToken = getTokenByMint(baseTokenMint);
          if (!baseToken) continue;

          const tokenAmount = parseAmount(
            settings.trading.defaultQuoteAmount,
            baseToken.decimals
          );

          // Add task
          dynamicTasks.push({
            baseTokenMint,
            pathLength,
            amount: tokenAmount,
            useDynamicPositionSizing: settings.riskManagement.positionSizing?.enabled
          });
        }
      }

      // Process dynamic arbitrage tasks in parallel
      const dynamicResults = await parallelProcessor.processInParallel(
        dynamicTasks,
        async (task) => {
          return await checkDynamicArbitrage(
            jupiterClient,
            task.baseTokenMint,
            task.pathLength,
            task.amount,
            task.useDynamicPositionSizing
          );
        },
        settings.scanning.maxConcurrentRequests
      );

      // Add valid results to opportunities
      dynamicResults.filter(Boolean).forEach(result => {
        opportunities.push(result);
        logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
        if (performanceMetrics) performanceMetrics.recordOpportunity(result);
      });
    } catch (error) {
      logger.error('Error checking dynamic arbitrage:', error);
    }
  }

  // Log opportunity types
  if (opportunities.length > 0) {
    const types = opportunities.reduce((acc, opp) => {
      acc[opp.type] = (acc[opp.type] || 0) + 1;
      return acc;
    }, {});
    logger.info(`Opportunity types: ${JSON.stringify(types)}`);
  }

  // Record scan completion
  if (performanceMetrics) {
    performanceMetrics.recordScanEnd(scanStartTime, opportunities.length);
  }

  return opportunities;
}

module.exports = {
  initJupiterClient,
  getQuote,
  checkTriangularArbitrage,
  checkSimpleArbitrage,
  checkDynamicArbitrage,
  executeSwap,
  formatAmount,
  parseAmount,
  getTokenByMint,
  getTokenBySymbol,
  calculateProfitPercentage,
  findArbitrageOpportunities
};
