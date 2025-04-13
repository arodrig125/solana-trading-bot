/**
 * Example usage of the Solana Trading Bot API
 * This demonstrates how to interact with the API using the client library
 */

const TradingBotClient = require('./client');

// Example usage
async function main() {
  // Create a client instance
  const client = new TradingBotClient('http://localhost:3000');
  
  try {
    // 1. Check API health
    console.log('Checking API health...');
    const health = await client.checkHealth();
    console.log('API Health:', health);
    
    // 2. Generate an API key (in production, this would be done through an admin interface)
    console.log('\nGenerating API key...');
    const keyResult = await client.generateApiKey('user123', 'pro', 'Test API Key');
    console.log('API Key generated:', keyResult);
    
    // Set the token for authenticated requests
    client.setToken(keyResult.token);
    
    // 3. Initialize wallets
    // IMPORTANT: In production, never hardcode private keys!
    console.log('\nInitializing wallets...');
    const walletResult = await client.initializeWallets([
      process.env.PRIVATE_KEY, // Load from environment variables
      process.env.PRIVATE_KEY_2 // Optional second key
    ].filter(Boolean)); // Filter out undefined keys
    console.log('Wallets initialized:', walletResult);
    
    // 4. Get wallet information
    console.log('\nGetting wallet information...');
    const walletInfo = await client.getWalletInfo();
    console.log('Wallet info:', walletInfo);
    
    // 5. Get available tokens
    console.log('\nGetting available tokens...');
    const tokens = await client.getTokens();
    console.log(`Retrieved ${tokens.tokens.length} tokens`);
    
    // 6. Get token pairs
    console.log('\nGetting token pairs...');
    const pairs = await client.getTokenPairs();
    console.log(`Retrieved ${pairs.pairs.length} token pairs`);
    
    // 7. Find arbitrage opportunities
    console.log('\nFinding arbitrage opportunities...');
    const opportunities = await client.findOpportunities(1.0); // Min 1% profit
    console.log(`Found ${opportunities.count} opportunities`);
    if (opportunities.count > 0) {
      console.log('First opportunity:', opportunities.opportunities[0]);
      
      // 8. Execute a trade (simulation mode)
      console.log('\nExecuting trade in simulation mode...');
      const tradeResult = await client.executeTrade(
        opportunities.opportunities[0],
        true // Simulation mode
      );
      console.log('Trade result:', tradeResult);
    }
    
    console.log('\nAPI integration test completed successfully!');
  } catch (error) {
    console.error('Error in API test:', error.message);
  }
}

// Run the example
main().catch(console.error);
