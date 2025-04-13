/**
 * Gas optimization module for Solana transactions
 * This module monitors and predicts gas prices to optimize transaction timing and costs
 */

const { Connection } = require('@solana/web3.js');
const settings = require('../config/settings');
const logger = require('./logger');

// In-memory cache for gas prices
let gasPriceCache = {
  current: null,
  history: [],
  lastUpdated: 0,
  updateInterval: 60000, // 1 minute in milliseconds
};

/**
 * Initialize the gas optimizer
 * @param {Connection} connection - Solana connection object
 * @returns {Promise<void>}
 */
async function initializeGasOptimizer(connection) {
  try {
    // Perform initial gas price fetch
    await updateGasPrice(connection);
    logger.info('Gas optimizer initialized');
  } catch (error) {
    logger.error('Error initializing gas optimizer:', error);
  }
}

/**
 * Update the current gas price
 * @param {Connection} connection - Solana connection object
 * @returns {Promise<number>} - Current gas price in lamports
 */
async function updateGasPrice(connection) {
  try {
    // Check if we need to update
    const now = Date.now();
    if (
      gasPriceCache.current !== null &&
      now - gasPriceCache.lastUpdated < gasPriceCache.updateInterval
    ) {
      return gasPriceCache.current;
    }

    // Get recent prioritization fees
    const recentPrioritizationFees = await connection.getRecentPrioritizationFees();
    
    if (!recentPrioritizationFees || recentPrioritizationFees.length === 0) {
      // If no recent fees, use default value
      gasPriceCache.current = settings.gasOptimization?.defaultPrioritizationFee || 5000;
      logger.debug(`No recent prioritization fees found, using default: ${gasPriceCache.current} lamports`);
    } else {
      // Calculate average of recent fees
      const recentFees = recentPrioritizationFees.slice(0, 20); // Use last 20 fees
      const sum = recentFees.reduce((acc, fee) => acc + fee.prioritizationFee, 0);
      const avgFee = Math.ceil(sum / recentFees.length);
      
      // Update cache
      gasPriceCache.current = avgFee;
      
      // Add to history (keep last 100 data points)
      gasPriceCache.history.push({
        timestamp: now,
        price: avgFee
      });
      
      if (gasPriceCache.history.length > 100) {
        gasPriceCache.history.shift();
      }
      
      logger.debug(`Updated gas price: ${avgFee} lamports`);
    }
    
    gasPriceCache.lastUpdated = now;
    return gasPriceCache.current;
  } catch (error) {
    logger.error('Error updating gas price:', error);
    // Return last known price or default
    return gasPriceCache.current || (settings.gasOptimization?.defaultPrioritizationFee || 5000);
  }
}

/**
 * Get the current gas price
 * @param {Connection} connection - Solana connection object
 * @returns {Promise<number>} - Current gas price in lamports
 */
async function getCurrentGasPrice(connection) {
  // Check if we need to update
  const now = Date.now();
  if (
    gasPriceCache.current === null ||
    now - gasPriceCache.lastUpdated >= gasPriceCache.updateInterval
  ) {
    return await updateGasPrice(connection);
  }
  return gasPriceCache.current;
}

/**
 * Predict gas price trend based on historical data
 * @returns {string} - 'increasing', 'decreasing', or 'stable'
 */
