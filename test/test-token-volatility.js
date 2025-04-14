const assert = require('assert');
const tokenVolatility = require('../utils/tokenVolatility');
const logger = require('../utils/logger');

async function testTokenVolatility() {
  logger.info('🧪 Testing token volatility tracking...');

  // Test recording prices
  const testToken = 'SOL/USDC';
  const basePrice = 100;
  const now = Date.now();
  
  // Simulate price movements over 5 minutes
  for (let i = 0; i < 30; i++) {
    const noise = (Math.random() - 0.5) * 2; // Random price movement between -1 and 1
    const price = basePrice + noise;
    const timestamp = now - (30 - i) * 10000; // 10 second intervals
    tokenVolatility.recordPrice(testToken, price, timestamp);
  }
  
  // Get volatility metrics
  const volatility = tokenVolatility.getTokenVolatility(testToken);
  assert(volatility, 'Volatility metrics should exist');
  assert(typeof volatility.short === 'number', 'Short-term volatility should be a number');
  assert(typeof volatility.medium === 'number', 'Medium-term volatility should be a number');
  assert(typeof volatility.long === 'number', 'Long-term volatility should be a number');
  
  logger.info('Volatility metrics for', testToken, ':', volatility);
  
  // Test high volatility detection
  const highVolTokens = tokenVolatility.getHighVolatilityTokens(0); // Set threshold to 0 to ensure we get our test token
  assert(highVolTokens.length > 0, 'Should detect high volatility tokens');
  assert(highVolTokens.some(t => t.symbol === testToken), 'Test token should be in high volatility list');
  
  logger.info('High volatility tokens:', highVolTokens);
  
  // Test data cleanup
  tokenVolatility.cleanupOldData();
  const volatilityAfterCleanup = tokenVolatility.getTokenVolatility(testToken);
  assert(volatilityAfterCleanup, 'Volatility data should still exist after cleanup');
  
  logger.info('✅ Token volatility tests passed');
}

// Run tests
testTokenVolatility()
  .then(() => {
    logger.info('All tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('❌ Error testing token volatility:', error);
    process.exit(1);
  });
