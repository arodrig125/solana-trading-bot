/**
 * Position sizing module for dynamic trade size calculation
 * This module determines optimal position sizes based on various factors
 */

const BigNumber = require('bignumber.js');
const settings = require('../config/settings');
const logger = require('./logger');
const pathHistory = require('./pathHistory');

/**
 * Calculate Kelly criterion for optimal position sizing
 * @param {number} winRate - Historical win rate (0-1)
 * @param {number} winLossRatio - Ratio of average win to average loss
 * @param {number} fractionMultiplier - Multiplier to adjust Kelly fraction (0-1)
 * @returns {number} - Optimal position size as a fraction of capital
 */
function calculateKellyFraction(winRate, winLossRatio, fractionMultiplier = 0.5) {
  // Kelly formula: f* = (p * b - (1 - p)) / b
  // where p = probability of win, b = win/loss ratio

  if (winRate <= 0 || winLossRatio <= 0) {
    return 0;
  }

  const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;

  // Apply a multiplier to be more conservative (half-Kelly is common)
  const adjustedFraction = kellyFraction * fractionMultiplier;

  // Ensure the fraction is between 0 and 1
  return Math.max(0, Math.min(1, adjustedFraction));
}

/**
 * Calculate volatility-adjusted position size
 * @param {number} baseSize - Base position size
 * @param {number} volatility - Market volatility measure (higher = more volatile)
 * @param {number} volatilityMultiplier - How much to adjust for volatility
 * @returns {number} - Adjusted position size
 */
function adjustForVolatility(baseSize, volatility, volatilityMultiplier = 1) {
  // Inverse relationship: higher volatility = smaller position
  const volatilityFactor = 1 / (1 + (volatility * volatilityMultiplier));
  return baseSize * volatilityFactor;
}

/**
 * Calculate optimal position size for an arbitrage path
 * @param {Array<string>} path - Array of token mint addresses in the path
 * @param {number} maxPositionSize - Maximum position size in USDC
 * @param {Object} options - Additional options
 * @returns {Promise<number>} - Optimal position size in USDC
 */
async function calculateOptimalPositionSize(path, maxPositionSize, options = {}) {
  try {
    // Default options
    const {
      kellyFractionMultiplier = 0.5,
      minPositionSize = 10,
      volatilityAdjustment = true,
      marketVolatility = 0.2,
      pathReliabilityWeight = 0.7
    } = options;

    // Get path history
    const pathData = await pathHistory.getPathHistory(path);

    // If no history, use a conservative default
    if (!pathData || pathData.attempts < 5) {
      logger.debug(`Insufficient history for path, using default position size: ${minPositionSize} USDC`);
      return minPositionSize;
    }

    // Calculate win rate and win/loss ratio
    const winRate = pathData.successRate;

    // Calculate average profit on winning trades and average loss on losing trades
    let avgProfit = 0;
    let avgLoss = 0;
    let winCount = 0;
    let lossCount = 0;

    pathData.recentAttempts.forEach(attempt => {
      if (attempt.success) {
        avgProfit += attempt.profitPercent;
        winCount++;
      } else {
        avgLoss += Math.abs(attempt.profitPercent);
        lossCount++;
      }
    });

    avgProfit = winCount > 0 ? avgProfit / winCount : 0;
    avgLoss = lossCount > 0 ? avgLoss / lossCount : 1; // Default to 1% loss if no data

    // Avoid division by zero
    const winLossRatio = avgLoss > 0 ? avgProfit / avgLoss : 1;

    // Calculate Kelly fraction
    const kellyFraction = calculateKellyFraction(winRate, winLossRatio, kellyFractionMultiplier);

    // Calculate base position size
    let positionSize = maxPositionSize * kellyFraction;

    // Adjust for path reliability
    const reliabilityFactor = Math.min(1, pathData.attempts / 20); // Scale up to 20 attempts
    positionSize = positionSize * (reliabilityFactor * pathReliabilityWeight + (1 - pathReliabilityWeight));

    // Adjust for market volatility if enabled
    if (volatilityAdjustment) {
      positionSize = adjustForVolatility(positionSize, marketVolatility);
    }

    // Ensure position size is within bounds
    positionSize = Math.max(minPositionSize, Math.min(maxPositionSize, positionSize));

    logger.debug(`Calculated position size for path: ${positionSize.toFixed(2)} USDC (Kelly: ${kellyFraction.toFixed(2)}, Win Rate: ${winRate.toFixed(2)})`);

    return positionSize;
  } catch (error) {
    logger.error('Error calculating optimal position size:', error);
    return minPositionSize || 10; // Default to minimum size on error
  }
}

/**
 * Calculate position sizes for multiple paths
 * @param {Array<Object>} pathDataArray - Array of path data objects
 * @param {number} totalCapital - Total capital available for allocation
 * @returns {Promise<Array<Object>>} - Array of path data objects with position sizes
 */
async function allocateCapitalAcrossPaths(pathDataArray, totalCapital) {
  try {
    // Calculate scores for each path
    const pathsWithScores = await Promise.all(pathDataArray.map(async (pathData) => {
      const { path } = pathData;
      const history = await pathHistory.getPathHistory(path);

      // Calculate a score based on success rate and average profit
      let score = 1;
      if (history && history.attempts > 0) {
        score = (history.successRate * 0.7) + (history.averageProfit / 5 * 0.3);
      }

      return {
        ...pathData,
        score
      };
    }));

    // Sort by score descending
    pathsWithScores.sort((a, b) => b.score - a.score);

    // Calculate total score
    const totalScore = pathsWithScores.reduce((sum, path) => sum + path.score, 0);

    // Allocate capital proportionally to scores
    return pathsWithScores.map(pathData => {
      const allocation = totalScore > 0
        ? (pathData.score / totalScore) * totalCapital
        : totalCapital / pathsWithScores.length;

      return {
        ...pathData,
        positionSize: allocation
      };
    });
  } catch (error) {
    logger.error('Error allocating capital across paths:', error);

    // Fallback to equal allocation
    const equalAllocation = totalCapital / pathDataArray.length;
    return pathDataArray.map(pathData => ({
      ...pathData,
      positionSize: equalAllocation
    }));
  }
}

module.exports = {
  calculateKellyFraction,
  adjustForVolatility,
  calculateOptimalPositionSize,
  allocateCapitalAcrossPaths
};
