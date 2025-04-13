/**
 * Risk Management System for SolarBot
 * 
 * This module provides advanced risk management features:
 * - Dynamic position sizing based on account balance and market volatility
 * - Stop-loss and take-profit functionality
 * - Risk scoring for arbitrage opportunities
 */

const logger = require('./logger');
const { getWalletBalance } = require('./wallet');
const tierManager = require('./tier-manager');
const fs = require('fs');
const path = require('path');

// Constants
const DEFAULT_RISK_LEVEL = 'medium';
const DEFAULT_MAX_POSITION_SIZE_PERCENT = 10; // 10% of wallet balance
const DEFAULT_STOP_LOSS_PERCENT = 1; // 1% loss triggers stop
const DEFAULT_TAKE_PROFIT_PERCENT = 0.5; // 0.5% profit triggers take profit
const DEFAULT_MAX_SLIPPAGE = 0.5; // 0.5% maximum allowed slippage
const DEFAULT_VOLATILITY_MULTIPLIER = 1.0; // Multiplier for volatility adjustment

// Risk levels and their parameters
const RISK_LEVELS = {
  low: {
    maxPositionSizePercent: 5,
    stopLossPercent: 0.5,
    takeProfitPercent: 0.3,
    maxSlippage: 0.3,
    volatilityMultiplier: 0.7,
    minProfitThreshold: 0.3
  },
  medium: {
    maxPositionSizePercent: 10,
    stopLossPercent: 1.0,
    takeProfitPercent: 0.5,
    maxSlippage: 0.5,
    volatilityMultiplier: 1.0,
    minProfitThreshold: 0.2
  },
  high: {
    maxPositionSizePercent: 20,
    stopLossPercent: 2.0,
    takeProfitPercent: 0.7,
    maxSlippage: 0.8,
    volatilityMultiplier: 1.3,
    minProfitThreshold: 0.1
  }
};

// Path to risk settings data file
const dataDir = path.join(__dirname, '..', 'data');
const riskSettingsFile = path.join(dataDir, 'risk-settings.json');

// In-memory cache of user risk settings
let userRiskSettings = {};

// Volatility data for tokens
let tokenVolatility = {};

/**
 * Initialize the risk manager
 */
function initializeRiskManager() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing risk settings
  if (fs.existsSync(riskSettingsFile)) {
    try {
      userRiskSettings = JSON.parse(fs.readFileSync(riskSettingsFile, 'utf8'));
      logger.info(`Loaded risk settings for ${Object.keys(userRiskSettings).length} users`);
    } catch (error) {
      logger.errorMessage('Error loading risk settings:', error);
      userRiskSettings = {};
    }
  } else {
    logger.info('No risk settings file found, starting with default settings');
    userRiskSettings = {};
  }

  // Initialize token volatility data
  loadTokenVolatility();
}

/**
 * Load token volatility data
 */
function loadTokenVolatility() {
  const volatilityFile = path.join(dataDir, 'token-volatility.json');
  
  if (fs.existsSync(volatilityFile)) {
    try {
      tokenVolatility = JSON.parse(fs.readFileSync(volatilityFile, 'utf8'));
      logger.info(`Loaded volatility data for ${Object.keys(tokenVolatility).length} tokens`);
    } catch (error) {
      logger.errorMessage('Error loading token volatility data:', error);
      tokenVolatility = {};
    }
  } else {
    logger.info('No token volatility file found, starting with empty data');
    tokenVolatility = {};
  }
}

/**
 * Save risk settings to disk
 */
function saveRiskSettings() {
  try {
    fs.writeFileSync(riskSettingsFile, JSON.stringify(userRiskSettings, null, 2));
    return true;
  } catch (error) {
    logger.errorMessage('Error saving risk settings:', error);
    return false;
  }
}

/**
 * Update token volatility data
 * @param {string} token - Token symbol
 * @param {number} volatility - Volatility score (0-100)
 */
