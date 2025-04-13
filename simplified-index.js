require('dotenv').config();
const cron = require('node-cron');
const logger = require('./utils/logger');
const { setupCredentials, getSheetsClient, initializeSheets, logOpportunity, logTrade, logDailySummary } = require('./utils/sheets');
const {
  initJupiterClient,
  getSolanaConnection,
  getQuote,
  calculateProfitPercentage,
  isTokenAllowed
} = require('./utils/jupiter');
const {
  recordOpportunity,
  recordTrade,
  updatePerformance,
  getPerformanceSummary,
  getRecentOpportunities,
  getRecentTrades,
  generateDailyReport,
  formatPerformanceSummary
} = require('./utils/analytics');
const { initializeTelegramBot, sendMessage, setupBotCommands } = require('./utils/telegram');
const { initializeWallet, getWalletBalance, signAndSendTransaction } = require('./utils/wallet');
const { TOKEN_PAIRS, TOKENS, TRIANGULAR_PATHS } = require('./config/tokens');
const settings = require('./config/settings');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Global variables
let jupiterClient;
let telegramBot;
let wallet;
let scanningInterval;
let isScanning = false;
let sheetsClient;

// Simple arbitrage finder function
async function findArbitrageOpportunities(jupiterClient, minProfitPercent) {
  const opportunities = [];
  logger.info('Scanning for arbitrage opportunities...');

  // Check simple arbitrage (A -> B -> A)
  for (const pair of TOKEN_PAIRS) {
    const [tokenA, tokenB] = pair.split('-');
    const tokenAMint = TOKENS[tokenA].mint;
    const tokenBMint = TOKENS[tokenB].mint;

    logger.info(`Checking simple arbitrage for pair: ${tokenA}-${tokenB}`);

    try {
      // Get quote for A -> B
      const quoteAB = await getQuote(jupiterClient, tokenAMint, tokenBMint, TOKENS[tokenA].amount);
      if (!quoteAB) continue;

      // Get quote for B -> A
      const quoteBA = await getQuote(jupiterClient, tokenBMint, tokenAMint, quoteAB.outAmount);
      if (!quoteBA) continue;

      // Calculate profit
      const inputAmount = TOKENS[tokenA].amount;
      const outputAmount = quoteBA.outAmount;
      const profitPercent = calculateProfitPercentage(inputAmount, outputAmount);

      // Check if profit meets minimum threshold
      if (profitPercent >= minProfitPercent) {
        logger.info(`💰 Arbitrage opportunity found: ${tokenA}-${tokenB}-${tokenA} - Profit: ${profitPercent.toFixed(2)}%`);
        
        opportunities.push({
          type: 'simple',
          path: [tokenA, tokenB, tokenA],
          inputToken: tokenA,
          inputAmount: TOKENS[tokenA].amount,
          outputAmount: outputAmount,
          profitPercent: profitPercent,
          quotes: [quoteAB, quoteBA],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error(`Error checking arbitrage for ${tokenA}-${tokenB}:`, error);
    }
  }

  // Check triangular arbitrage (A -> B -> C -> A)
  for (const path of TRIANGULAR_PATHS) {
    const [tokenA, tokenB, tokenC] = path;
    logger.info(`Checking triangular arbitrage for path: ${tokenA}-${tokenB}-${tokenC}`);

    try {
      // Get quote for A -> B
      const quoteAB = await getQuote(jupiterClient, TOKENS[tokenA].mint, TOKENS[tokenB].mint, TOKENS[tokenA].amount);
      if (!quoteAB) continue;

      // Get quote for B -> C
      const quoteBC = await getQuote(jupiterClient, TOKENS[tokenB].mint, TOKENS[tokenC].mint, quoteAB.outAmount);
      if (!quoteBC) continue;

      // Get quote for C -> A
      const quoteCA = await getQuote(jupiterClient, TOKENS[tokenC].mint, TOKENS[tokenA].mint, quoteBC.outAmount);
      if (!quoteCA) continue;

      // Calculate profit
      const inputAmount = TOKENS[tokenA].amount;
      const outputAmount = quoteCA.outAmount;
      const profitPercent = calculateProfitPercentage(inputAmount, outputAmount);

      // Check if profit meets minimum threshold
      if (profitPercent >= minProfitPercent) {
        logger.info(`💰 Arbitrage opportunity found: ${tokenA}-${tokenB}-${tokenC}-${tokenA} - Profit: ${profitPercent.toFixed(2)}%`);
        
        opportunities.push({
          type: 'triangular',
          path: [tokenA, tokenB, tokenC, tokenA],
          inputToken: tokenA,
          inputAmount: TOKENS[tokenA].amount,
          outputAmount: outputAmount,
          profitPercent: profitPercent,
          quotes: [quoteAB, quoteBC, quoteCA],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error(`Error checking triangular arbitrage for ${tokenA}-${tokenB}-${tokenC}:`, error);
    }
  }

  return opportunities;
}

// Initialize the bot
async function initializeBot() {
  logger.info('🚀 Starting Solana Arbitrage Telegram Bot...');

  try {
    // Initialize Google Sheets
    try {
      if (process.env.GOOGLE_CREDENTIALS) {
        await setupCredentials();
        sheetsClient = await getSheetsClient();
        await initializeSheets(sheetsClient);
      } else if (process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
        // Alternative credentials method
        sheetsClient = await getSheetsClient();
        await initializeSheets(sheetsClient);
      } else {
        logger.warn('⚠️ No GOOGLE_CREDENTIALS environment variable found');
      }
    } catch (error) {
      logger.warn('⚠️ No credentials.json file found. Google Sheets functionality will be disabled.');
    }

    // Initialize Jupiter API client
    jupiterClient = await initJupiterClient();
    logger.info('✅ Jupiter API client initialized');

    // Initialize Solana connection
    const connection = getSolanaConnection();
    logger.info('✅ Solana connection initialized');

    // Initialize wallet
    try {
      wallet = await initializeWallet(connection);
      const balance = await getWalletBalance(connection, wallet.publicKey);
      logger.info(`✅ Wallet initialized with ${balance.sol} SOL`);
      logger.info(`Wallet balance: ${balance.sol} SOL (${balance.lamports} lamports)`);

      // Check if wallet has enough SOL
      if (balance.sol < settings.minWalletBalance) {
        logger.warn(`⚠️ Wallet balance (${balance.sol} SOL) is below minimum required (${settings.minWalletBalance} SOL)`);
      }
    } catch (error) {
      logger.error('❌ Error initializing wallet', error);
      logger.warn('⚠️ No wallet initialized. Trading functionality will be limited.');
    }

    // Initialize Telegram bot
    telegramBot = await initializeTelegramBot();
    logger.info('✅ Telegram bot initialized');

    // Send welcome message
    const chatId = process.env.TELEGRAM_CHAT_ID;
    await sendMessage(telegramBot, chatId, '🚀 *SolarBot Arbitrage Bot Initialized*\n\nUse /help to see available commands.');
    logger.info(`✅ Sent welcome message to chat ID: ${chatId}`);

    // Schedule daily summary
    cron.schedule('0 0 * * *', async () => {
      logger.info('Generating daily summary...');
      const summary = await generateDailyReport();
      await sendMessage(telegramBot, chatId, summary);
      
      if (sheetsClient) {
        await logDailySummary(sheetsClient, summary);
      }
    });
    logger.info('Scheduling daily summary at 00:00 UTC (cron: 0 0 * * *)');

    // Start background scanning
    const simulationMode = process.env.SIMULATION === 'true';
    startBackgroundScanning(simulationMode);

    // Set up bot commands
    await setupBotCommands(telegramBot);

    logger.info('🚀 Bot initialization complete!');
  } catch (error) {
    logger.error('❌ Error initializing bot:', error);
  }
}

// Start background scanning for arbitrage opportunities
function startBackgroundScanning(simulationMode = true) {
  if (isScanning) {
    logger.warn('⚠️ Background scanning is already running');
    return;
  }

  isScanning = true;
  const minProfitPercent = parseFloat(process.env.MIN_PROFIT_PERCENTAGE) || settings.arbitrage.minProfitPercentage;
  logger.info(`✅ Starting background scanning in ${simulationMode ? 'SIMULATION' : 'LIVE'} mode`);
  logger.info(`Minimum profit percentage: ${minProfitPercent}%`);

  scanningInterval = setInterval(async () => {
    try {
      const opportunities = await findArbitrageOpportunities(jupiterClient, minProfitPercent);
      
      for (const opportunity of opportunities) {
        // Record opportunity
        recordOpportunity(opportunity);
        
        // Log to Google Sheets if enabled
        if (sheetsClient) {
          await logOpportunity(sheetsClient, opportunity);
        }
        
        // Send notification
        const message = `💰 *Arbitrage Opportunity*\n\n` +
          `Path: ${opportunity.path.join(' → ')}\n` +
          `Profit: ${opportunity.profitPercent.toFixed(2)}%\n` +
          `Input: ${opportunity.inputAmount} ${opportunity.inputToken}\n` +
          `Output: ${opportunity.outputAmount} ${opportunity.inputToken}\n` +
          `Time: ${new Date(opportunity.timestamp).toLocaleString()}`;
        
        await sendMessage(telegramBot, process.env.TELEGRAM_CHAT_ID, message);
        
        // Execute trade if not in simulation mode and wallet is initialized
        if (!simulationMode && wallet) {
          // Implement trade execution logic here
        }
      }
    } catch (error) {
      logger.error('Error in background scanning:', error);
    }
  }, settings.arbitrage.interval);
}

// Stop background scanning
function stopBackgroundScanning() {
  if (!isScanning) {
    logger.warn('⚠️ Background scanning is not running');
    return;
  }

  clearInterval(scanningInterval);
  isScanning = false;
  logger.info('✅ Background scanning stopped');
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  stopBackgroundScanning();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  stopBackgroundScanning();
  process.exit(0);
});

// Start the server
app.get('/', (req, res) => {
  res.send('SolarBot Arbitrage Bot is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Initialize the bot
initializeBot();
