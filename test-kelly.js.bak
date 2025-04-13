/**
 * Simple test script for Kelly criterion calculation
 */

const BigNumber = require('bignumber.js');

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

// Test Kelly criterion with different parameters
console.log("Testing Kelly Criterion Calculation:");

// Test case 1: High win rate, high win/loss ratio
const winRate1 = 0.7;
const winLossRatio1 = 3.0;
const kellyFraction1 = calculateKellyFraction(winRate1, winLossRatio1, 0.5);
console.log(`Win Rate: ${winRate1}, Win/Loss Ratio: ${winLossRatio1}, Kelly Fraction: ${kellyFraction1.toFixed(4)}`);

// Test case 2: Medium win rate, medium win/loss ratio
const winRate2 = 0.5;
const winLossRatio2 = 2.0;
const kellyFraction2 = calculateKellyFraction(winRate2, winLossRatio2, 0.5);
console.log(`Win Rate: ${winRate2}, Win/Loss Ratio: ${winLossRatio2}, Kelly Fraction: ${kellyFraction2.toFixed(4)}`);

// Test case 3: Low win rate, high win/loss ratio
const winRate3 = 0.3;
const winLossRatio3 = 5.0;
const kellyFraction3 = calculateKellyFraction(winRate3, winLossRatio3, 0.5);
console.log(`Win Rate: ${winRate3}, Win/Loss Ratio: ${winLossRatio3}, Kelly Fraction: ${kellyFraction3.toFixed(4)}`);

// Test volatility adjustment
console.log("\nTesting Volatility Adjustment:");
const baseSize = 100;
const lowVolatility = 0.1;
const mediumVolatility = 0.3;
const highVolatility = 0.6;

const lowVolSize = adjustForVolatility(baseSize, lowVolatility);
const medVolSize = adjustForVolatility(baseSize, mediumVolatility);
const highVolSize = adjustForVolatility(baseSize, highVolatility);

console.log(`Base Size: ${baseSize} USDC`);
console.log(`- Low volatility (${lowVolatility}): ${lowVolSize.toFixed(2)} USDC`);
console.log(`- Medium volatility (${mediumVolatility}): ${medVolSize.toFixed(2)} USDC`);
console.log(`- High volatility (${highVolatility}): ${highVolSize.toFixed(2)} USDC`);