function updateTokenVolatility(token, volatility) {
  tokenVolatility[token] = volatility;
  
  try {
    const volatilityFile = path.join(dataDir, 'token-volatility.json');
    fs.writeFileSync(volatilityFile, JSON.stringify(tokenVolatility, null, 2));
    return true;
  } catch (error) {
    logger.errorMessage('Error saving token volatility data:', error);
    return false;
  }
}

/**
 * Get token volatility
 * @param {string} token - Token symbol
 * @returns {number} - Volatility score (0-100, default 50)
 */
function getTokenVolatility(token) {
  return tokenVolatility[token] || 50; // Default to medium volatility
}

/**
 * Set user risk level
 * @param {string} userId - User ID
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {boolean} - Success status
 */
function setUserRiskLevel(userId, riskLevel) {
  // Validate risk level
  if (!RISK_LEVELS[riskLevel]) {
    logger.errorMessage(`Invalid risk level: ${riskLevel}`);
    return false;
  }

  // Initialize user settings if they don't exist
  if (!userRiskSettings[userId]) {
    userRiskSettings[userId] = {};
  }

  // Set risk level
  userRiskSettings[userId].riskLevel = riskLevel;

  // Save to disk
  return saveRiskSettings();
}

/**
 * Get user risk level
 * @param {string} userId - User ID
 * @returns {string} - Risk level (low, medium, high)
 */
function getUserRiskLevel(userId) {
  if (!userRiskSettings[userId] || !userRiskSettings[userId].riskLevel) {
    return DEFAULT_RISK_LEVEL;
  }
  return userRiskSettings[userId].riskLevel;
}

/**
 * Set custom risk parameter for user
 * @param {string} userId - User ID
 * @param {string} paramName - Parameter name
 * @param {any} value - Parameter value
 * @returns {boolean} - Success status
 */
function setRiskParameter(userId, paramName, value) {
  // Initialize user settings if they don't exist
  if (!userRiskSettings[userId]) {
    userRiskSettings[userId] = {};
  }

  // Initialize custom parameters if they don't exist
  if (!userRiskSettings[userId].customParams) {
    userRiskSettings[userId].customParams = {};
  }

  // Set parameter
  userRiskSettings[userId].customParams[paramName] = value;

  // Save to disk
  return saveRiskSettings();
}

/**
 * Get risk parameter for user
 * @param {string} userId - User ID
 * @param {string} paramName - Parameter name
 * @returns {any} - Parameter value
 */
function getRiskParameter(userId, paramName) {
  const riskLevel = getUserRiskLevel(userId);
  
  // Check if user has custom parameter
  if (
    userRiskSettings[userId] && 
    userRiskSettings[userId].customParams && 
    userRiskSettings[userId].customParams[paramName] !== undefined
  ) {
    return userRiskSettings[userId].customParams[paramName];
  }
  
  // Return parameter from risk level
  return RISK_LEVELS[riskLevel][paramName];
}

/**
 * Calculate optimal position size based on wallet balance, risk level, and market conditions
 * @param {string} userId - User ID
 * @param {number} walletBalance - Wallet balance in SOL
 * @param {Object} opportunity - Arbitrage opportunity
 * @returns {number} - Optimal position size in SOL
 */
