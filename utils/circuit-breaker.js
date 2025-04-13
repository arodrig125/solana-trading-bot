/**
 * Circuit breaker for risk management
 * This module implements a circuit breaker to pause trading when certain conditions are met
 */

const logger = require('./logger');
const settings = require('../config/settings');

// Circuit breaker state
let isCircuitBreakerTriggered = false;
let consecutiveFailures = 0;
let lastFailureTime = null;
let totalFailures = 0;
let totalTransactions = 0;

/**
 * Initialize the circuit breaker
 */
function initCircuitBreaker() {
  // Reset circuit breaker state
  isCircuitBreakerTriggered = false;
  consecutiveFailures = 0;
  lastFailureTime = null;
  totalFailures = 0;
  totalTransactions = 0;
  
  logger.info('Circuit breaker initialized');
  
  // Set up automatic reset if enabled
  if (settings.riskManagement?.circuitBreaker?.autoReset) {
    const resetInterval = settings.riskManagement.circuitBreaker.resetIntervalMinutes || 60;
    
    setInterval(() => {
      if (isCircuitBreakerTriggered) {
        logger.info(`Auto-resetting circuit breaker after ${resetInterval} minutes`);
        resetCircuitBreaker();
      }
    }, resetInterval * 60 * 1000);
  }
}

/**
 * Check if the circuit breaker is triggered
 * @returns {boolean} Whether the circuit breaker is triggered
 */
function isTriggered() {
  return isCircuitBreakerTriggered;
}

/**
 * Record a successful transaction
 */
function recordSuccess() {
  // Reset consecutive failures
  consecutiveFailures = 0;
  totalTransactions++;
  
  logger.debug(`Circuit breaker: Recorded success (total: ${totalTransactions}, failures: ${totalFailures})`);
}

/**
 * Record a failed transaction
 */
function recordFailure() {
  // Increment failure counters
  consecutiveFailures++;
  totalFailures++;
  totalTransactions++;
  lastFailureTime = Date.now();
  
  logger.debug(`Circuit breaker: Recorded failure (consecutive: ${consecutiveFailures}, total: ${totalFailures}/${totalTransactions})`);
  
  // Check if circuit breaker should be triggered
  checkCircuitBreaker();
}

/**
 * Check if circuit breaker conditions are met
 */
function checkCircuitBreaker() {
  // Skip if already triggered
  if (isCircuitBreakerTriggered) {
    return;
  }
  
  // Get circuit breaker settings
  const circuitBreakerSettings = settings.riskManagement?.circuitBreaker || {};
  
  // Check consecutive failures
  const maxConsecutiveFailures = circuitBreakerSettings.maxConsecutiveFailures || 3;
  if (consecutiveFailures >= maxConsecutiveFailures) {
    triggerCircuitBreaker(`Reached ${consecutiveFailures} consecutive failures`);
    return;
  }
  
  // Check failure rate
  const maxFailureRate = circuitBreakerSettings.maxFailureRate || 0.5;
  if (totalTransactions >= 5) {
    const failureRate = totalFailures / totalTransactions;
    if (failureRate >= maxFailureRate) {
      triggerCircuitBreaker(`Failure rate of ${(failureRate * 100).toFixed(1)}% exceeds threshold of ${(maxFailureRate * 100).toFixed(1)}%`);
      return;
    }
  }
  
  // Check rapid failures
  const rapidFailureWindow = (circuitBreakerSettings.rapidFailureWindowMinutes || 5) * 60 * 1000;
  const maxRapidFailures = circuitBreakerSettings.maxRapidFailures || 2;
  
  if (lastFailureTime) {
    const recentFailures = countRecentFailures(rapidFailureWindow);
    if (recentFailures >= maxRapidFailures) {
      triggerCircuitBreaker(`${recentFailures} failures in the last ${rapidFailureWindow / 60000} minutes`);
      return;
    }
  }
}

/**
 * Count failures within a recent time window
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {number} Number of recent failures
 */
function countRecentFailures(timeWindow) {
  // This is a simplified implementation
  // In a real system, you would track timestamps of all failures
  
  // For now, just use consecutive failures if the last failure is within the window
  if (lastFailureTime && Date.now() - lastFailureTime <= timeWindow) {
    return consecutiveFailures;
  }
  
  return 0;
}

/**
 * Trigger the circuit breaker
 * @param {string} reason - Reason for triggering
 */
function triggerCircuitBreaker(reason) {
  isCircuitBreakerTriggered = true;
  
  logger.warn(`Circuit breaker triggered: ${reason}`);
  
  // Notify via Telegram or other channels if needed
  // This would be implemented in a real system
}

/**
 * Reset the circuit breaker
 */
function resetCircuitBreaker() {
  isCircuitBreakerTriggered = false;
  consecutiveFailures = 0;
  
  logger.info('Circuit breaker reset');
}

// Initialize on module load
initCircuitBreaker();

module.exports = {
  isTriggered,
  recordSuccess,
  recordFailure,
  resetCircuitBreaker
};
