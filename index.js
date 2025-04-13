require('dotenv').config();
const cron = require('node-cron');
const { Connection } = require('@solana/web3.js');
const logger = require('./utils/logger');
const { setupCredentials, getSheetsClient, initializeSheets, logOpportunity, logTrade, logDailySummary } = require('./utils/sheets');
const {
  initJupiterClient,
  findArbitrageOpportunities,
  executeTrade
} = require('./utils/jupiter');
const pathFinder = require('./utils/path-finder');
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
const {
  initBot,
  sendMessage,
  sendOpportunityAlert,
  sendTradeAlert,
  sendDailySummary,
  sendErrorAlert,
  formatRecentOpportunities,
  formatRecentTrades,
  setupCommands
} = require('./utils/telegram');
const {
  initWallet,
  getWalletBalance,
  canExecuteTransaction,
  getWalletInfo
} = require('./utils/wallet');
const settings = require('./config/settings');

// Environment variables
const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  PRIVATE_KEY,
  SHEET_ID,
  SIMULATION = 'true'
} = process.env;

// Validate environment variables
if (!TELEGRAM_BOT_TOKEN) {
  logger.errorMessage('Missing TELEGRAM_BOT_TOKEN. Check your .env file.');
  process.exit(1);
}

// Global variables
let isScanning = false;
let simulationMode = SIMULATION === 'true';
let scanInterval;
let minProfitPercent = settings.trading.defaultMinProfitPercent;
let lastTradeTime = 0;
let sheetsClient = null;

// Initialize components
logger.startupMessage('Starting Solana Arbitrage Telegram Bot...');

// Setup Google credentials if needed
const credentialsSetup = setupCredentials();

// Initialize Jupiter client
const jupiterClient = initJupiterClient();
logger.successMessage('Jupiter API client initialized');

// Initialize path finder
pathFinder.initializePathFinder(jupiterClient)
  .then(() => {
    logger.successMessage('Path finder initialized');
  })
  .catch(error => {
    logger.errorMessage('Failed to initialize path finder:', error);
  });

// Initialize Solana connection
const connection = new Connection(settings.rpc.endpoint, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000
});
logger.successMessage('Solana connection initialized');

// Initialize wallet from private key if available
const wallet = initWallet(PRIVATE_KEY);

// Initialize Telegram bot
const bot = initBot(TELEGRAM_BOT_TOKEN);
if (!bot) {
  logger.errorMessage('Failed to initialize Telegram bot. Exiting...');
  process.exit(1);
}
logger.successMessage('Telegram bot initialized');

// Import performance metrics
let performanceMetrics;
try {
  performanceMetrics = require('./utils/performance-metrics');
} catch (error) {
  logger.debug('Performance metrics module not available');
  performanceMetrics = null;
}

// Start background scanning
async function startScanning() {
  if (isScanning) {
    logger.info('Scanning is already running');
    return;
  }

  isScanning = true;
  logger.successMessage(`Starting background scanning in ${simulationMode ? 'SIMULATION' : 'LIVE'} mode`);
  logger.info(`Minimum profit percentage: ${minProfitPercent}%`);

  if (TELEGRAM_CHAT_ID) {
    try {
      await sendMessage(
        bot,
        TELEGRAM_CHAT_ID,
        `🔍 Bot is now scanning for arbitrage opportunities in ${simulationMode ? '🟢 SIMULATION' : '🔴 LIVE'} mode.\n` +
        `🎯 Minimum profit percentage: ${minProfitPercent}%`
      );
    } catch (error) {
      logger.errorMessage('Error sending Telegram message', error);
    }
  }

  // Start scanning with initial interval
  scanInterval = setTimeout(runScan, settings.scanning.interval);
}

