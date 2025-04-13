/**
 * Advanced circuit breaker module for risk management
 * This module implements a multi-level circuit breaker system
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const settings = require('../config/settings');

// Circuit breaker state
let circuitBreakerState = {
  enabled: true,
  status: 'normal', // 'normal', 'warning', 'triggered', 'recovery'
  consecutiveLosses: 0,
  totalLosses: 0,
  lastLossTimestamp: null,
  recoveryStartTimestamp: null,
  currentLevel: 0, // 0 = normal, 1 = level 1 (warning), 2 = level 2 (reduced), 3 = level 3 (minimal), 4 = full stop
  positionSizeMultiplier: 1.0, // Multiplier for position sizes (reduced during recovery)
  lastUpdated: Date.now(),
  history: []
};

// File path for persistent storage
const STATE_FILE_PATH = path.join(__dirname, '../data/circuit_breaker_state.json');

/**
 * Initialize the circuit breaker
 * @returns {Promise<Object>} - The circuit breaker state
 */
async function initializeCircuitBreaker() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(STATE_FILE_PATH);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    
    // Try to load existing state file
    try {
      const data = await fs.readFile(STATE_FILE_PATH, 'utf8');
      circuitBreakerState = JSON.parse(data);
      logger.info(`Loaded circuit breaker state: ${circuitBreakerState.status}, level: ${circuitBreakerState.currentLevel}`);
    } catch (err) {
      // File might not exist yet, that's fine
      if (err.code !== 'ENOENT') {
        throw err;
      }
      logger.info('No existing circuit breaker state found, starting fresh');
    }
    
    // Check if we need to update recovery status
    await checkRecoveryProgress();
    
    return circuitBreakerState;
  } catch (error) {
    logger.error('Error initializing circuit breaker', error);
    return circuitBreakerState;
  }
}

/**
 * Save the current circuit breaker state to disk
 * @returns {Promise<void>}
 */
async function saveCircuitBreakerState() {
  try {
    // Update timestamp
    circuitBreakerState.lastUpdated = Date.now();
    
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(circuitBreakerState, null, 2), 'utf8');
    logger.debug('Circuit breaker state saved to disk');
  } catch (error) {
    logger.error('Error saving circuit breaker state', error);
  }
}

/**
 * Check if the circuit breaker is triggered
 * @returns {boolean} - Whether the circuit breaker is triggered
 */
function isCircuitBreakerTriggered() {
  return circuitBreakerState.status === 'triggered' || circuitBreakerState.status === 'recovery';
}

/**
 * Get the current position size multiplier based on circuit breaker state
 * @returns {number} - Position size multiplier (0-1)
 */
function getPositionSizeMultiplier() {
  return circuitBreakerState.positionSizeMultiplier;
}

/**
 * Check if trading is allowed based on circuit breaker state
 * @returns {boolean} - Whether trading is allowed
 */
function isTradingAllowed() {
  // If circuit breaker is disabled, always allow trading
  if (!circuitBreakerState.enabled) {
    return true;
  }
  
  // If circuit breaker is in full stop (level 4), don't allow trading
  if (circuitBreakerState.currentLevel >= 4) {
    return false;
  }
  
  // Otherwise, trading is allowed (possibly with reduced position sizes)
  return true;
}

/**
 * Update circuit breaker state based on trade result
 * @param {boolean} success - Whether the trade was successful
 * @param {number} profitPercent - Profit percentage (can be negative)
 * @returns {Promise<Object>} - Updated circuit breaker state
 */
