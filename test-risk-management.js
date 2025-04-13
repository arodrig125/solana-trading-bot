/**
 * Test script for the Risk Management System
 * 
 * This script tests the functionality of the risk management system,
 * including position sizing, risk scoring, stop-loss, and take-profit.
 */

require('dotenv').config();
const logger = require('./utils/logger');
const riskManager = require('./utils/riskManager');
const { getSolanaConnection } = require('./utils/jupiter');
const { initWallet, getWalletBalance } = require('./utils/wallet');
const { processOpportunity } = require('./utils/trading');

// Initialize components
logger.startupMessage('Testing Risk Management System...');

// Initialize Solana connection
const connection = getSolanaConnection();
logger.successMessage('Solana connection initialized');

// Initialize wallet
const wallet = initWallet(process.env.PRIVATE_KEY);
if (!wallet) {
  logger.errorMessage('Failed to initialize wallet. Check your PRIVATE_KEY in .env file.');
  process.exit(1);
}
logger.successMessage('Wallet initialized');

// Test user ID
const TEST_USER_ID = 'test-user-123';

// Test functions
async function testRiskLevels() {
  logger.info('Testing risk levels...');
  
  // Test setting risk levels
  logger.info('Setting risk level to LOW');
  riskManager.setUserRiskLevel(TEST_USER_ID, 'low');
  let riskLevel = riskManager.getUserRiskLevel(TEST_USER_ID);
  logger.info(`Current risk level: ${riskLevel}`);
  
  logger.info('Setting risk level to MEDIUM');
  riskManager.setUserRiskLevel(TEST_USER_ID, 'medium');
  riskLevel = riskManager.getUserRiskLevel(TEST_USER_ID);
  logger.info(`Current risk level: ${riskLevel}`);
  
  logger.info('Setting risk level to HIGH');
  riskManager.setUserRiskLevel(TEST_USER_ID, 'high');
  riskLevel = riskManager.getUserRiskLevel(TEST_USER_ID);
  logger.info(`Current risk level: ${riskLevel}`);
  
  // Test invalid risk level
  logger.info('Testing invalid risk level...');
  const result = riskManager.setUserRiskLevel(TEST_USER_ID, 'extreme');
  logger.info(`Setting invalid risk level result: ${result}`);
  
  // Reset to medium for further tests
  riskManager.setUserRiskLevel(TEST_USER_ID, 'medium');
}

async function testRiskParameters() {
  logger.info('Testing risk parameters...');
  
  // Get default parameters
  const defaultParams = riskManager.getRiskSettingsSummary(TEST_USER_ID);
  logger.info('Default risk parameters:');
  logger.info(JSON.stringify(defaultParams, null, 2));
  
  // Test setting custom parameters
  logger.info('Setting custom stop-loss parameter...');
  riskManager.setRiskParameter(TEST_USER_ID, 'stopLossPercent', 2.5);
  
  logger.info('Setting custom take-profit parameter...');
  riskManager.setRiskParameter(TEST_USER_ID, 'takeProfitPercent', 1.2);
  
  // Get updated parameters
  const updatedParams = riskManager.getRiskSettingsSummary(TEST_USER_ID);
  logger.info('Updated risk parameters:');
  logger.info(JSON.stringify(updatedParams, null, 2));
}