async function calculatePositionSize(userId, walletBalance, opportunity) {
  // Get user's tier to check if they have access to advanced position sizing
  const userTier = tierManager.getUserTier(userId);
  
  // For STARTER tier, use a simple fixed percentage
  if (userTier === 'STARTER') {
    const maxPercent = getRiskParameter(userId, 'maxPositionSizePercent');
    return walletBalance * (maxPercent / 100);
  }
  
  // For higher tiers, use more sophisticated position sizing
  
  // Get risk parameters
  const maxPositionSizePercent = getRiskParameter(userId, 'maxPositionSizePercent');
  const volatilityMultiplier = getRiskParameter(userId, 'volatilityMultiplier');
  
  // Calculate base position size
  let positionSize = walletBalance * (maxPositionSizePercent / 100);
  
  // Adjust for opportunity risk score
  const riskScore = calculateRiskScore(opportunity);
  const riskAdjustment = 1 - (riskScore / 100);
  positionSize *= riskAdjustment;
  
  // Adjust for token volatility
  if (opportunity.pair) {
    const tokens = opportunity.pair.split('/');
    const token1Volatility = getTokenVolatility(tokens[0]);
    const token2Volatility = getTokenVolatility(tokens[1]);
    const avgVolatility = (token1Volatility + token2Volatility) / 2;
    
    // Higher volatility = smaller position size
    const volatilityAdjustment = 1 - ((avgVolatility - 50) / 100 * volatilityMultiplier);
    positionSize *= volatilityAdjustment;
  }
  
  // Adjust for profit potential
  const profitPercent = opportunity.profitPercent || 0;
  const minProfitThreshold = getRiskParameter(userId, 'minProfitThreshold');
  
  // Higher profit potential = larger position size (up to 50% increase)
  if (profitPercent > minProfitThreshold) {
    const profitMultiplier = 1 + Math.min((profitPercent - minProfitThreshold) / 10, 0.5);
    positionSize *= profitMultiplier;
  }
  
  // Ensure position size doesn't exceed maximum allowed
  const absoluteMaxSize = walletBalance * (maxPositionSizePercent / 100);
  positionSize = Math.min(positionSize, absoluteMaxSize);
  
  // Ensure position size is positive
  positionSize = Math.max(positionSize, 0);
  
  return positionSize;
}

/**
 * Calculate risk score for an arbitrage opportunity (0-100)
 * @param {Object} opportunity - Arbitrage opportunity
 * @returns {number} - Risk score (0-100, higher = riskier)
 */
function calculateRiskScore(opportunity) {
  let riskScore = 50; // Start with medium risk
  
  // Adjust based on opportunity type
  if (opportunity.type === 'simple') {
    // Simple arbitrage is less risky
    riskScore -= 10;
  } else if (opportunity.type === 'triangular') {
    // Triangular arbitrage is more complex
    riskScore += 10;
  } else if (opportunity.type === 'multi-hop') {
    // Multi-hop is even more complex
    riskScore += 20;
  }
  
  // Adjust based on profit percentage
  const profitPercent = opportunity.profitPercent || 0;
  if (profitPercent > 5) {
    // Very high profit opportunities are often riskier
    riskScore += 15;
  } else if (profitPercent > 2) {
    // Good profit, slightly higher risk
    riskScore += 5;
  } else if (profitPercent < 0.5) {
    // Low profit, might not be worth the risk
    riskScore += 10;
  }
  
  // Adjust based on DEXes involved
  if (opportunity.path) {
    const dexes = new Set();
    opportunity.path.forEach(step => {
      if (step.dex) dexes.add(step.dex);
    });
    
    // More DEXes = more complexity and risk
    if (dexes.size > 2) {
      riskScore += 5 * (dexes.size - 2);
    }
  }
  
  // Adjust based on tokens involved
  if (opportunity.pair) {
    const tokens = opportunity.pair.split('/');
    
    // Check token volatility
    const token1Volatility = getTokenVolatility(tokens[0]);
    const token2Volatility = getTokenVolatility(tokens[1]);
    const avgVolatility = (token1Volatility + token2Volatility) / 2;
    
    // Adjust risk score based on volatility
    riskScore += (avgVolatility - 50) / 2;
  }
  
  // Ensure risk score is within bounds
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  return riskScore;
}

/**
 * Check if a trade should be executed based on risk parameters
 * @param {string} userId - User ID
 * @param {Object} opportunity - Arbitrage opportunity
 * @returns {Object} - { execute: boolean, reason: string }
 */
