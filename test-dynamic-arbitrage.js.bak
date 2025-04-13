/**
 * Test script for dynamic arbitrage path finding
 * This script tests the new dynamic arbitrage functionality
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
const settings = require('./config/settings');

async function testDynamicArbitrage() {
  try {
    logger.startupMessage('Testing dynamic arbitrage path finding...');

    // Initialize Jupiter client
    const jupiterClient = initJupiterClient();
    logger.info('Jupiter client initialized');

    // Initialize path history
    await pathHistory.initializePathHistory();
    logger.info('Path history initialized');

    // Test path generation
    const usdcMint = TOKENS.USDC.mint;
    const usdcToken = Object.values(TOKENS).find(token => token.mint === usdcMint);

    logger.info('Generating paths...');
    const triangularPaths = pathFinder.getTopPaths(usdcMint, 3, 5);
    logger.info(`Generated ${triangularPaths.length} triangular paths`);

    // Display top paths
    triangularPaths.forEach((pathData, index) => {
      logger.info(`Path ${index + 1}: ${pathData.tokenSymbols.join(' → ')} (Score: ${pathData.score.toFixed(2)})`);
    });

    // Test dynamic arbitrage
    logger.info('Testing dynamic arbitrage with USDC as base token...');

    // Calculate amount in USDC decimals
    const amount = settings.trading.defaultQuoteAmount.toString() + '0'.repeat(usdcToken.decimals);

    // Check for triangular arbitrage
    const triangularResult = await checkDynamicArbitrage(jupiterClient, usdcMint, 3, amount.toString());

    if (triangularResult) {
      logger.successMessage(`Found triangular arbitrage opportunity: ${triangularResult.profitPercent.toFixed(2)}%`);
      logger.info(`Path: ${triangularResult.path.join(' → ')}`);
      logger.info(`Start amount: ${triangularResult.startAmount} ${triangularResult.startToken}`);
      logger.info(`End amount: ${triangularResult.endAmount} ${triangularResult.startToken}`);
      logger.info(`Profit: ${triangularResult.profitAmount} ${triangularResult.startToken}`);
    } else {
      logger.warningMessage('No triangular arbitrage opportunities found');
    }

    // Check for quadrangular arbitrage
    logger.info('Testing quadrangular arbitrage...');
    const quadrangularResult = await checkDynamicArbitrage(jupiterClient, usdcMint, 4, amount.toString());

    if (quadrangularResult) {
      logger.successMessage(`Found quadrangular arbitrage opportunity: ${quadrangularResult.profitPercent.toFixed(2)}%`);
      logger.info(`Path: ${quadrangularResult.path.join(' → ')}`);
      logger.info(`Start amount: ${quadrangularResult.startAmount} ${quadrangularResult.startToken}`);
      logger.info(`End amount: ${quadrangularResult.endAmount} ${quadrangularResult.startToken}`);
      logger.info(`Profit: ${quadrangularResult.profitAmount} ${quadrangularResult.startToken}`);
    } else {
      logger.warningMessage('No quadrangular arbitrage opportunities found');
    }

    // Save path history
    await pathHistory.savePathHistory();
    logger.info('Path history saved');

    logger.successMessage('Dynamic arbitrage test completed');
  } catch (error) {
    logger.errorMessage('Error testing dynamic arbitrage', error);
  }
}

// Run the test
testDynamicArbitrage().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