async function testPositionSizing() {
  logger.info('Testing position sizing...');
  
  // Get wallet balance
  const walletBalance = await getWalletBalance(connection, wallet.publicKey);
  logger.info(`Current wallet balance: ${walletBalance.sol} SOL`);
  
  // Test opportunities with different risk profiles
  const lowRiskOpportunity = {
    type: 'simple',
    pair: 'SOL/USDC',
    profitPercent: 0.8,
    estimatedSlippage: 0.2
  };
  
  const mediumRiskOpportunity = {
    type: 'triangular',
    path: [
      { from: 'USDC', to: 'SOL', dex: 'Raydium' },
      { from: 'SOL', to: 'BTC', dex: 'Orca' },
      { from: 'BTC', to: 'USDC', dex: 'Jupiter' }
    ],
    profitPercent: 1.5,
    estimatedSlippage: 0.4
  };
  
  const highRiskOpportunity = {
    type: 'multi-hop',
    path: [
      { from: 'USDC', to: 'SOL', dex: 'Raydium' },
      { from: 'SOL', to: 'MNGO', dex: 'Orca' },
      { from: 'MNGO', to: 'RAY', dex: 'Serum' },
      { from: 'RAY', to: 'USDC', dex: 'Jupiter' }
    ],
    profitPercent: 3.2,
    estimatedSlippage: 0.7
  };
  
  // Test position sizing with different risk levels
  for (const riskLevel of ['low', 'medium', 'high']) {
    riskManager.setUserRiskLevel(TEST_USER_ID, riskLevel);
    logger.info(`\nTesting position sizing with ${riskLevel.toUpperCase()} risk level:`);
    
    // Test with low risk opportunity
    const lowRiskSize = await riskManager.calculatePositionSize(
      TEST_USER_ID,
      walletBalance.sol,
      lowRiskOpportunity
    );
    logger.info(`Low risk opportunity position size: ${lowRiskSize.toFixed(6)} SOL (${(lowRiskSize / walletBalance.sol * 100).toFixed(2)}% of wallet)`);
    
    // Test with medium risk opportunity
    const mediumRiskSize = await riskManager.calculatePositionSize(
      TEST_USER_ID,
      walletBalance.sol,
      mediumRiskOpportunity
    );
    logger.info(`Medium risk opportunity position size: ${mediumRiskSize.toFixed(6)} SOL (${(mediumRiskSize / walletBalance.sol * 100).toFixed(2)}% of wallet)`);
    
    // Test with high risk opportunity
    const highRiskSize = await riskManager.calculatePositionSize(
      TEST_USER_ID,
      walletBalance.sol,
      highRiskOpportunity
    );
    logger.info(`High risk opportunity position size: ${highRiskSize.toFixed(6)} SOL (${(highRiskSize / walletBalance.sol * 100).toFixed(2)}% of wallet)`);
  }
}

async function testRiskScoring() {
  logger.info('\nTesting risk scoring...');
  
  // Test opportunities with different risk profiles
  const opportunities = [
    {
      type: 'simple',
      pair: 'SOL/USDC',
      profitPercent: 0.8,
      estimatedSlippage: 0.2,
      description: 'Simple arbitrage with moderate profit'
    },
    {
      type: 'triangular',
      path: [
        { from: 'USDC', to: 'SOL', dex: 'Raydium' },
        { from: 'SOL', to: 'BTC', dex: 'Orca' },
        { from: 'BTC', to: 'USDC', dex: 'Jupiter' }
      ],
      profitPercent: 1.5,
      estimatedSlippage: 0.4,
      description: 'Triangular arbitrage with good profit'
    },
    {
      type: 'triangular',
      path: [
        { from: 'USDC', to: 'SOL', dex: 'Raydium' },
        { from: 'SOL', to: 'MNGO', dex: 'Orca' },
        { from: 'MNGO', to: 'USDC', dex: 'Jupiter' }
      ],
      profitPercent: 0.3,
      estimatedSlippage: 0.2,
      description: 'Triangular arbitrage with low profit'
    },
    {
      type: 'multi-hop',
      path: [
        { from: 'USDC', to: 'SOL', dex: 'Raydium' },
        { from: 'SOL', to: 'MNGO', dex: 'Orca' },
        { from: 'MNGO', to: 'RAY', dex: 'Serum' },
        { from: 'RAY', to: 'USDC', dex: 'Jupiter' }
      ],
      profitPercent: 3.2,
      estimatedSlippage: 0.7,
      description: 'Multi-hop arbitrage with high profit'
    },
    {
      type: 'simple',
      pair: 'MNGO/USDC',
      profitPercent: 6.5,
      estimatedSlippage: 1.2,
      description: 'Simple arbitrage with suspiciously high profit'
    }
  ];
  
  // Calculate risk scores for each opportunity
  for (const opportunity of opportunities) {
    const riskScore = riskManager.calculateRiskScore(opportunity);
    logger.info(`${opportunity.description}:`);
    logger.info(`  Risk Score: ${riskScore.toFixed(2)}/100`);
    
    // Test trade execution decision for each risk level
    for (const riskLevel of ['low', 'medium', 'high']) {
      riskManager.setUserRiskLevel(TEST_USER_ID, riskLevel);
      const decision = riskManager.shouldExecuteTrade(TEST_USER_ID, opportunity);
      logger.info(`  ${riskLevel.toUpperCase()} risk level decision: ${decision.execute ? 'EXECUTE' : 'REJECT'} - ${decision.reason}`);
    }
    logger.info('');
  }
}