async function updateCircuitBreaker(success, profitPercent) {
  // If circuit breaker is disabled, don't update state
  if (!circuitBreakerState.enabled) {
    return circuitBreakerState;
  }
  
  // Get circuit breaker settings
  const cbSettings = settings.riskManagement.circuitBreaker || {};
  const thresholds = cbSettings.thresholds || [3, 5, 7]; // Default thresholds for levels 1, 2, 3
  
  // Record trade result in history
  circuitBreakerState.history.push({
    timestamp: Date.now(),
    success,
    profitPercent
  });
  
  // Keep only the most recent 100 trades
  if (circuitBreakerState.history.length > 100) {
    circuitBreakerState.history.shift();
  }
  
  // If trade was successful, reset consecutive losses
  if (success) {
    // If we're in recovery mode, stay there but improve the position size multiplier
    if (circuitBreakerState.status === 'recovery') {
      // Gradually increase position size multiplier
      circuitBreakerState.positionSizeMultiplier = Math.min(
        1.0, // Maximum multiplier
        circuitBreakerState.positionSizeMultiplier + 0.1 // Increase by 10% per successful trade
      );
      
      // If we've fully recovered, reset to normal
      if (circuitBreakerState.positionSizeMultiplier >= 1.0) {
        resetCircuitBreaker();
      }
    } else {
      // Reset consecutive losses if not in recovery mode
      circuitBreakerState.consecutiveLosses = 0;
      
      // If we were in warning state, go back to normal
      if (circuitBreakerState.status === 'warning') {
        circuitBreakerState.status = 'normal';
        circuitBreakerState.currentLevel = 0;
        circuitBreakerState.positionSizeMultiplier = 1.0;
      }
    }
  } else {
    // Trade was unsuccessful
    circuitBreakerState.consecutiveLosses += 1;
    circuitBreakerState.totalLosses += 1;
    circuitBreakerState.lastLossTimestamp = Date.now();
    
    // Update circuit breaker level based on consecutive losses
    if (circuitBreakerState.consecutiveLosses >= thresholds[2]) {
      // Level 3 (minimal trading) or higher
      circuitBreakerState.status = 'triggered';
      circuitBreakerState.currentLevel = 3;
      circuitBreakerState.positionSizeMultiplier = 0.25; // 25% of normal position size
      
      // If we've had too many consecutive losses, go to full stop
      if (circuitBreakerState.consecutiveLosses >= thresholds[2] + 2) {
        circuitBreakerState.currentLevel = 4; // Full stop
        circuitBreakerState.positionSizeMultiplier = 0;
      }
    } else if (circuitBreakerState.consecutiveLosses >= thresholds[1]) {
      // Level 2 (reduced trading)
      circuitBreakerState.status = 'triggered';
      circuitBreakerState.currentLevel = 2;
      circuitBreakerState.positionSizeMultiplier = 0.5; // 50% of normal position size
    } else if (circuitBreakerState.consecutiveLosses >= thresholds[0]) {
      // Level 1 (warning)
      circuitBreakerState.status = 'warning';
      circuitBreakerState.currentLevel = 1;
      circuitBreakerState.positionSizeMultiplier = 0.75; // 75% of normal position size
    }
    
    // If circuit breaker is triggered, log a warning
    if (circuitBreakerState.status === 'triggered') {
      logger.warn(`Circuit breaker triggered at level ${circuitBreakerState.currentLevel} after ${circuitBreakerState.consecutiveLosses} consecutive losses`);
      
      // If we're at full stop, start recovery mode after a cooldown period
      if (circuitBreakerState.currentLevel >= 4 && !circuitBreakerState.recoveryStartTimestamp) {
        const cooldownPeriod = cbSettings.cooldownPeriodMs || 3600000; // Default: 1 hour
        
        // Schedule recovery to start after cooldown
        circuitBreakerState.recoveryStartTimestamp = Date.now() + cooldownPeriod;
        logger.warn(`Circuit breaker in full stop. Recovery will begin in ${cooldownPeriod / 60000} minutes`);
      }
    }
  }
  
  // Save updated state
  await saveCircuitBreakerState();
  
  return circuitBreakerState;
}

/**
 * Check if it's time to progress in recovery mode
 * @returns {Promise<void>}
 */
async function checkRecoveryProgress() {
  // If not in triggered state or no recovery timestamp, nothing to do
  if (
    circuitBreakerState.status !== 'triggered' || 
    !circuitBreakerState.recoveryStartTimestamp
  ) {
    return;
  }
  
  const now = Date.now();
  
  // If it's time to start recovery
  if (now >= circuitBreakerState.recoveryStartTimestamp) {
    circuitBreakerState.status = 'recovery';
    circuitBreakerState.currentLevel = 3; // Start at level 3 (minimal trading)
    circuitBreakerState.positionSizeMultiplier = 0.25; // Start with 25% of normal position size
    
    logger.info('Circuit breaker entering recovery mode');
    
    // Save updated state
    await saveCircuitBreakerState();
  }
}

/**
 * Reset the circuit breaker to normal state
 * @returns {Promise<void>}
 */
async function resetCircuitBreaker() {
  circuitBreakerState.status = 'normal';
  circuitBreakerState.consecutiveLosses = 0;
  circuitBreakerState.currentLevel = 0;
  circuitBreakerState.positionSizeMultiplier = 1.0;
  circuitBreakerState.recoveryStartTimestamp = null;
  
  logger.info('Circuit breaker reset to normal state');
  
  // Save updated state
  await saveCircuitBreakerState();
}

/**
 * Enable or disable the circuit breaker
 * @param {boolean} enabled - Whether to enable the circuit breaker
 * @returns {Promise<void>}
 */
async function setCircuitBreakerEnabled(enabled) {
  circuitBreakerState.enabled = enabled;
  
  if (enabled) {
    logger.info('Circuit breaker enabled');
  } else {
    logger.info('Circuit breaker disabled');
  }
  
  // Save updated state
  await saveCircuitBreakerState();
}

/**
 * Get circuit breaker statistics and status
 * @returns {Object} - Circuit breaker statistics
 */
function getCircuitBreakerStats() {
  // Calculate win rate from history
  let winCount = 0;
  let totalTrades = circuitBreakerState.history.length;
  
  if (totalTrades > 0) {
    winCount = circuitBreakerState.history.filter(trade => trade.success).length;
  }
  
  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  
  return {
    enabled: circuitBreakerState.enabled,
    status: circuitBreakerState.status,
    level: circuitBreakerState.currentLevel,
    consecutiveLosses: circuitBreakerState.consecutiveLosses,
    totalLosses: circuitBreakerState.totalLosses,
    positionSizeMultiplier: circuitBreakerState.positionSizeMultiplier,
    tradingAllowed: isTradingAllowed(),
    winRate: winRate,
    totalTrades: totalTrades,
    recoveryStartTime: circuitBreakerState.recoveryStartTimestamp 
      ? new Date(circuitBreakerState.recoveryStartTimestamp).toISOString() 
      : null,
    lastUpdated: new Date(circuitBreakerState.lastUpdated).toISOString()
  };
}

module.exports = {
  initializeCircuitBreaker,
  isCircuitBreakerTriggered,
  getPositionSizeMultiplier,
  isTradingAllowed,
  updateCircuitBreaker,
  checkRecoveryProgress,
  resetCircuitBreaker,
  setCircuitBreakerEnabled,
  getCircuitBreakerStats
};
