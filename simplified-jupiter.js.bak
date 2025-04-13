const { createJupiterApiClient } = require('@jup-ag/api');
const { Connection, PublicKey } = require('@solana/web3.js');
const BigNumber = require('bignumber.js');
const { TOKEN_PAIRS, TOKENS, TRIANGULAR_PATHS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const settings = require('../config/settings');
const logger = require('./logger');
// Remove dependency on pathFinder
// const pathFinder = require('./pathFinder');
// const pathHistory = require('./pathHistory');
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
  const endpoint = process.env.SOLANA_RPC_ENDPOINT || settings.solana.rpcEndpoint;
  logger.info(`Using RPC endpoint: ${endpoint}`);
  return new Connection(endpoint);
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

// Check if a token is allowed
function isTokenAllowed(tokenMint) {
  // Convert to string if it's a PublicKey
  const mintStr = tokenMint instanceof PublicKey ? tokenMint.toString() : tokenMint;
  
  // If whitelist is enabled, check if token is in whitelist
  if (WHITELISTED_TOKENS.length > 0) {
    return WHITELISTED_TOKENS.includes(mintStr);
  }
  
  // If blacklist is enabled, check if token is not in blacklist
  if (BLACKLISTED_TOKENS.length > 0) {
    return !BLACKLISTED_TOKENS.includes(mintStr);
  }
  
  // If no whitelist or blacklist, allow all tokens
  return true;
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

// Calculate profit percentage
function calculateProfitPercentage(inputAmount, outputAmount) {
  const input = new BigNumber(inputAmount);
  const output = new BigNumber(outputAmount);
  
  if (input.isZero()) {
    return 0;
  }
  
  return output.minus(input).dividedBy(input).multipliedBy(100).toNumber();
}

// Export functions
module.exports = {
  initJupiterClient,
  getSolanaConnection,
  getQuote,
  calculateProfitPercentage,
  isTokenAllowed
};