function predictGasTrend() {
  if (gasPriceCache.history.length < 5) {
    return 'stable'; // Not enough data
  }
  
  // Get the last 5 data points
  const recentPrices = gasPriceCache.history.slice(-5).map(item => item.price);
  
  // Calculate simple linear regression
  const n = recentPrices.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((acc, val) => acc + val, 0);
  const sumY = recentPrices.reduce((acc, val) => acc + val, 0);
  const sumXY = indices.reduce((acc, i) => acc + (i * recentPrices[i]), 0);
  const sumXX = indices.reduce((acc, val) => acc + (val * val), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Determine trend based on slope
  if (Math.abs(slope) < 50) {
    return 'stable';
  } else if (slope > 0) {
    return 'increasing';
  } else {
    return 'decreasing';
  }
}

/**
 * Check if current gas price is favorable for trading
 * @param {Connection} connection - Solana connection object
 * @param {number} profitAmount - Expected profit amount in lamports
 * @returns {Promise<boolean>} - Whether gas price is favorable
 */
async function isGasPriceFavorable(connection, profitAmount) {
  const currentGasPrice = await getCurrentGasPrice(connection);
  const gasTrend = predictGasTrend();
  
  // Get thresholds from settings
  const settings_gas = settings.gasOptimization || {};
  const highThreshold = settings_gas.highGasThreshold || 10000; // 10,000 lamports
  const mediumThreshold = settings_gas.mediumGasThreshold || 5000; // 5,000 lamports
  
  // Calculate estimated transaction cost
  // For Solana, we need to consider both the base fee and prioritization fee
  const baseFee = 5000; // Default base fee in lamports
  const estimatedTxCost = baseFee + currentGasPrice;
  
  // Calculate profit after gas costs
  const profitAfterGas = profitAmount - estimatedTxCost;
  
  // Check if profit covers gas with sufficient margin
  const minProfitMargin = settings_gas.minProfitMarginMultiplier || 2;
  const isProfitable = profitAfterGas > estimatedTxCost * minProfitMargin;
  
  // If gas price is very high, only proceed if extremely profitable
  if (currentGasPrice > highThreshold) {
    logger.debug(`Gas price is high (${currentGasPrice} lamports). Requiring higher profit margin.`);
    return isProfitable && profitAfterGas > estimatedTxCost * 3;
  }
  
  // If gas price is medium but trending down, we might want to wait
  if (currentGasPrice > mediumThreshold && gasTrend === 'decreasing') {
    logger.debug(`Gas price is medium (${currentGasPrice} lamports) but trending down. Waiting might be beneficial.`);
    return isProfitable && profitAfterGas > estimatedTxCost * 2;
  }
  
  // For low gas prices or other scenarios
  return isProfitable;
}

/**
 * Adjust profit threshold based on current gas prices
 * @param {Connection} connection - Solana connection object
 * @param {number} baseThreshold - Base profit threshold percentage
 * @returns {Promise<number>} - Adjusted profit threshold percentage
 */
async function adjustProfitThreshold(connection, baseThreshold) {
  const currentGasPrice = await getCurrentGasPrice(connection);
  const gasTrend = predictGasTrend();
  
  // Get thresholds from settings
  const settings_gas = settings.gasOptimization || {};
  const highThreshold = settings_gas.highGasThreshold || 10000;
  const mediumThreshold = settings_gas.mediumGasThreshold || 5000;
  
  // Adjust threshold based on gas price
  let adjustment = 0;
  
  if (currentGasPrice > highThreshold) {
    // High gas price, increase threshold significantly
    adjustment = baseThreshold * 0.5; // 50% increase
    logger.debug(`Increasing profit threshold by 50% due to high gas price (${currentGasPrice} lamports)`);
  } else if (currentGasPrice > mediumThreshold) {
    // Medium gas price, increase threshold moderately
    adjustment = baseThreshold * 0.25; // 25% increase
    logger.debug(`Increasing profit threshold by 25% due to medium gas price (${currentGasPrice} lamports)`);
  } else if (gasTrend === 'increasing') {
    // Gas price is trending up, slight increase
    adjustment = baseThreshold * 0.1; // 10% increase
    logger.debug(`Increasing profit threshold by 10% due to increasing gas trend`);
  } else if (gasTrend === 'decreasing' && currentGasPrice < mediumThreshold) {
    // Gas price is low and trending down, slight decrease
    adjustment = -baseThreshold * 0.05; // 5% decrease
    logger.debug(`Decreasing profit threshold by 5% due to decreasing gas trend and low price`);
  }
  
  // Ensure the adjusted threshold is not negative
  return Math.max(baseThreshold + adjustment, 0.1);
}

/**
 * Get gas price statistics
 * @returns {Object} - Gas price statistics
 */
function getGasStats() {
  if (gasPriceCache.history.length === 0) {
    return {
      current: gasPriceCache.current || 0,
      average: 0,
      min: 0,
      max: 0,
      trend: 'unknown'
    };
  }
  
  const prices = gasPriceCache.history.map(item => item.price);
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  return {
    current: gasPriceCache.current,
    average: Math.round(avg),
    min,
    max,
    trend: predictGasTrend(),
    lastUpdated: new Date(gasPriceCache.lastUpdated).toISOString()
  };
}

module.exports = {
  initializeGasOptimizer,
  getCurrentGasPrice,
  updateGasPrice,
  predictGasTrend,
  isGasPriceFavorable,
  adjustProfitThreshold,
  getGasStats
};
