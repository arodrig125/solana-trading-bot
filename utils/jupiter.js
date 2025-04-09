const { createJupiterApiClient } = require('@jup-ag/api');
const { Connection, PublicKey } = require('@solana/web3.js');
const BigNumber = require('bignumber.js');
const { TOKEN_PAIRS, TOKENS, TRIANGULAR_PATHS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const settings = require('../config/settings');
const logger = require('./logger');

// Initialize Jupiter API client
function initJupiterClient() {
  return createJupiterApiClient();
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

// Get quote for a token swap
async function getQuote(jupiterClient, inputMint, outputMint, amount, slippageBps = 100, onlyDirectRoutes = false) {
  try {
    // Check if tokens are allowed
    if (!isTokenAllowed(inputMint) || !isTokenAllowed(outputMint)) {
      logger.warn(`Quote skipped: Token not allowed (${inputMint} -> ${outputMint})`);
      return null;
    }
    
    // Updated for Jupiter API v6
    const quoteApi = jupiterClient.quoteApi;
    if (!quoteApi) {
      logger.error(`Jupiter API client doesn't have quoteApi method`);
      return null;
    }
    
    const quoteResponse = await quoteApi.getQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps,
      onlyDirectRoutes
    });
    
    return quoteResponse;
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

// Find arbitrage opportunities
async function findArbitrageOpportunities(jupiterClient, customMinProfitPercent = null) {
  try {
    logger.info('Scanning for arbitrage opportunities...');
    
    const opportunities = [];
    const minProfitPercent = customMinProfitPercent || settings.trading.defaultMinProfitPercent;
    
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
    
    // Sort opportunities by profit percentage (highest first)
    opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
    
    // Limit the number of opportunities to process
    const limitedOpportunities = opportunities.slice(0, settings.scanning.maxOpportunities);
    
    if (limitedOpportunities.length > 0) {
      logger.info(`Found ${limitedOpportunities.length} arbitrage opportunities!`);
    }
    
    return limitedOpportunities;
  } catch (error) {
    logger.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}

// Execute a trade (in simulation or live mode)
async function executeTrade(jupiterClient, connection, wallet, opportunity, simulationMode = true) {
  if (simulationMode) {
    logger.info(`Simulating trade for opportunity: ${JSON.stringify(opportunity)}`);
    return {
      success: true,
      simulation: true,
      opportunity,
      txId: 'simulation-tx-id',
      timestamp: new Date().toISOString()
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
}

module.exports = {
  initJupiterClient,
  getSolanaConnection,
  findArbitrageOpportunities,
  executeTrade,
  getTokenByMint,
  formatAmount,
  parseAmount,
  calculateProfitPercentage,
  isTokenAllowed
};
