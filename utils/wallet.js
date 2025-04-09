const { Keypair, PublicKey } = require('@solana/web3.js');
const settings = require('../config/settings');
const logger = require('./logger');

// Initialize wallet from private key
function initWallet(privateKeyString) {
  try {
    if (!privateKeyString) {
      logger.warningMessage('No private key provided. Wallet functionality will be limited.');
      return null;
    }
    
    const privateKeyArray = JSON.parse(privateKeyString);
    const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    
    logger.successMessage(`Wallet initialized with public key: ${wallet.publicKey.toString()}`);
    return wallet;
  } catch (error) {
    logger.errorMessage('Error initializing wallet', error);
    return null;
  }
}

// Get wallet balance
async function getWalletBalance(connection, wallet) {
  if (!connection || !wallet) {
    return { sol: 0, lamports: 0 };
  }
  
  try {
    const lamports = await connection.getBalance(wallet.publicKey);
    const sol = lamports / 1_000_000_000; // Convert lamports to SOL
    
    logger.info(`Wallet balance: ${sol.toFixed(6)} SOL (${lamports} lamports)`);
    return { sol, lamports };
  } catch (error) {
    logger.errorMessage('Error getting wallet balance', error);
    return { sol: 0, lamports: 0 };
  }
}

// Check if wallet has enough SOL for transaction fees
async function hasEnoughSol(connection, wallet) {
  if (!connection || !wallet) return false;
  
  const { sol } = await getWalletBalance(connection, wallet);
  return sol >= settings.riskManagement.minWalletBalance;
}

// Get token balance
async function getTokenBalance(connection, wallet, tokenMint) {
  if (!connection || !wallet || !tokenMint) return 0;
  
  try {
    // This is a simplified version - in a real implementation,
    // you would use the Token program to get the token account and balance
    logger.info(`Getting balance for token ${tokenMint} in wallet ${wallet.publicKey.toString()}`);
    
    // For now, just return 0 as a placeholder
    return 0;
  } catch (error) {
    logger.errorMessage(`Error getting token balance for ${tokenMint}`, error);
    return 0;
  }
}

// Check if a transaction can be executed based on risk management settings
async function canExecuteTransaction(connection, wallet, tradeAmount) {
  if (!connection || !wallet) {
    logger.warningMessage('Cannot execute transaction: connection or wallet not initialized');
    return false;
  }
  
  // Check if wallet has enough SOL for transaction fees
  if (!await hasEnoughSol(connection, wallet)) {
    logger.warningMessage(`Not enough SOL for transaction fees. Minimum required: ${settings.riskManagement.minWalletBalance} SOL`);
    return false;
  }
  
  // Check if trade amount exceeds maximum allowed
  if (tradeAmount > settings.trading.maxTradeAmount) {
    logger.warningMessage(`Trade amount ${tradeAmount} exceeds maximum allowed ${settings.trading.maxTradeAmount}`);
    return false;
  }
  
  // Check risk management limits from analytics
  const { checkRiskLimits } = require('./analytics');
  const riskCheck = checkRiskLimits();
  
  if (!riskCheck.canTrade) {
    logger.warningMessage(`Risk management check failed: ${riskCheck.reason}`);
    return false;
  }
  
  return true;
}

// Format wallet address for display
function formatWalletAddress(address) {
  if (!address) return 'Not available';
  
  const addressStr = address.toString();
  return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
}

// Get wallet info for display
async function getWalletInfo(connection, wallet) {
  if (!connection || !wallet) {
    return {
      address: 'Not available',
      displayAddress: 'Not available',
      sol: 0,
      status: 'Not initialized'
    };
  }
  
  const { sol } = await getWalletBalance(connection, wallet);
  
  return {
    address: wallet.publicKey.toString(),
    displayAddress: formatWalletAddress(wallet.publicKey),
    sol,
    status: sol >= settings.riskManagement.minWalletBalance ? 'Ready' : 'Low balance'
  };
}

module.exports = {
  initWallet,
  getWalletBalance,
  hasEnoughSol,
  getTokenBalance,
  canExecuteTransaction,
  formatWalletAddress,
  getWalletInfo
};
