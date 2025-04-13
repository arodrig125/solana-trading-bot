/**
 * Test script for advanced circuit breaker
 * This script tests the circuit breaker functionality
 */

require('dotenv').config();
const logger = require('./utils/logger');
const circuitBreaker = require('./utils/circuitBreaker');

async function testCircuitBreaker() {
  try {
    logger.startupMessage('Testing advanced circuit breaker...');
    
    // Initialize circuit breaker
    await circuitBreaker.initializeCircuitBreaker();
    logger.info('Circuit breaker initialized');
    
    // Get initial stats
    const initialStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Initial circuit breaker state: ${JSON.stringify(initialStats, null, 2)}`);
    
    // Test with successful trades
    logger.info('Simulating successful trades...');
    await circuitBreaker.updateCircuitBreaker(true, 1.5);
    await circuitBreaker.updateCircuitBreaker(true, 0.8);
    
    const afterSuccessStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state after successful trades: ${JSON.stringify(afterSuccessStats, null, 2)}`);
    
    // Test with losing trades
    logger.info('Simulating losing trades...');
    await circuitBreaker.updateCircuitBreaker(false, -0.5);
    await circuitBreaker.updateCircuitBreaker(false, -0.7);
    
    const afterTwoLossesStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state after 2 losses: ${JSON.stringify(afterTwoLossesStats, null, 2)}`);
    
    // Trigger level 1 (warning)
    logger.info('Triggering circuit breaker level 1 (warning)...');
    await circuitBreaker.updateCircuitBreaker(false, -0.6);
    
    const warningStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state at warning level: ${JSON.stringify(warningStats, null, 2)}`);
    
    // Trigger level 2 (reduced trading)
    logger.info('Triggering circuit breaker level 2 (reduced trading)...');
    await circuitBreaker.updateCircuitBreaker(false, -0.8);
    await circuitBreaker.updateCircuitBreaker(false, -0.4);
    
    const reducedStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state at reduced level: ${JSON.stringify(reducedStats, null, 2)}`);
    
    // Trigger level 3 (minimal trading)
    logger.info('Triggering circuit breaker level 3 (minimal trading)...');
    await circuitBreaker.updateCircuitBreaker(false, -0.9);
    await circuitBreaker.updateCircuitBreaker(false, -1.2);
    
    const minimalStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state at minimal level: ${JSON.stringify(minimalStats, null, 2)}`);
    
    // Trigger level 4 (full stop)
    logger.info('Triggering circuit breaker level 4 (full stop)...');
    await circuitBreaker.updateCircuitBreaker(false, -1.5);
    await circuitBreaker.updateCircuitBreaker(false, -2.0);
    
    const fullStopStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state at full stop: ${JSON.stringify(fullStopStats, null, 2)}`);
    
    // Check if trading is allowed
    const tradingAllowed = circuitBreaker.isTradingAllowed();
    logger.info(`Trading allowed: ${tradingAllowed}`);
    
    // Get position size multiplier
    const multiplier = circuitBreaker.getPositionSizeMultiplier();
    logger.info(`Position size multiplier: ${multiplier}`);
    
    // Manually reset circuit breaker
    logger.info('Resetting circuit breaker...');
    await circuitBreaker.resetCircuitBreaker();
    
    const resetStats = circuitBreaker.getCircuitBreakerStats();
    logger.info(`Circuit breaker state after reset: ${JSON.stringify(resetStats, null, 2)}`);
    
    logger.successMessage('Circuit breaker test completed');
  } catch (error) {
    logger.errorMessage('Error testing circuit breaker', error);
  }
}

// Run the test
testCircuitBreaker().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
