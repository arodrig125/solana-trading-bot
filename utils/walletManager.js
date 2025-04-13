/**
 * Wallet Manager for Solana Trading Bot
 * Manages multiple wallets for distributed trading
 */

const { Keypair, PublicKey } = require('@solana/web3.js');
const settings = require('../config/settings');
const logger = require('./logger');
const walletUtils = require('./wallet');

// Store for active wallets
let wallets = [];
let activeWalletIndex = 0;

/**
 * Initialize multiple wallets from private keys array
 * @param {Array<string>} privateKeysArray - Array of private key strings (JSON parsed secret keys)
 * @returns {Array} Array of initialized wallet objects
 */
function initWallets(privateKeysArray) {
  try {
    if (!privateKeysArray || !Array.isArray(privateKeysArray) || privateKeysArray.length === 0) {
      logger.warningMessage('No private keys provided or invalid format. Multi-wallet functionality disabled.');
      return [];
    }
    
    logger.info(`Initializing ${privateKeysArray.length} wallets...`);
    
    // Reset wallets array
    wallets = [];
    
    // Initialize each wallet
    for (let i = 0; i < privateKeysArray.length; i++) {
      const wallet = walletUtils.initWallet(privateKeysArray[i]);
      if (wallet) {
        wallets.push({
          wallet,
          publicKey: wallet.publicKey.toString(),
          displayAddress: walletUtils.formatWalletAddress(wallet.publicKey),
          index: i,
          lastUsed: null,
          transactions: 0,
          status: 'Ready',
          balances: {},
        });
        logger.info(`Wallet ${i + 1}/${privateKeysArray.length} initialized: ${walletUtils.formatWalletAddress(wallet.publicKey)}`);
      }
    }
    
    logger.successMessage(`Successfully initialized ${wallets.length} wallets`);
    return wallets;
  } catch (error) {
    logger.errorMessage('Error initializing wallets', error);
    return [];
  }
}

/**
 * Get all initialized wallets
 * @returns {Array} Array of wallet objects
 */
function getAllWallets() {
  return wallets;
}

/**
 * Get wallet by index
 * @param {number} index - Wallet index
 * @returns {Object} Wallet object or null if not found
 */
function getWalletByIndex(index) {
  if (index >= 0 && index < wallets.length) {
    return wallets[index];
  }
  return null;
}

/**
 * Get wallet by public key
 * @param {string} publicKey - Public key string
 * @returns {Object} Wallet object or null if not found
 */
function getWalletByPublicKey(publicKey) {
  return wallets.find(w => w.publicKey === publicKey) || null;
}

/**
 * Get next available wallet using round-robin selection
 * @returns {Object} Next wallet object
 */
function getNextWallet() {
  if (wallets.length === 0) {
    return null;
  }
  
  // Simple round-robin selection
  const wallet = wallets[activeWalletIndex];
  activeWalletIndex = (activeWalletIndex + 1) % wallets.length;
  return wallet;
}

/**
 * Get the best wallet for a specific trade based on balance and activity
 * @param {Object} connection - Solana connection object
 * @param {Object} opportunity - Trading opportunity object
 * @returns {Promise<Object>} Best wallet for the trade
 */