function shouldExecuteTrade(userId, opportunity) {
  // Get risk parameters
  const minProfitThreshold = getRiskParameter(userId, 'minProfitThreshold');
  const maxSlippage = getRiskParameter(userId, 'maxSlippage');
  
  // Check profit threshold
  if (opportunity.profitPercent < minProfitThreshold) {
    return { 
      execute: false, 
      reason: `Profit (${opportunity.profitPercent.toFixed(2)}%) below threshold (${minProfitThreshold}%)`
    };
  }
  
  // Check estimated slippage
  if (opportunity.estimatedSlippage && opportunity.estimatedSlippage > maxSlippage) {
    return { 
      execute: false, 
      reason: `Estimated slippage (${opportunity.estimatedSlippage.toFixed(2)}%) exceeds maximum (${maxSlippage}%)`
    };
  }
  
  // Check risk score
  const riskScore = calculateRiskScore(opportunity);
  const riskLevel = getUserRiskLevel(userId);
  
  // Different risk thresholds based on risk level
  const riskThresholds = {
    low: 60,
    medium: 75,
    high: 85
  };
  
  if (riskScore > riskThresholds[riskLevel]) {
    return { 
      execute: false, 
      reason: `Risk score (${riskScore}) exceeds threshold for ${riskLevel} risk level (${riskThresholds[riskLevel]})`
    };
  }
  
  // All checks passed
  return { execute: true, reason: 'Opportunity meets risk criteria' };
}

/**
 * Check if stop-loss should be triggered
 * @param {string} userId - User ID
 * @param {Object} trade - Trade object
 * @param {number} currentValue - Current value of the position
 * @returns {boolean} - Whether stop-loss should be triggered
 */
function checkStopLoss(userId, trade, currentValue) {
  const stopLossPercent = getRiskParameter(userId, 'stopLossPercent');
  const initialValue = trade.initialValue || trade.amount;
  
  // Calculate loss percentage
  const lossPercent = ((initialValue - currentValue) / initialValue) * 100;
  
  // Check if loss exceeds stop-loss threshold
  return lossPercent >= stopLossPercent;
}

/**
 * Check if take-profit should be triggered
 * @param {string} userId - User ID
 * @param {Object} trade - Trade object
 * @param {number} currentValue - Current value of the position
 * @returns {boolean} - Whether take-profit should be triggered
 */
function checkTakeProfit(userId, trade, currentValue) {
  const takeProfitPercent = getRiskParameter(userId, 'takeProfitPercent');
  const initialValue = trade.initialValue || trade.amount;
  
  // Calculate profit percentage
  const profitPercent = ((currentValue - initialValue) / initialValue) * 100;
  
  // Check if profit exceeds take-profit threshold
  return profitPercent >= takeProfitPercent;
}

/**
 * Get risk settings summary for a user
 * @param {string} userId - User ID
 * @returns {Object} - Risk settings summary
 */
function getRiskSettingsSummary(userId) {
  const riskLevel = getUserRiskLevel(userId);
  const maxPositionSizePercent = getRiskParameter(userId, 'maxPositionSizePercent');
  const stopLossPercent = getRiskParameter(userId, 'stopLossPercent');
  const takeProfitPercent = getRiskParameter(userId, 'takeProfitPercent');
  const maxSlippage = getRiskParameter(userId, 'maxSlippage');
  const minProfitThreshold = getRiskParameter(userId, 'minProfitThreshold');
  
  return {
    riskLevel,
    maxPositionSizePercent,
    stopLossPercent,
    takeProfitPercent,
    maxSlippage,
    minProfitThreshold
  };
}

// Initialize on module load
initializeRiskManager();

module.exports = {
  setUserRiskLevel,
  getUserRiskLevel,
  setRiskParameter,
  getRiskParameter,
  calculatePositionSize,
  calculateRiskScore,
  shouldExecuteTrade,
  checkStopLoss,
  checkTakeProfit,
  updateTokenVolatility,
  getTokenVolatility,
  getRiskSettingsSummary,
  RISK_LEVELS
};
