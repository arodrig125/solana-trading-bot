/**
 * Position sizing utilities for arbitrage trading
 * This module implements Kelly criterion and other position sizing algorithms
 */

const logger = require('./logger');
const pathHistory = require('./path-history');

/**
 * Calculate optimal position size using Kelly criterion
 * @param {string[]} path - Array of token mint addresses
 * @param {number} maxPositionSize - Maximum position size in USDC
 * @param {Object} options - Additional options
 * @returns {number} Optimal position size in USDC
 */
async function calculateOptimalPositionSize(path, maxPositionSize, options = {}) {
  try {
    const {
      kellyFractionMultiplier = 0.5, // Conservative multiplier (half Kelly)
      minPositionSize = 10, // Minimum position size in USDC
      volatilityAdjustment = true, // Whether to adjust for volatility
      marketVolatility = 1.0, // Market volatility factor (1.0 = normal)
      pathReliabilityWeight = 0.7 // Weight for path reliability vs. profit
    } = options;
    
    // Get path history
    const history = await pathHistory.getPathHistory(path);
    
    // If no history, use minimum position size
    if (!history || history.attempts < 5) {
      logger.debug(`Insufficient history for path, using minimum position size: ${minPositionSize} USDC`);
      return minPositionSize;
    }
    
    // Calculate win probability
    const winProb = history.successes / history.attempts;
    
    // Calculate average profit percentage (as decimal)
    const avgProfit = history.avgProfitPercent / 100;
    
    // Calculate Kelly fraction
    // f* = (bp - q) / b
    // where:
    // b = net odds received on wager (profit/loss ratio)
    // p = probability of winning
    // q = probability of losing (1 - p)
    const b = avgProfit; // Net odds (profit/loss ratio)
    const p = winProb;
    const q = 1 - p;
    
    let kellyFraction = (b * p - q) / b;
    
    // Apply conservative multiplier
    kellyFraction *= kellyFractionMultiplier;
    
    // Adjust for market volatility if enabled
    if (volatilityAdjustment) {
      kellyFraction /= marketVolatility;
    }
    
    // Ensure Kelly fraction is between 0 and 1
    kellyFraction = Math.max(0, Math.min(1, kellyFraction));
    
    // Calculate position size
    let positionSize = kellyFraction * maxPositionSize;
    
    // Ensure position size is at least the minimum
    positionSize = Math.max(minPositionSize, positionSize);
    
    // Apply path reliability adjustment
    // More reliable paths get larger position sizes
    const pathReliability = calculatePathReliability(history);
    const reliabilityAdjustment = pathReliabilityWeight * pathReliability + (1 - pathReliabilityWeight);
    positionSize *= reliabilityAdjustment;
    
    // Round to 2 decimal places
    positionSize = Math.round(positionSize * 100) / 100;
    
    logger.debug(`Calculated position size for path: ${positionSize} USDC (Kelly: ${kellyFraction.toFixed(4)}, Reliability: ${pathReliability.toFixed(4)})`);
    
    return positionSize;
  } catch (error) {
    logger.error('Error calculating optimal position size:', error);
    return 10; // Default to minimum position size on error
  }
}

/**
 * Calculate path reliability score (0-1)
 * @param {Object} history - Path history data
 * @returns {number} Reliability score
 */
function calculatePathReliability(history) {
  if (!history || history.attempts < 5) {
    return 0.5; // Neutral reliability for new paths
  }
  
  // Factors to consider:
  // 1. Success rate
  // 2. Consistency of profits
  // 3. Recency of success
  
  // Success rate (0-1)
  const successRate = history.successes / history.attempts;
  
  // Consistency of profits (standard deviation)
  let profitConsistency = 1.0;
  if (history.successes > 1) {
    const profitValues = history.history
      .filter(entry => entry.success)
      .map(entry => entry.profitPercent);
    
    const mean = profitValues.reduce((sum, val) => sum + val, 0) / profitValues.length;
    const squaredDiffs = profitValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / profitValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize: lower stdDev = higher consistency
    profitConsistency = 1 / (1 + stdDev / mean);
  }
  
  // Recency of success (0-1)
  let recencyScore = 0.5;
  if (history.lastSuccess && history.lastFailure) {
    // Higher score if last success is more recent than last failure
    recencyScore = history.lastSuccess > history.lastFailure ? 0.8 : 0.3;
  } else if (history.lastSuccess) {
    recencyScore = 0.8;
  } else if (history.lastFailure) {
    recencyScore = 0.3;
  }
  
  // Combine factors with weights
  const reliabilityScore = (
    successRate * 0.5 +
    profitConsistency * 0.3 +
    recencyScore * 0.2
  );
  
  return reliabilityScore;
}

module.exports = {
  calculateOptimalPositionSize
};