async function getBestWalletForTrade(connection, opportunity) {
  if (wallets.length === 0) {
    return null;
  }
  
  // If only one wallet, return it
  if (wallets.length === 1) {
    return wallets[0];
  }
  
  // For multiple wallets, find the best one based on:
  // 1. Having enough balance for the trade
  // 2. Least recently used (to distribute trading activity)
  // 3. Lowest transaction count (to distribute transaction history)
  
  const eligibleWallets = [];
  
  // Check each wallet for trade eligibility
  for (let walletObj of wallets) {
    const { wallet } = walletObj;
    
    // Check if wallet can execute this transaction
    const canExecute = await walletUtils.canExecuteTransaction(connection, wallet, opportunity);
    
    if (canExecute.canExecute) {
      eligibleWallets.push({
        ...walletObj,
        canExecute
      });
    }
  }
  
  if (eligibleWallets.length === 0) {
    logger.warningMessage('No eligible wallets found for this trade');
    return null;
  }
  
  // Sort by last used (oldest first), then by transaction count (lowest first)
  eligibleWallets.sort((a, b) => {
    // If one has never been used, prioritize it
    if (!a.lastUsed && b.lastUsed) return -1;
    if (a.lastUsed && !b.lastUsed) return 1;
    // Sort by last used time
    if (a.lastUsed && b.lastUsed && a.lastUsed !== b.lastUsed) {
      return a.lastUsed - b.lastUsed;
    }
    // If last used is the same, sort by transaction count
    return a.transactions - b.transactions;
  });
  
  // Return the best wallet
  return eligibleWallets[0];
}

/**
 * Update wallet status after a trade
 * @param {string} publicKey - Wallet public key
 * @param {Object} tradeResult - Result of the trade
 * @param {Object} connection - Solana connection object
 */
async function updateWalletAfterTrade(publicKey, tradeResult, connection) {
  const walletIndex = wallets.findIndex(w => w.publicKey === publicKey);
  if (walletIndex === -1) return;
  
  const walletObj = wallets[walletIndex];
  
  // Update last used time
  walletObj.lastUsed = Date.now();
  
  // Increment transaction count
  walletObj.transactions += 1;
  
  // Update balances
  if (connection) {
    const balanceInfo = await walletUtils.getWalletBalance(connection, walletObj.wallet);
    walletObj.balances.sol = balanceInfo.sol;
    walletObj.status = balanceInfo.isEnough ? 'Ready' : 'Low balance';
  }
  
  // Update the wallet in the array
  wallets[walletIndex] = walletObj;
}

/**
 * Update balances for all wallets
 * @param {Object} connection - Solana connection object
 */
async function updateAllWalletBalances(connection) {
  if (!connection || wallets.length === 0) return;
  
  logger.info('Updating balances for all wallets...');
  
  for (let i = 0; i < wallets.length; i++) {
    const walletObj = wallets[i];
    try {
      // Update SOL balance
      const balanceInfo = await walletUtils.getWalletBalance(connection, walletObj.wallet);
      walletObj.balances.sol = balanceInfo.sol;
      walletObj.status = balanceInfo.isEnough ? 'Ready' : 'Low balance';
      
      // Add more token balance updates here if needed
      
      // Update the wallet in the array
      wallets[i] = walletObj;
      
      logger.info(`Wallet ${i + 1}/${wallets.length} balance updated: ${walletObj.displayAddress} - ${balanceInfo.sol.toFixed(6)} SOL`);
    } catch (error) {
      logger.warningMessage(`Error updating wallet ${walletObj.displayAddress} balance: ${error.message}`);
    }
  }
  
  logger.info('All wallet balances updated');
}

/**
 * Get wallet statistics and status overview
 * @returns {Object} Wallet statistics
 */
function getWalletStats() {
  if (wallets.length === 0) {
    return {
      total: 0,
      ready: 0,
      lowBalance: 0,
      totalTransactions: 0
    };
  }
  
  return {
    total: wallets.length,
    ready: wallets.filter(w => w.status === 'Ready').length,
    lowBalance: wallets.filter(w => w.status === 'Low balance').length,
    totalTransactions: wallets.reduce((sum, w) => sum + w.transactions, 0),
    wallets: wallets.map(w => ({
      address: w.displayAddress,
      status: w.status,
      transactions: w.transactions,
      solBalance: w.balances.sol || 0
    }))
  };
}

module.exports = {
  initWallets,
  getAllWallets,
  getWalletByIndex,
  getWalletByPublicKey,
  getNextWallet,
  getBestWalletForTrade,
  updateWalletAfterTrade,
  updateAllWalletBalances,
  getWalletStats
};
