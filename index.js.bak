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
const userManager = require('./utils/user-manager');
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

// Initialize user manager
userManager.initializeUserManager()
  .then(() => {
    logger.successMessage('User manager initialized');

    // Initialize path finder
    return pathFinder.initializePathFinder(jupiterClient);
  })
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

  // Get user ID (in single-user mode, use the default user ID)
  const userId = settings.multiUserMode ? TELEGRAM_CHAT_ID : settings.defaultUserId;

  // Get user's tier information
  const tierName = userManager.getUserTierName(userId);
  const userSimulationOnly = userManager.isSimulationOnly(userId);

  // If user is limited to simulation mode, force simulation mode
  const effectiveSimulationMode = userSimulationOnly ? true : simulationMode;

  // If user is limited to simulation mode but trying to use live mode, warn them
  if (userSimulationOnly && !simulationMode) {
    logger.warn(`User ${userId} is limited to simulation mode by their ${tierName} tier. Forcing simulation mode.`);

    if (TELEGRAM_CHAT_ID) {
      try {
        await sendMessage(
          bot,
          TELEGRAM_CHAT_ID,
          '⚠️ *Tier Limitation*\n\n' +
          `Your current subscription tier (${tierName}) is limited to simulation mode only.\n\n` +
          'To enable live trading, please upgrade your subscription.'
        );
      } catch (error) {
        logger.errorMessage('Error sending Telegram message', error);
      }
    }
  }

  isScanning = true;
  logger.successMessage(`Starting background scanning in ${effectiveSimulationMode ? 'SIMULATION' : 'LIVE'} mode`);
  logger.info(`Minimum profit percentage: ${minProfitPercent}%`);
  logger.info(`User tier: ${tierName}`);

  if (TELEGRAM_CHAT_ID) {
    try {
      await sendMessage(
        bot,
        TELEGRAM_CHAT_ID,
        `🔍 Bot is now scanning for arbitrage opportunities in ${effectiveSimulationMode ? '🟢 SIMULATION' : '🔴 LIVE'} mode.\n` +
        `🎯 Minimum profit percentage: ${minProfitPercent}%\n` +
        `👑 Subscription tier: ${tierName}`
      );
    } catch (error) {
      logger.errorMessage('Error sending Telegram message', error);
    }
  }

  // Start scanning with user's tier-specific interval
  const userScanInterval = userManager.getUserScanInterval(userId);
  scanInterval = setTimeout(runScan, userScanInterval);
}



