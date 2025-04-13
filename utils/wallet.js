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
    logger.error('❌ Cannot get wallet balance: connection or wallet not initialized');
    return { 
      sol: 0, 
      lamports: 0,
      isEnough: false,
      minRequired: settings.riskManagement.minWalletBalance,
      details: 'Wallet or connection not initialized'
    };
  }
  
  try {
    const lamports = await connection.getBalance(wallet.publicKey);
    const sol = lamports / 1_000_000_000; // Convert lamports to SOL
    const minSol = settings.riskManagement.minWalletBalance;
    
    // Enhanced balance reporting
    const status = sol >= minSol ? '✅' : '⚠️';
    const details = sol >= minSol 
      ? `Sufficient SOL balance for trading` 
      : `Insufficient SOL balance for transaction fees`;
    
    logger.info(`${status} Wallet SOL balance: ${sol.toFixed(6)} SOL (${lamports} lamports)`);
    logger.info(`${status} Balance status: ${details}`);
    
    return { 
      sol, 
      lamports,
      isEnough: sol >= minSol,
      minRequired: minSol,
      details
    };
  } catch (error) {
    const errorMsg = `Error getting wallet balance: ${error.message}`;
    logger.error(`❌ ${errorMsg}`);
    return { 
      sol: 0, 
      lamports: 0,
      isEnough: false,
      minRequired: settings.riskManagement.minWalletBalance,
      details: errorMsg
    };
  }
}

// Check if wallet has enough SOL for transaction fees
async function hasEnoughSol(connection, wallet) {
  if (!connection || !wallet) return false;
  
  const { sol } = await getWalletBalance(connection, wallet);
  return sol >= settings.riskManagement.minWalletBalance;
}

// Get token balance with detailed reporting
async function getTokenBalance(connection, wallet, tokenMint, requiredAmount = null) {
  if (!connection || !wallet || !tokenMint) {
    logger.error('❌ Cannot get token balance: missing required parameters');
    return {
      balance: 0,
      error: 'Missing required parameters'
    };
  }
  
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      mint: new PublicKey(tokenMint)
    });

    if (accounts.value.length === 0) {
      const msg = `No token account found for ${tokenMint}`;
      logger.warn(`⚠️ ${msg}`);
      return {
        balance: 0,
        exists: false,
        details: msg
      };
    }

    const balance = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    const decimals = accounts.value[0].account.data.parsed.info.tokenAmount.decimals;
    
    // Enhanced balance reporting
    const status = requiredAmount === null || balance >= requiredAmount ? '✅' : '⚠️';
    const details = requiredAmount === null 
      ? `Current balance` 
      : balance >= requiredAmount 
        ? `Sufficient balance for trade` 
        : `Insufficient balance. Need ${requiredAmount} more`;

    logger.info(`${status} Token balance: ${balance} (${decimals} decimals)`);
    logger.info(`${status} Balance status: ${details}`);

    return {
      balance,
      exists: true,
      decimals,
      isEnough: requiredAmount === null || balance >= requiredAmount,
      requiredAmount,
      details
    };
  } catch (error) {
    const errorMsg = `Error getting token balance: ${error.message}`;
    logger.error(`❌ ${errorMsg}`);
    return {
      balance: 0,
      error: errorMsg
    };
  }
}

// Check if a transaction can be executed based on risk management settings
async function canExecuteTransaction(connection, wallet, opportunity) {
  if (!connection || !wallet) {
    const msg = 'Cannot execute transaction: connection or wallet not initialized';
    logger.error(`❌ ${msg}`);
    return {
      canExecute: false,
      reason: msg,
      checks: {
        wallet: { passed: false, error: 'Not initialized' }
      }
    };
  }

  const checks = {
    wallet: { passed: true },
    solBalance: null,
    tokenBalance: null,
    tradeAmount: null,
    riskLimits: null
  };

  // Check SOL balance for transaction fees
  const solCheck = await getWalletBalance(connection, wallet);
  checks.solBalance = {
    passed: solCheck.isEnough,
    current: solCheck.sol,
    required: solCheck.minRequired,
    details: solCheck.details
  };

  if (!solCheck.isEnough) {
    return {
      canExecute: false,
      reason: solCheck.details,
      checks
    };
  }

  // Token balance check
  if (opportunity.type === 'triangular') {
    const startStep = opportunity.path[0];
    const startToken = getTokenBySymbol(startStep.from);
    if (!startToken) {
      const msg = `Invalid start token: ${startStep.from}`;
      logger.error(`❌ ${msg}`);
      checks.tokenBalance = {
        passed: false,
        error: msg
      };
      return { canExecute: false, reason: msg, checks };
    }

    const requiredAmount = parseFloat(startStep.fromAmount) / (10 ** startToken.decimals);
    const tokenCheck = await getTokenBalance(connection, wallet, startToken.mint, requiredAmount);
    
    checks.tokenBalance = {
      passed: tokenCheck.isEnough,
      symbol: startStep.from,
      current: tokenCheck.balance,
      required: requiredAmount,
      details: tokenCheck.details
    };

    if (!tokenCheck.isEnough) {
      return {
        canExecute: false,
        reason: tokenCheck.details,
        checks
      };
    }
  } else {
    const startToken = getTokenBySymbol(opportunity.startToken);
    if (!startToken) {
      const msg = `Invalid start token: ${opportunity.startToken}`;
      logger.error(`❌ ${msg}`);
      checks.tokenBalance = {
        passed: false,
        error: msg
      };
      return { canExecute: false, reason: msg, checks };
    }

    const requiredAmount = parseFloat(opportunity.startAmount) / (10 ** startToken.decimals);
    const tokenCheck = await getTokenBalance(connection, wallet, startToken.mint, requiredAmount);
    
    checks.tokenBalance = {
      passed: tokenCheck.isEnough,
      symbol: opportunity.startToken,
      current: tokenCheck.balance,
      required: requiredAmount,
      details: tokenCheck.details
    };

    if (!tokenCheck.isEnough) {
      return {
        canExecute: false,
        reason: tokenCheck.details,
        checks
      };
    }
  }

  // Check trade amount limits
  const tradeAmount = parseFloat(opportunity.startAmount);
  const maxAmount = settings.trading.maxTradeAmount;
  checks.tradeAmount = {
    passed: tradeAmount <= maxAmount,
    current: tradeAmount,
    limit: maxAmount,
    details: tradeAmount <= maxAmount 
      ? 'Trade amount within limits' 
      : `Trade amount ${tradeAmount} exceeds maximum ${maxAmount}`
  };

  if (tradeAmount > maxAmount) {
    return {
      canExecute: false,
      reason: checks.tradeAmount.details,
      checks
    };
  }

  // Check risk management limits
  const { checkRiskLimits } = require('./analytics');
  const riskCheck = checkRiskLimits();
  checks.riskLimits = {
    passed: riskCheck.canTrade,
    details: riskCheck.reason
  };

  if (!riskCheck.canTrade) {
    return {
      canExecute: false,
      reason: `Risk management: ${riskCheck.reason}`,
      checks
    };
  }

  // All checks passed
  return {
    canExecute: true,
    checks
  };
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