// Find arbitrage opportunities
async function findArbitrageOpportunities(jupiterClient, minProfitPercent) {
  // Import required modules
  const jupiter = require('./utils/jupiter');
  const pathHistory = require('./utils/path-history');
  const parallelProcessor = require('./utils/parallel-processor');
  const performanceMetrics = require('./utils/performance-metrics');

  // Start performance tracking
  const scanStartTime = performanceMetrics.recordScanStart();

  logger.info('Scanning for arbitrage opportunities...');
  logger.info(`Using RPC endpoint: ${settings.rpc.endpoint}`);

  // Adjust minimum profit threshold based on gas prices if enabled
  let adjustedMinProfit = minProfitPercent;
  if (settings.gasOptimization?.adjustProfitThresholds) {
    // Simple adjustment for now
    adjustedMinProfit = Math.max(minProfitPercent, 0.5);
    logger.info(`Adjusted minimum profit threshold to ${adjustedMinProfit.toFixed(2)}% based on gas prices`);
  }

  const opportunities = [];

  // Check simple arbitrage opportunities (exchange arbitrage)
  const pairs = [
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'USDC-USDT' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'So11111111111111111111111111111111111111112', name: 'USDC-SOL' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'USDC-BTC' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'USDC-ETH' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'USDC-JUP' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', name: 'USDC-RAY' },
    { inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', outputMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'USDC-BONK' },
    { inputMint: 'So11111111111111111111111111111111111111112', outputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'SOL-BTC' },
    { inputMint: 'So11111111111111111111111111111111111111112', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'SOL-ETH' },
    { inputMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', outputMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'BTC-ETH' }
  ];

  // Process simple arbitrage opportunities in parallel
  const simpleResults = await parallelProcessor.processArbitragePairs(
    pairs,
    jupiter.checkSimpleArbitrage,
    jupiterClient,
    settings.scanning.maxConcurrentRequests
  );

  // Add valid results to opportunities
  simpleResults.filter(Boolean).forEach(result => {
    opportunities.push(result);
    logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
    performanceMetrics.recordOpportunity(result);
  });

  // Check triangular arbitrage opportunities
  const paths = [
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'So11111111111111111111111111111111111111112', c: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'USDC-SOL-BTC' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'So11111111111111111111111111111111111111112', c: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', name: 'USDC-SOL-ETH' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', c: 'So11111111111111111111111111111111111111112', name: 'USDC-JUP-SOL' },
    { a: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', b: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', c: 'So11111111111111111111111111111111111111112', name: 'USDC-BONK-SOL' }
  ];

  // Process triangular arbitrage opportunities in parallel
  const amount = '100000000'; // 100 USDC with 6 decimals
  const triangularResults = await parallelProcessor.processArbitragePaths(
    paths,
    jupiter.checkTriangularArbitrage,
    jupiterClient,
    amount,
    settings.scanning.maxConcurrentRequests
  );

  // Add valid results to opportunities
  triangularResults.filter(Boolean).forEach(result => {
    opportunities.push(result);
    logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
    performanceMetrics.recordOpportunity(result);
  });

  // Check dynamic arbitrage opportunities if enabled
  if (settings.scanning.dynamicArbitrage?.enabled) {
    try {
      // Get path history
      const pathHistoryData = await pathHistory.getAllPathHistory();

      // Prepare dynamic arbitrage tasks
      const dynamicTasks = [];

      // For each base token and path length, create a task
      for (const baseTokenMint of settings.scanning.dynamicArbitrage.baseTokens) {
        for (const pathLength of settings.scanning.dynamicArbitrage.pathLengths) {
          // Get amount based on token
          const baseToken = jupiter.getTokenByMint(baseTokenMint);
          if (!baseToken) continue;

          const tokenAmount = jupiter.parseAmount(
            settings.trading.defaultQuoteAmount,
            baseToken.decimals
          );

          // Add task
          dynamicTasks.push({
            baseTokenMint,
            pathLength,
            amount: tokenAmount,
            useDynamicPositionSizing: settings.riskManagement.positionSizing?.enabled
          });
        }
      }

      // Process dynamic arbitrage tasks in parallel
      const dynamicResults = await parallelProcessor.processInParallel(
        dynamicTasks,
        async (task) => {
          return await jupiter.checkDynamicArbitrage(
            jupiterClient,
            task.baseTokenMint,
            task.pathLength,
            task.amount,
            task.useDynamicPositionSizing
          );
        },
        settings.scanning.maxConcurrentRequests
      );

      // Add valid results to opportunities
      dynamicResults.filter(Boolean).forEach(result => {
        opportunities.push(result);
        logger.opportunityFound(`${result.type} - Profit: ${result.profitPercent.toFixed(2)}%`);
        performanceMetrics.recordOpportunity(result);
      });
    } catch (error) {
      logger.error('Error checking dynamic arbitrage:', error);
    }
  }

  // Log opportunity types
  if (opportunities.length > 0) {
    const types = opportunities.reduce((acc, opp) => {
      acc[opp.type] = (acc[opp.type] || 0) + 1;
      return acc;
    }, {});
    logger.info(`Opportunity types: ${JSON.stringify(types)}`);
  }

  // Record scan completion
  performanceMetrics.recordScanEnd(scanStartTime, opportunities.length);

  return opportunities;
}

// Run a single scan
async function runScan() {
  try {
    const opportunities = await findArbitrageOpportunities(jupiterClient, minProfitPercent);

    if (opportunities.length > 0) {
      logger.info(`Found ${opportunities.length} arbitrage opportunities!`);

      // Process each opportunity
      for (const opportunity of opportunities) {
        // Record the opportunity
        recordOpportunity(opportunity);

        // Log to Google Sheets if enabled
        if (sheetsClient && SHEET_ID) {
          await logOpportunity(sheetsClient, SHEET_ID, opportunity);
        }

        // Send Telegram notification
        if (TELEGRAM_CHAT_ID) {
          await sendOpportunityAlert(bot, TELEGRAM_CHAT_ID, opportunity);
        }

        // Execute trade if auto-execute is enabled and enough time has passed since last trade
        if (settings.trading.autoExecuteTrades) {
          const now = Date.now();
          const timeSinceLastTrade = now - lastTradeTime;

          if (timeSinceLastTrade < settings.trading.minTimeBetweenTrades) {
            logger.info(`Skipping trade execution: minimum time between trades not reached (${Math.floor(timeSinceLastTrade / 1000)}s / ${Math.floor(settings.trading.minTimeBetweenTrades / 1000)}s)`);
            continue;
          }

          // Check if we can execute the trade based on risk management
          const tradeAmount = opportunity.startAmount || opportunity.inputAmount;
          const canExecute = await canExecuteTransaction(
            connection,
            wallet,
            tradeAmount
          );

          if (canExecute) {
            const trade = await executeTrade(
              jupiterClient,
              connection,
              wallet,
              opportunity,
              simulationMode
            );

            // Update last trade time
            lastTradeTime = now;

            // Record the trade
            recordTrade(trade);

            // Update performance metrics
            updatePerformance(trade);

            // Send trade notification
            if (TELEGRAM_CHAT_ID) {
              await sendTradeAlert(bot, TELEGRAM_CHAT_ID, trade);
            }

            // Log to Google Sheets if enabled
            if (sheetsClient && SHEET_ID) {
              await logTrade(sheetsClient, SHEET_ID, trade);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.errorMessage('Error in scan interval', error);

    // Send error notification
    if (TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
      await sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Error during scanning: ${error.message}`);
    }
  }

  // Schedule next scan with adaptive interval if still scanning
  if (isScanning) {
    // Get recommended scan interval based on performance metrics
    let nextInterval = settings.scanning.interval; // Default interval

    if (performanceMetrics) {
      const recommendedInterval = performanceMetrics.getRecommendedScanInterval();

      // Use recommended interval if it's valid
      if (recommendedInterval && recommendedInterval > 0) {
        nextInterval = recommendedInterval;
        logger.debug(`Using adaptive scan interval: ${nextInterval}ms`);
      }
    }

    // Schedule next scan
    scanInterval = setTimeout(runScan, nextInterval);
  }
}

// Stop background scanning
function stopScanning() {
  if (!isScanning) {
    logger.info('Scanning is not running');
    return;
  }

  clearTimeout(scanInterval);
  isScanning = false;
  logger.successMessage('Background scanning stopped');

  // Save performance metrics when stopping
  if (performanceMetrics) {
    performanceMetrics.saveMetrics();
  }

  if (TELEGRAM_CHAT_ID) {
    sendMessage(bot, TELEGRAM_CHAT_ID, '⏹️ Bot has stopped scanning for arbitrage opportunities.')
      .catch(error => logger.errorMessage('Error sending Telegram message', error));
  }
}

// Schedule daily summary
function scheduleDailySummary() {
  // Parse the time from settings
  const [hours, minutes] = settings.notifications.dailySummaryTime.split(':').map(Number);

  // Create cron schedule
  const cronSchedule = `${minutes} ${hours} * * *`;

  logger.info(`Scheduling daily summary at ${settings.notifications.dailySummaryTime} UTC (cron: ${cronSchedule})`);

  // Schedule using node-cron
  cron.schedule(cronSchedule, async () => {
    logger.info('Running scheduled daily summary');

    // Send the summary to Telegram
    if (TELEGRAM_CHAT_ID) {
      await sendDailySummary(bot, TELEGRAM_CHAT_ID);
    }

    // Log to Google Sheets
    if (sheetsClient && SHEET_ID) {
      const summary = getPerformanceSummary();
      await logDailySummary(sheetsClient, SHEET_ID, summary);
    }
  });
}

// Setup bot commands
setupCommands(bot, {
  // Basic commands
  onStart: (msg) => {
    const chatId = msg.chat.id;
    sendMessage(bot, chatId,
      '�� *Welcome to the Solana Arbitrage Bot!*\n\n' +
      '*Commands:*\n' +
      '`/ping` - Check if the bot is running\n' +
      '`/chatid` - Get your chat ID\n' +
      '`/live` - Enable live trading mode\n' +
      '`/simulate` - Enable simulation mode\n' +
      '`/pause` - Pause background scanning\n' +
      '`/resume` - Resume background scanning\n' +
      '`/setprofit <percent>` - Set minimum profit percentage\n' +
      '`/status` - Get current bot status\n' +
      '`/summary` - Get performance summary\n' +
      '`/opportunities` - View recent opportunities\n' +
      '`/trades` - View recent trades\n' +
      '`/settings` - View current settings\n' +
      '`/help` - Show this help message'
    );
  },

  onPing: (msg) => {
    sendMessage(bot, msg.chat.id, '🏓 Pong!');
  },

  onChatId: (msg) => {
    const chatId = msg.chat.id;
    logger.info(`Chat ID requested by user: ${chatId}`);
    sendMessage(bot, msg.chat.id, `Your Chat ID is: \`${chatId}\``);
  },

  // Mode commands
  onLive: (msg) => {
    simulationMode = false;
    sendMessage(bot, msg.chat.id, '🔴 *Live trading mode enabled. BE CAREFUL!*\n\nThe bot will execute real trades with real funds.');
    logger.info(`Live trading mode enabled by user: ${msg.chat.id}`);
  },

  onSimulate: (msg) => {
    simulationMode = true;
    sendMessage(bot, msg.chat.id, '🟢 *Simulation mode enabled.*\n\nNo real trades will be executed.');
    logger.info(`Simulation mode enabled by user: ${msg.chat.id}`);
  },

  // Control commands
  onPause: (msg) => {
    stopScanning();
    sendMessage(bot, msg.chat.id, '⏸️ Background scanning paused.');
  },

  onResume: (msg) => {
    startScanning();
    sendMessage(bot, msg.chat.id, '▶️ Background scanning resumed.');
  },

  // Settings commands
  onSetProfit: (msg, profit) => {
    minProfitPercent = profit;
    sendMessage(bot, msg.chat.id, `🎯 Minimum profit percentage set to ${profit}%`);
    logger.info(`Minimum profit percentage set to ${profit}% by user: ${msg.chat.id}`);
  },

  // Info commands
  onStatus: async (msg) => {
    const walletInfo = await getWalletInfo(connection, wallet);
    const summary = getPerformanceSummary();

    sendMessage(bot, msg.chat.id,
      `📊 *Bot Status*\n\n` +
      `*Scanning:* ${isScanning ? '✅ Running' : '⏸️ Paused'}\n` +
      `*Mode:* ${simulationMode ? '🟢 Simulation' : '🔴 Live'}\n` +
      `*Min Profit:* ${minProfitPercent}%\n\n` +

      `*Wallet:*\n` +
      `Address: \`${walletInfo.displayAddress}\`\n` +
      `Balance: ${walletInfo.sol.toFixed(6)} SOL\n` +
      `Status: ${walletInfo.status}\n\n` +

      `*Today's Stats:*\n` +
      `Opportunities: ${summary.today.trades}\n` +
      `Successful: ${summary.today.successfulTrades}\n` +
      `Profit: ${summary.today.profit.toFixed(6)} USDC\n\n` +

      `*Overall:*\n` +
      `Total Trades: ${summary.overall.totalTrades}\n` +
      `Success Rate: ${summary.overall.successRate.toFixed(2)}%\n` +
      `Total Profit: ${summary.overall.totalProfit.toFixed(6)} USDC`
    );
  },

  onSummary: (msg) => {
    const summary = getPerformanceSummary();
    const formattedSummary = formatPerformanceSummary(summary);
    sendMessage(bot, msg.chat.id, formattedSummary);
  },

  onOpportunities: (msg) => {
    const opportunities = getRecentOpportunities(5);
    const formattedOpportunities = formatRecentOpportunities(opportunities);
    sendMessage(bot, msg.chat.id, formattedOpportunities);
  },

  onTrades: (msg) => {
    const trades = getRecentTrades(5);
    const formattedTrades = formatRecentTrades(trades);
    sendMessage(bot, msg.chat.id, formattedTrades);
  },

  onSettings: (msg) => {
    sendMessage(bot, msg.chat.id,
      `⚙️ *Bot Settings*\n\n` +
      `*Scanning:*\n` +
      `Interval: ${settings.scanning.interval / 1000}s\n` +
      `Max Opportunities: ${settings.scanning.maxOpportunities}\n\n` +

      `*Trading:*\n` +
      `Default Min Profit: ${settings.trading.defaultMinProfitPercent}%\n` +
      `Current Min Profit: ${minProfitPercent}%\n` +
      `Max Slippage: ${settings.trading.maxSlippagePercent}%\n` +
      `Quote Amount: ${settings.trading.defaultQuoteAmount} USDC\n` +
      `Max Trade Amount: ${settings.trading.maxTradeAmount} USDC\n` +
      `Auto Execute: ${settings.trading.autoExecuteTrades ? 'Enabled' : 'Disabled'}\n\n` +

      `*Risk Management:*\n` +
      `Max Daily Volume: ${settings.riskManagement.maxDailyVolume} USDC\n` +
      `Max Daily Trades: ${settings.riskManagement.maxDailyTrades}\n` +
      `Min Wallet Balance: ${settings.riskManagement.minWalletBalance} SOL\n` +
      `Circuit Breaker: ${settings.riskManagement.enableCircuitBreaker ? 'Enabled' : 'Disabled'}`
    );
  },

  onHelp: (msg) => {
    sendMessage(bot, msg.chat.id,
      '🤖 *Solana Arbitrage Bot Help*\n\n' +
      '*Basic Commands:*\n' +
      '`/ping` - Check if the bot is running\n' +
      '`/chatid` - Get your chat ID\n\n' +

      '*Trading Mode:*\n' +
      '`/live` - Enable live trading mode\n' +
      '`/simulate` - Enable simulation mode (default)\n\n' +

      '*Control Commands:*\n' +
      '`/pause` - Pause background scanning\n' +
      '`/resume` - Resume background scanning\n\n' +

      '*Settings:*\n' +
      '`/setprofit <percent>` - Set minimum profit percentage\n\n' +

      '*Information:*\n' +
      '`/status` - Get current bot status\n' +
      '`/summary` - Get performance summary\n' +
      '`/opportunities` - View recent opportunities\n' +
      '`/trades` - View recent trades\n' +
      '`/settings` - View current settings\n' +
      '`/performance` - View performance metrics\n' +
      '`/help` - Show this help message'
    );
  }
});

// Main function
async function main() {
  try {
    // Initialize Google Sheets client if credentials are available
    if (credentialsSetup && SHEET_ID) {
      sheetsClient = await getSheetsClient();
      if (sheetsClient) {
        logger.successMessage('Google Sheets client initialized');

        // Initialize sheets with headers if needed
        await initializeSheets(sheetsClient, SHEET_ID);
      }
    }

    // Check wallet status
    if (wallet) {
      const { sol } = await getWalletBalance(connection, wallet);
      logger.successMessage(`Wallet initialized with ${sol.toFixed(6)} SOL`);

      if (sol < settings.riskManagement.minWalletBalance) {
        logger.warningMessage(`Wallet balance (${sol.toFixed(6)} SOL) is below minimum required (${settings.riskManagement.minWalletBalance} SOL)`);
      }
    } else {
      logger.warningMessage('No wallet initialized. Trading functionality will be limited.');
    }

    // Send welcome message if chat ID is set
    if (TELEGRAM_CHAT_ID) {
      try {
        await sendMessage(
          bot,
          TELEGRAM_CHAT_ID,
          '🤖 *Solana Arbitrage Bot is now connected and running!*\n\n' +
          `Mode: ${simulationMode ? '🟢 Simulation' : '�� Live'}\n` +
          'Send /help to see available commands.'
        );
        logger.successMessage(`Sent welcome message to chat ID: ${TELEGRAM_CHAT_ID}`);
      } catch (error) {
        logger.errorMessage('Error sending welcome message', error);
        logger.warningMessage('The TELEGRAM_CHAT_ID in your .env file may be incorrect.');
        logger.warningMessage('Send /chatid to your bot to get the correct chat ID.');
      }
    } else {
      logger.warningMessage('No TELEGRAM_CHAT_ID set. Cannot send welcome message.');
      logger.warningMessage('Send /chatid to your bot to get your chat ID, then update your .env file.');
    }

    // Schedule daily summary if enabled
    if (settings.notifications.sendDailySummaries) {
      scheduleDailySummary();
    }

    // Start background scanning if auto-start is enabled
    if (settings.scanning.autoStart) {
      startScanning();
    }

    logger.startupMessage('Bot initialization complete!');
  } catch (error) {
    logger.errorMessage('Error in main function', error);

    // Send error notification
    if (TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
      await sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Critical error during startup: ${error.message}`);
    }
  }
}

// Run the main function
main().catch(error => {
  logger.errorMessage('Unhandled error in main function', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  stopScanning();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  stopScanning();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.errorMessage('Uncaught exception', error);

  // Send error notification
  if (bot && TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
    sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Uncaught exception: ${error.message}`)
      .finally(() => {
        process.exit(1);
      });
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.errorMessage('Unhandled promise rejection', reason);

  // Send error notification
  if (bot && TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
    sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Unhandled promise rejection: ${reason}`)
      .catch(() => {});
  }
});
