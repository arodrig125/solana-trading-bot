/**
 * Test script for gas optimization
 * This script tests the gas optimization functionality
 */

require('dotenv').config();
const { 
  initJupiterClient, 
  getSolanaConnection
} = require('./utils/jupiter');
const logger = require('./utils/logger');
const gasOptimizer = require('./utils/gasOptimizer');

async function testGasOptimizer() {
  try {
    logger.startupMessage('Testing gas optimization...');
    
    // Initialize connection
    const connection = getSolanaConnection();
    logger.info('Solana connection initialized');
    
    // Initialize gas optimizer
    await gasOptimizer.initializeGasOptimizer(connection);
    logger.info('Gas optimizer initialized');
    
    // Get current gas price
    const currentGasPrice = await gasOptimizer.getCurrentGasPrice(connection);
    logger.info(`Current gas price: ${currentGasPrice} lamports`);
    
    // Test gas trend prediction
    const gasTrend = gasOptimizer.predictGasTrend();
    logger.info(`Predicted gas trend: ${gasTrend}`);
    
    // Test profit threshold adjustment
    const baseThreshold = 1.0; // 1% base threshold
    const adjustedThreshold = await gasOptimizer.adjustProfitThreshold(connection, baseThreshold);
    logger.info(`Base profit threshold: ${baseThreshold}%, Adjusted: ${adjustedThreshold.toFixed(2)}%`);
    
    // Test gas price favorability with different profit amounts
    const lowProfit = 10000; // 0.00001 SOL (10,000 lamports)
    const mediumProfit = 100000; // 0.0001 SOL (100,000 lamports)
    const highProfit = 1000000; // 0.001 SOL (1,000,000 lamports)
    
    const isLowProfitFavorable = await gasOptimizer.isGasPriceFavorable(connection, lowProfit);
    const isMediumProfitFavorable = await gasOptimizer.isGasPriceFavorable(connection, mediumProfit);
    const isHighProfitFavorable = await gasOptimizer.isGasPriceFavorable(connection, highProfit);
    
    logger.info(`Gas price favorability for different profit amounts:`);
    logger.info(`- Low profit (${lowProfit} lamports): ${isLowProfitFavorable ? 'Favorable' : 'Unfavorable'}`);
    logger.info(`- Medium profit (${mediumProfit} lamports): ${isMediumProfitFavorable ? 'Favorable' : 'Unfavorable'}`);
    logger.info(`- High profit (${highProfit} lamports): ${isHighProfitFavorable ? 'Favorable' : 'Unfavorable'}`);
    
    // Get gas stats
    const gasStats = gasOptimizer.getGasStats();
    logger.info(`Gas statistics: ${JSON.stringify(gasStats, null, 2)}`);
    
    logger.successMessage('Gas optimization test completed');
  } catch (error) {
    logger.errorMessage('Error testing gas optimization', error);
  }
}

// Run the test
testGasOptimizer().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