// Run a single scan
async function runScan() {
  try {
    // Get user ID (in single-user mode, use the default user ID)
    const userId = settings.multiUserMode ? TELEGRAM_CHAT_ID : settings.defaultUserId;

    // Check if user has reached their daily scan limit
    const canScan = await userManager.recordUserScan(userId);
    if (!canScan) {
      logger.warn(`User ${userId} has reached their daily scan limit. Skipping scan.`);

      // If in multi-user mode and we have a chat ID, notify the user
      if (settings.multiUserMode && TELEGRAM_CHAT_ID) {
        await sendMessage(
          bot,
          TELEGRAM_CHAT_ID,
          '⚠️ *Daily Scan Limit Reached*\n\n' +
          'You have reached your daily scan limit for your current subscription tier.\n\n' +
          'To continue scanning, please upgrade your subscription.'
        );
      }

      // Schedule next scan anyway (will check limit again)
      scheduleNextScan();
      return;
    }

    // Get user's allowed arbitrage types
    const allowedTypes = userManager.getAllowedArbitrageTypes(userId);

    // Get user's scan interval (for adaptive scanning)
    const userScanInterval = userManager.getUserScanInterval(userId);

    // Check if user is limited to simulation mode
    const userSimulationOnly = userManager.isSimulationOnly(userId);

    // If user is limited to simulation mode, force simulation mode
    const effectiveSimulationMode = userSimulationOnly ? true : simulationMode;

    // Get user's max concurrent requests
    const maxConcurrentRequests = userManager.getMaxConcurrentRequests(userId);

    // Update settings based on user's tier
    const scanOptions = {
      allowedTypes,
      maxConcurrentRequests,
      userId
    };

    // Run the scan with user-specific settings
    const opportunities = await findArbitrageOpportunities(jupiterClient, minProfitPercent, scanOptions);

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
  scheduleNextScan();
}

/**
 * Schedule the next scan based on user tier and adaptive interval
 */
function scheduleNextScan() {
  if (isScanning) {
    // Get user ID (in single-user mode, use the default user ID)
    const userId = settings.multiUserMode ? TELEGRAM_CHAT_ID : settings.defaultUserId;

    // Get user's scan interval
    let nextInterval = userManager.getUserScanInterval(userId);

    // If adaptive intervals are enabled, adjust based on performance metrics
    if (settings.scanning.adaptiveIntervals && performanceMetrics) {
      const recommendedInterval = performanceMetrics.getRecommendedScanInterval();

      // Use recommended interval if it's valid and within user's tier limits
      if (recommendedInterval && recommendedInterval > 0) {
        // Make sure we don't go below the user's tier limit
        nextInterval = Math.max(recommendedInterval, nextInterval);
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

  // Tier management (admin only)
  onSetTier: async (msg, userId, tier) => {
    // Check if user is admin
    if (msg.chat.id.toString() !== process.env.ADMIN_CHAT_ID) {
      await sendMessage(bot, msg.chat.id, '❌ This command is only available to administrators.');
      return;
    }

    // Set the user's tier
    const success = await userManager.setUserTier(userId, tier);

    if (success) {
      await sendMessage(
        bot,
        msg.chat.id,
        `✅ User ${userId} tier set to ${tier} successfully.`
      );

      // Notify the user if possible
      try {
        await sendMessage(
          bot,
          userId,
          `🎉 *Your Subscription Has Been Updated*\n\n` +
          `Your SolarBot subscription tier has been updated to: *${tier}*\n\n` +
          `Use /status to see your new features and limits.`
        );
      } catch (error) {
        logger.warn(`Could not notify user ${userId} about tier change: ${error.message}`);
      }
    } else {
      await sendMessage(
        bot,
        msg.chat.id,
        `❌ Failed to set user ${userId} tier to ${tier}. Please check the tier name and try again.`
      );
    }
  },

  // Info commands
  onStatus: async (msg) => {
    const walletInfo = await getWalletInfo(connection, wallet);
    const summary = getPerformanceSummary();

    // Get user ID from message
    const userId = msg.chat.id;

    // Get user's tier information
    const tierName = userManager.getUserTierName(userId);
    const userSimulationOnly = userManager.isSimulationOnly(userId);
    const userScanInterval = userManager.getUserScanInterval(userId) / 1000; // Convert to seconds
    const maxPairs = userManager.getMaxTokenPairs(userId);
    const maxConcurrentRequests = userManager.getMaxConcurrentRequests(userId);
    const allowedTypes = userManager.getAllowedArbitrageTypes(userId);
    const supportLevel = userManager.getSupportLevel(userId);

    // Get user's usage statistics
    const usage = userManager.getUserUsage(userId);
    const dailyScansLimit = userManager.getUserLimit(userId, 'maxDailyScans');
    const dailyScansUsed = usage.dailyScans;
    const dailyScansRemaining = dailyScansLimit - dailyScansUsed;

    // Get system uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = days > 0 ?
      `${days}d ${hours}h ${minutes}m` :
      hours > 0 ?
        `${hours}h ${minutes}m ${seconds}s` :
        `${minutes}m ${seconds}s`;

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;

    // Get recent opportunities count
    const recentOpportunities = getRecentOpportunities(10);
    const last24hOpportunities = recentOpportunities.filter(
      opp => (Date.now() - opp.timestamp) < 24 * 60 * 60 * 1000
    ).length;

    // Create inline keyboard
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Refresh', callback_data: 'status' },
            { text: '📈 Performance', callback_data: 'performance' }
          ],
          [
            { text: '💰 Opportunities', callback_data: 'opportunities' },
            { text: '⚙️ Settings', callback_data: 'settings' }
          ],
          [
            isScanning ?
              { text: '⏸️ Pause Scanning', callback_data: 'pause' } :
              { text: '▶️ Resume Scanning', callback_data: 'resume' }
          ]
        ]
      }
    };

    await bot.sendMessage(
      msg.chat.id,
      `📊 *SolarBot Status*\n\n` +
      `*Bot Status:*\n` +
      `• Scanning: ${isScanning ? '🟢 Running' : '🔴 Paused'}\n` +
      `• Mode: ${simulationMode ? '🟢 SIMULATION' : '🔴 LIVE TRADING'}\n` +
      `• Min Profit: ${minProfitPercent}%\n` +
      `• Scan Interval: ${userScanInterval}s\n\n` +

      `*Subscription:*\n` +
      `• Tier: ${tierName} ${userSimulationOnly ? '(🟢 Simulation Only)' : ''}\n` +
      `• Daily Scans: ${dailyScansUsed}/${dailyScansLimit} (${dailyScansRemaining} remaining)\n` +
      `• Max Pairs: ${maxPairs === Infinity ? 'Unlimited' : maxPairs}\n` +
      `• Arbitrage Types: ${allowedTypes.join(', ')}\n` +
      `• Support Level: ${supportLevel}\n\n` +

      `*Wallet:*\n` +
      `• Address: \`${walletInfo.displayAddress}\`\n` +
      `• Balance: ${walletInfo.sol.toFixed(6)} SOL\n` +
      `• Status: ${walletInfo.status}\n\n` +

      `*Today's Stats:*\n` +
      `• Opportunities: ${summary.today.trades}\n` +
      `• Successful: ${summary.today.successfulTrades}\n` +
      `• Profit: ${summary.today.profit.toFixed(6)} USDC\n\n` +

      `*Overall:*\n` +
      `• Total Trades: ${summary.overall.totalTrades}\n` +
      `• Success Rate: ${summary.overall.successRate.toFixed(2)}%\n` +
      `• Total Profit: ${summary.overall.totalProfit.toFixed(6)} USDC\n\n` +

      `*System:*\n` +
      `• Uptime: ${uptimeStr}\n` +
      `• Memory: ${memoryUsedMB}MB / ${memoryTotalMB}MB\n` +
      `• Recent Opportunities: ${last24hOpportunities} (24h)\n\n` +

      `_Last updated: ${new Date().toLocaleString()}_`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...inlineKeyboard
      }
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
    // Get user ID from message
    const userId = msg.chat.id;

    // Get user's tier information
    const tierName = userManager.getUserTierName(userId);
    const userSimulationOnly = userManager.isSimulationOnly(userId);

    // Check if user is admin
    const isAdmin = userId.toString() === process.env.ADMIN_CHAT_ID;

    sendMessage(bot, msg.chat.id,
      '🌟 *SolarBot Arbitrage Trading Help*\n\n' +
      `*Your Subscription: ${tierName}*\n` +
      (userSimulationOnly ? '_Note: Your tier is limited to simulation mode only_\n\n' : '\n\n') +

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
      '`/setprofit <percent>` - Set minimum profit percentage\n' +
      (isAdmin ? '`/settier <user_id> <tier>` - Set user tier (admin only)\n\n' : '\n\n') +

      '*Information:*\n' +
      '`/status` - Get current bot status and tier details\n' +
      '`/summary` - Get performance summary\n' +
      '`/opportunities` - View recent opportunities\n' +
      '`/trades` - View recent trades\n' +
      '`/settings` - View current settings\n' +
      '`/performance` - View performance metrics\n' +
      '`/help` - Show this help message\n\n' +

      '*Subscription Tiers:*\n' +
      '• Basic - Free tier with simulation mode only\n' +
      '• Pro - Standard tier with live trading\n' +
      '• Elite - Professional tier with advanced features\n' +
      '• Institutional - Enterprise tier with custom features'
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
        // Create inline keyboard with quick actions
        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Status', callback_data: 'status' },
                { text: '📈 Performance', callback_data: 'performance' }
              ],
              [
                { text: '💰 Opportunities', callback_data: 'opportunities' },
                { text: '⚙️ Settings', callback_data: 'settings' }
              ],
              [
                { text: '❓ Help', callback_data: 'help' }
              ]
            ]
          }
        };

        await bot.sendMessage(
          TELEGRAM_CHAT_ID,
          '🌟 *SolarBot Arbitrage Trading* 🌟\n\n' +
          'Your advanced trading assistant is now connected and ready!\n\n' +
          '*Current Status:*\n' +
          `• Mode: ${simulationMode ? '🟢 SIMULATION' : '🔴 LIVE TRADING'}\n` +
          `• Min Profit: ${minProfitPercent}%\n` +
          `• Scanning: ${settings.scanning.interval / 1000}s intervals\n\n` +
          'Use the buttons below to get started or type /help for all commands.',
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...inlineKeyboard
          }
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
