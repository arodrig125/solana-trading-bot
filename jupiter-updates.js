// Initialize Jupiter API client
async function initJupiterClient() {
  // Get Solana connection
  const connection = getSolanaConnection();
  
  // Initialize Jupiter API client with v7 options
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

    // Try the direct method first (for v7)
    try {
      // Check if quote method exists
      if (typeof jupiterClient.quote === 'function') {
        logger.info('Using direct quote method');
        const quoteResponse = await jupiterClient.quote({
          inputMint: inputMintStr,
          outputMint: outputMintStr,
          amount,
          slippageBps,
          onlyDirectRoutes,
          // Add additional parameters for v7
          asLegacyTransaction: false,
          maxAccounts: 64
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
        
        // Construct a basic request
        const requestUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMintStr}&outputMint=${outputMintStr}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=${onlyDirectRoutes}`;
        
        // Use axios to make a direct API call
        const axios = require('axios');
        const response = await axios.get(requestUrl);
        
        if (response.data && response.status === 200) {
          logger.info('Successfully got quote using fallback API call');
          return response.data;
        }
      } catch (fallbackError) {
        logger.warn(`Fallback API call failed: ${fallbackError.message}`);
      }

      // If we get here, no compatible method was found
      throw new Error('No compatible Jupiter API method found');
    }
  } catch (error) {
    logger.error(`Error getting quote for ${inputMint} to ${outputMint}:`, error);
    return null;
  }
}
