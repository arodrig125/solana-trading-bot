/**
 * Test script for Telegram command integration
 * This script tests the new Telegram commands for gas optimization and circuit breaker
 */

require('dotenv').config();
const { 
  getSolanaConnection
} = require('./utils/jupiter');
const logger = require('./utils/logger');
const gasOptimizer = require('./utils/gasOptimizer');
const circuitBreaker = require('./utils/circuitBreaker');
const {
  formatGasStats,
  formatCircuitBreakerStatus
} = require('./utils/telegram');

async function testTelegramCommands() {
  try {
    logger.startupMessage('Testing Telegram command integration...');
    
    // Initialize connection
    const connection = getSolanaConnection();
    logger.info('Solana connection initialized');
    
    // Test gas stats formatting
    logger.info('Testing gas stats formatting...');
    
    // Initialize gas optimizer
    await gasOptimizer.initializeGasOptimizer(connection);
    
    // Format gas stats
    const gasStatsMessage = await formatGasStats(connection);
    logger.info('Gas stats message:');
    console.log(gasStatsMessage);
    
    // Test circuit breaker status formatting
    logger.info('\nTesting circuit breaker status formatting...');
    
    // Initialize circuit breaker
    await circuitBreaker.initializeCircuitBreaker();
    
    // Format circuit breaker status
    const circuitBreakerMessage = await formatCircuitBreakerStatus();
    logger.info('Circuit breaker message:');
    console.log(circuitBreakerMessage);
    
    // Test circuit breaker operations
    logger.info('\nTesting circuit breaker operations...');
    
    // Reset circuit breaker
    await circuitBreaker.resetCircuitBreaker();
    logger.info('Circuit breaker reset');
    
    // Simulate some losses to trigger circuit breaker
    logger.info('Simulating losses to trigger circuit breaker...');
    await circuitBreaker.updateCircuitBreaker(false, -0.5);
    await circuitBreaker.updateCircuitBreaker(false, -0.7);
    await circuitBreaker.updateCircuitBreaker(false, -0.6);
    
    // Get updated circuit breaker status
    const updatedCircuitBreakerMessage = await formatCircuitBreakerStatus();
    logger.info('Updated circuit breaker message:');
    console.log(updatedCircuitBreakerMessage);
    
    logger.successMessage('Telegram command integration test completed');
  } catch (error) {
    logger.errorMessage('Error testing Telegram command integration', error);
  }
}

// Run the test
testTelegramCommands().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