async function testStopLossAndTakeProfit() {
  logger.info('\nTesting stop-loss and take-profit...');
  
  // Set risk level to medium
  riskManager.setUserRiskLevel(TEST_USER_ID, 'medium');
  
  // Create test trades
  const trades = [
    {
      id: 'trade-1',
      opportunity: { type: 'simple', pair: 'SOL/USDC', profitPercent: 1.2 },
      initialValue: 1.0,
      amount: 1.0,
      timestamp: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: 'trade-2',
      opportunity: { type: 'triangular', profitPercent: 2.0 },
      initialValue: 0.5,
      amount: 0.5,
      timestamp: Date.now() - 1800000 // 30 minutes ago
    }
  ];
  
  // Test stop-loss
  logger.info('Testing stop-loss...');
  const stopLossValue = trades[0].initialValue * (1 - riskManager.getRiskParameter(TEST_USER_ID, 'stopLossPercent') / 100);
  logger.info(`Trade 1 initial value: ${trades[0].initialValue} SOL`);
  logger.info(`Stop-loss threshold: ${riskManager.getRiskParameter(TEST_USER_ID, 'stopLossPercent')}%`);
  logger.info(`Stop-loss value: ${stopLossValue} SOL`);
  
  // Test with value above stop-loss
  let shouldTrigger = riskManager.checkStopLoss(TEST_USER_ID, trades[0], stopLossValue + 0.01);
  logger.info(`Value: ${stopLossValue + 0.01} SOL - Should trigger stop-loss: ${shouldTrigger}`);
  
  // Test with value at stop-loss
  shouldTrigger = riskManager.checkStopLoss(TEST_USER_ID, trades[0], stopLossValue);
  logger.info(`Value: ${stopLossValue} SOL - Should trigger stop-loss: ${shouldTrigger}`);
  
  // Test with value below stop-loss
  shouldTrigger = riskManager.checkStopLoss(TEST_USER_ID, trades[0], stopLossValue - 0.01);
  logger.info(`Value: ${stopLossValue - 0.01} SOL - Should trigger stop-loss: ${shouldTrigger}`);
  
  // Test take-profit
  logger.info('\nTesting take-profit...');
  const takeProfitValue = trades[1].initialValue * (1 + riskManager.getRiskParameter(TEST_USER_ID, 'takeProfitPercent') / 100);
  logger.info(`Trade 2 initial value: ${trades[1].initialValue} SOL`);
  logger.info(`Take-profit threshold: ${riskManager.getRiskParameter(TEST_USER_ID, 'takeProfitPercent')}%`);
  logger.info(`Take-profit value: ${takeProfitValue} SOL`);
  
  // Test with value below take-profit
  shouldTrigger = riskManager.checkTakeProfit(TEST_USER_ID, trades[1], takeProfitValue - 0.01);
  logger.info(`Value: ${takeProfitValue - 0.01} SOL - Should trigger take-profit: ${shouldTrigger}`);
  
  // Test with value at take-profit
  shouldTrigger = riskManager.checkTakeProfit(TEST_USER_ID, trades[1], takeProfitValue);
  logger.info(`Value: ${takeProfitValue} SOL - Should trigger take-profit: ${shouldTrigger}`);
  
  // Test with value above take-profit
  shouldTrigger = riskManager.checkTakeProfit(TEST_USER_ID, trades[1], takeProfitValue + 0.01);
  logger.info(`Value: ${takeProfitValue + 0.01} SOL - Should trigger take-profit: ${shouldTrigger}`);
}

// Main test function
async function runTests() {
  try {
    // Test risk levels
    await testRiskLevels();
    
    // Test risk parameters
    await testRiskParameters();
    
    // Test position sizing
    await testPositionSizing();
    
    // Test risk scoring
    await testRiskScoring();
    
    // Test stop-loss and take-profit
    await testStopLossAndTakeProfit();
    
    logger.successMessage('All risk management tests completed successfully!');
  } catch (error) {
    logger.errorMessage('Error during risk management tests:', error);
  }
}

// Run the tests
runTests().catch(error => {
  logger.errorMessage('Unhandled error in tests:', error);
  process.exit(1);
});
