/**
 * Gas optimization utilities for Solana transactions
 * This module helps optimize gas usage for arbitrage transactions
 */

const logger = require('./logger');
const settings = require('../config/settings');

// Track gas prices over time
let gasPriceHistory = [];
let isInitialized = false;

/**
 * Initialize the gas optimizer
 * @param {Connection} connection - Solana connection
 */
async function initializeGasOptimizer(connection) {
  if (!settings.gasOptimization?.enabled) {
    logger.info('Gas optimization is disabled');
    return;
  }

  try {
    // Get current gas price
    const recentBlockhash = await connection.getLatestBlockhash();
    const currentGasPrice = recentBlockhash.feeCalculator.lamportsPerSignature;
    
    // Initialize gas price history
    gasPriceHistory.push({
      price: currentGasPrice,
      timestamp: Date.now()
    });
    
    isInitialized = true;
    logger.info(`Gas optimizer initialized with current price: ${currentGasPrice} lamports`);
    
    // Set up periodic gas price updates
    setInterval(async () => {
      try {
        const recentBlockhash = await connection.getLatestBlockhash();
        const currentGasPrice = recentBlockhash.feeCalculator.lamportsPerSignature;
        
        // Add to history
        gasPriceHistory.push({
          price: currentGasPrice,
          timestamp: Date.now()
        });
        
        // Keep only recent history (last hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        gasPriceHistory = gasPriceHistory.filter(entry => entry.timestamp >= oneHourAgo);
        
        logger.debug(`Updated gas price: ${currentGasPrice} lamports`);
      } catch (error) {
        logger.error('Error updating gas price:', error);
      }
    }, 60000); // Update every minute
  } catch (error) {
    logger.error('Error initializing gas optimizer:', error);
  }
}

/**
 * Get the current optimal gas price
 * @returns {number} Optimal gas price in lamports
 */
function getOptimalGasPrice() {
  if (!isInitialized || gasPriceHistory.length === 0) {
    return settings.gasOptimization?.defaultGasPrice || 5000;
  }
  
  // Get average gas price from recent history
  const sum = gasPriceHistory.reduce((total, entry) => total + entry.price, 0);
  const average = sum / gasPriceHistory.length;
  
  // Apply multiplier based on settings
  const multiplier = settings.gasOptimization?.gasMultiplier || 1.1;
  const optimalPrice = Math.ceil(average * multiplier);
  
  // Ensure price is within bounds
  const minPrice = settings.gasOptimization?.minGasPrice || 5000;
  const maxPrice = settings.gasOptimization?.maxGasPrice || 100000;
  
  return Math.max(minPrice, Math.min(optimalPrice, maxPrice));
}

/**
 * Check if a transaction is profitable after gas costs
 * @param {number} profitLamports - Profit in lamports
 * @param {number} estimatedGasLamports - Estimated gas cost in lamports
 * @returns {boolean} Whether the transaction is profitable
 */
function isProfitableAfterGas(profitLamports, estimatedGasLamports) {
  // Apply safety margin
  const safetyMargin = settings.gasOptimization?.safetyMargin || 1.2;
  const adjustedGasCost = estimatedGasLamports * safetyMargin;
  
  // Check if profit exceeds gas cost
  const isProfitable = profitLamports > adjustedGasCost;
  
  if (!isProfitable) {
    logger.debug(`Transaction not profitable after gas: profit=${profitLamports}, gas=${adjustedGasCost}`);
  }
  
  return isProfitable;
}

/**
 * Estimate gas cost for a transaction
 * @param {number} numInstructions - Number of instructions in the transaction
 * @returns {number} Estimated gas cost in lamports
 */
function estimateGasCost(numInstructions) {
  const baseGasPrice = getOptimalGasPrice();
  const instructionCost = settings.gasOptimization?.instructionCost || 200;
  
  return baseGasPrice + (numInstructions * instructionCost);
}

module.exports = {
  initializeGasOptimizer,
  getOptimalGasPrice,
  isProfitableAfterGas,
  estimateGasCost
};
