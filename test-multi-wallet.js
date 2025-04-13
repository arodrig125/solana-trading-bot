/**
 * Test Multi-Wallet Trading Functionality
 * This script demonstrates how to use multiple wallets with the trading bot
 */

const { initJupiterClient, getSolanaConnection, executeTrade } = require('./utils/jupiter');
const walletManager = require('./utils/walletManager');
const logger = require('./utils/logger');
const { TOKENS } = require('./config/tokens');
require('dotenv').config();

async function testMultiWallet() {
  try {
    // Initialize Jupiter client
    const jupiterClient = await initJupiterClient();
    const connection = getSolanaConnection();
    
    // Array of private keys (in your actual implementation, you might load these from a secure source)
    // For this example, we'll use environment variables like PRIVATE_KEY_1, PRIVATE_KEY_2, etc.
    const privateKeys = [];
    
    // Add private keys from environment variables if they exist
    if (process.env.PRIVATE_KEY) privateKeys.push(process.env.PRIVATE_KEY);
    if (process.env.PRIVATE_KEY_2) privateKeys.push(process.env.PRIVATE_KEY_2);
    if (process.env.PRIVATE_KEY_3) privateKeys.push(process.env.PRIVATE_KEY_3);
    
    if (privateKeys.length === 0) {
      logger.error('No private keys found in environment variables. Please set at least one PRIVATE_KEY.');
      return;
    }
    
    // Initialize wallet manager with private keys
    const wallets = walletManager.initWallets(privateKeys);
    if (wallets.length === 0) {
      logger.error('Failed to initialize any wallets.');
      return;
    }
    
    // Update all wallet balances
    await walletManager.updateAllWalletBalances(connection);
    
    // Display wallet statistics
    const walletStats = walletManager.getWalletStats();
    logger.info('=== Wallet Statistics ===');
    logger.info(`Total Wallets: ${walletStats.total}`);
    logger.info(`Ready: ${walletStats.ready}`);
    logger.info(`Low Balance: ${walletStats.lowBalance}`);
    
    logger.info('\n=== Individual Wallet Info ===');
    walletStats.wallets.forEach((w, index) => {
      logger.info(`Wallet ${index + 1}: ${w.address} - ${w.solBalance.toFixed(6)} SOL - Status: ${w.status}`);
    });
    
    // Create a test trading opportunity (simulation only)
    const testOpportunity = {
      type: 'triangular',
      path: [
        {
          from: 'USDC',
          to: 'SOL',
          fromAmount: '100000' // 0.1 USDC (6 decimals)
        },
        {
          from: 'SOL',
          to: 'USDC'
        }
      ],
      startAmount: '100000', // 0.1 USDC
      startToken: 'USDC',
      endToken: 'USDC',
      profitAmount: '0.001',
      profitPercent: 1.0
    };
    
    // Test trade simulation with wallet manager
    logger.info('\n🧪 Testing trade simulation with wallet manager');
    
    // Get a wallet from wallet manager for this trade
    const bestWallet = await walletManager.getBestWalletForTrade(connection, testOpportunity);
    
    if (!bestWallet) {
      logger.error('No suitable wallet found for this trade.');
      return;
    }
    
    logger.info(`Selected wallet: ${bestWallet.displayAddress} for trade simulation`);
    
    // Execute trade in simulation mode (last parameter true = simulation mode)
    const simResult = await executeTrade(
      jupiterClient,
      connection,
      bestWallet.wallet,
      testOpportunity,
      true, // simulation mode
      walletManager // pass wallet manager
    );
    
    logger.info('Simulation result:');
    logger.info(JSON.stringify(simResult, null, 2));
    
    // NOTE: For a live trade, you would set the simulation parameter to false
    // We're using simulation mode to avoid real transactions in this test
    
    logger.info('\n✅ Multi-wallet test completed');
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testMultiWallet().then(() => {
  logger.info('Test completed');
  process.exit(0);
}).catch(error => {
  logger.error('Test failed:', error);
  process.exit(1);
});
