/**
 * Test script for dynamic position sizing
 * This script tests the new position sizing functionality
 */

require('dotenv').config();
const {
  initJupiterClient,
  getSolanaConnection,
  checkDynamicArbitrage
} = require('./utils/jupiter');
const { TOKENS } = require('./config/tokens');
const logger = require('./utils/logger');
const pathFinder = require('./utils/pathFinder');
const pathHistory = require('./utils/pathHistory');
const positionSizing = require('./utils/positionSizing');
const settings = require('./config/settings');

async function testPositionSizing() {
  try {
    logger.startupMessage('Testing dynamic position sizing...');

    // Initialize path history
    await pathHistory.initializePathHistory();
    logger.info('Path history initialized');

    // Create some sample path history data for testing
    const usdcMint = TOKENS.USDC.mint;
    const solMint = TOKENS.SOL.mint;
    const btcMint = TOKENS.BTC.mint;

    const samplePath = [usdcMint, solMint, usdcMint];

    // Record some sample attempts with varying success rates
    logger.info('Creating sample path history data...');

    // Successful attempts
    await pathHistory.recordPathAttempt(samplePath, true, 0.8);
    await pathHistory.recordPathAttempt(samplePath, true, 1.2);
    await pathHistory.recordPathAttempt(samplePath, true, 0.5);

    // Failed attempts
    await pathHistory.recordPathAttempt(samplePath, false, -0.3);
    await pathHistory.recordPathAttempt(samplePath, false, -0.2);

    // Get the path history
    const pathData = await pathHistory.getPathHistory(samplePath);
    logger.info(`Path history: ${pathData.attempts} attempts, ${pathData.successRate.toFixed(2)} success rate, ${pathData.averageProfit.toFixed(2)}% avg profit`);

    // Test Kelly criterion calculation
    const winRate = pathData.successRate;
    const winAmount = 0.8; // Average win amount
    const lossAmount = 0.25; // Average loss amount
    const winLossRatio = winAmount / lossAmount;

    const kellyFraction = positionSizing.calculateKellyFraction(winRate, winLossRatio, 0.5);
    logger.info(`Kelly fraction: ${kellyFraction.toFixed(4)} (Win rate: ${winRate.toFixed(2)}, Win/Loss ratio: ${winLossRatio.toFixed(2)})`);

    // Test position sizing with different volatility levels
    const baseSize = 100;
    const lowVolatility = 0.1;
    const mediumVolatility = 0.3;
    const highVolatility = 0.6;

    const lowVolSize = positionSizing.adjustForVolatility(baseSize, lowVolatility);
    const medVolSize = positionSizing.adjustForVolatility(baseSize, mediumVolatility);
    const highVolSize = positionSizing.adjustForVolatility(baseSize, highVolatility);

    logger.info(`Position sizes with different volatility levels:`);
    logger.info(`- Low volatility (${lowVolatility}): ${lowVolSize.toFixed(2)} USDC`);
    logger.info(`- Medium volatility (${mediumVolatility}): ${medVolSize.toFixed(2)} USDC`);
    logger.info(`- High volatility (${highVolatility}): ${highVolSize.toFixed(2)} USDC`);

    // Test optimal position size calculation
    const maxPositionSize = 500; // Default max position size
    const optimalSize = await positionSizing.calculateOptimalPositionSize(
      samplePath,
      maxPositionSize,
      {
        kellyFractionMultiplier: 0.3,
        minPositionSize: 10,
        volatilityAdjustment: true,
        marketVolatility: 0.2,
        pathReliabilityWeight: 0.7
      }
    );

    logger.info(`Optimal position size for sample path: ${optimalSize.toFixed(2)} USDC`);

    // Test capital allocation across multiple paths
    const paths = [
      { path: [usdcMint, solMint, usdcMint], name: 'USDC-SOL-USDC' },
      { path: [usdcMint, btcMint, usdcMint], name: 'USDC-BTC-USDC' },
      { path: [usdcMint, solMint, btcMint, usdcMint], name: 'USDC-SOL-BTC-USDC' }
    ];

    // Record some history for the other paths
    await pathHistory.recordPathAttempt(paths[1].path, true, 1.5);
    await pathHistory.recordPathAttempt(paths[1].path, true, 2.0);
    await pathHistory.recordPathAttempt(paths[1].path, false, -0.5);

    await pathHistory.recordPathAttempt(paths[2].path, true, 0.3);
    await pathHistory.recordPathAttempt(paths[2].path, false, -0.2);
    await pathHistory.recordPathAttempt(paths[2].path, false, -0.4);

    // Allocate capital
    const totalCapital = 1000;
    const allocatedPaths = await positionSizing.allocateCapitalAcrossPaths(paths, totalCapital);

    logger.info(`Capital allocation across paths (Total: ${totalCapital} USDC):`);
    allocatedPaths.forEach(path => {
      logger.info(`- ${path.name}: ${path.positionSize.toFixed(2)} USDC (Score: ${path.score.toFixed(2)})`);
    });

    // Save path history
    await pathHistory.savePathHistory();
    logger.info('Path history saved');

    logger.successMessage('Dynamic position sizing test completed');
  } catch (error) {
    logger.errorMessage('Error testing position sizing', error);
  }
}

// Run the test
testPositionSizing().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
