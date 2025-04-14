require('dotenv').config();
const cron = require('node-cron');
const logger = require('./utils/logger');
const alertManager = require('./utils/alerts');
const { setupCredentials, getSheetsClient, initializeSheets, logOpportunity, logTrade, logDailySummary } = require('./utils/sheets');
const {
  initJupiterClient,
  getSolanaConnection,
  findArbitrageOpportunities,
  executeTrade
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
const {
  initBot,
  sendMessage,
  sendOpportunityAlert,
  sendTradeAlert,
  sendDailySummary,
  sendErrorAlert,
  formatRecentOpportunities,
  formatRecentTrades,
  formatRiskSettings,
  setupCommands
} = require('./utils/telegram');
const riskManager = require('./utils/riskManager');
const { processOpportunity, monitorActiveTrades, adjustScanInterval } = require('./utils/trading');
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
let monitorInterval;
let minProfitPercent = settings.trading.defaultMinProfitPercent;
let lastTradeTime = 0;
let activeTrades = [];
let sheetsClient = null;

// Initialize components
logger.startupMessage('Starting Solana Arbitrage Telegram Bot...');

// Setup Google credentials if needed
const credentialsSetup = setupCredentials();

// Initialize Jupiter client
const jupiterClient = initJupiterClient();
logger.successMessage('Jupiter API client initialized');

// Initialize Solana connection
const connection = getSolanaConnection();
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

// Start trade monitoring for stop-loss and take-profit
async function startTradeMonitoring() {
  if (monitorInterval) {
    logger.info('Trade monitoring is already running');
    return;
  }

  logger.successMessage('Starting trade monitoring for stop-loss and take-profit');

  // Run monitoring at regular intervals
  monitorInterval = setInterval(async () => {
    try {
      if (activeTrades.length === 0) {
        return; // No active trades to monitor
      }

      const userId = TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID.toString() : 'default';

      // Monitor active trades for stop-loss and take-profit conditions
      const updatedTrades = await monitorActiveTrades(
        userId,
        activeTrades,
        connection,
        wallet
      );

      // Check if any trades were closed
      if (updatedTrades.length < activeTrades.length) {
        const closedCount = activeTrades.length - updatedTrades.length;
        logger.info(`Closed ${closedCount} trades due to stop-loss or take-profit conditions`);

        // Send notification
        if (TELEGRAM_CHAT_ID) {
          await sendMessage(
            bot,
            TELEGRAM_CHAT_ID,
            `🔔 *Trade Alert*\n\nClosed ${closedCount} ${closedCount === 1 ? 'trade' : 'trades'} due to stop-loss or take-profit conditions.`
          );
        }
      }

      // Update active trades list
      activeTrades = updatedTrades;

    } catch (error) {
      logger.errorMessage('Error in trade monitoring', error);

      // Send error notification
      if (TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
        await sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Error during trade monitoring: ${error.message}`);
      }
    }
  }, settings.riskManagement.monitoringInterval || 30000); // Default to 30 seconds if not specified
}

// Stop trade monitoring
function stopTradeMonitoring() {
  if (!monitorInterval) {
    logger.info('Trade monitoring is not running');
    return;
  }

  clearInterval(monitorInterval);
  monitorInterval = null;
  logger.successMessage('Trade monitoring stopped');

  if (TELEGRAM_CHAT_ID) {
    sendMessage(bot, TELEGRAM_CHAT_ID, '⏹️ Bot has stopped monitoring trades for stop-loss and take-profit conditions.')
      .catch(error => logger.errorMessage('Error sending Telegram message', error));
  }
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

  // Run scan at the specified interval
  scanInterval = setInterval(async () => {
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
            const userId = TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID.toString() : 'default';

            if (timeSinceLastTrade < settings.trading.minTimeBetweenTrades) {
              logger.info(`Skipping trade execution: minimum time between trades not reached (${Math.floor(timeSinceLastTrade / 1000)}s / ${Math.floor(settings.trading.minTimeBetweenTrades / 1000)}s)`);
              continue;
            }

            // Process the opportunity using our risk management system
            const tradeResult = await processOpportunity(
              userId,
              opportunity,
              {
                simulation: simulationMode,
                trading: settings.trading,
                riskManagement: settings.riskManagement
              },
              connection,
              wallet
            );

            if (tradeResult.success) {
              // Update last trade time
              lastTradeTime = now;

              // Send trade notification
              if (TELEGRAM_CHAT_ID) {
                await sendTradeAlert(bot, TELEGRAM_CHAT_ID, {
                  opportunity,
                  result: tradeResult,
                  timestamp: now,
                  simulation: simulationMode
                });
              }

              // Log to Google Sheets if enabled
              if (sheetsClient && SHEET_ID) {
                await logTrade(sheetsClient, SHEET_ID, {
                  opportunity,
                  result: tradeResult,
                  timestamp: now,
                  simulation: simulationMode
                });
              }
            } else if (TELEGRAM_CHAT_ID && tradeResult.message && tradeResult.message.includes('Risk management')) {
              // Send risk management notification
              await sendMessage(bot, TELEGRAM_CHAT_ID, `⚠️ *Risk Management Alert*\n\n${tradeResult.message}`);
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
  }, settings.scanning.interval);
}

// Stop background scanning
function stopScanning() {
  if (!isScanning) {
    logger.info('Scanning is not running');
    return;
  }

  clearInterval(scanInterval);
  isScanning = false;
  logger.successMessage('Background scanning stopped');

  if (TELEGRAM_CHAT_ID) {
    sendMessage(bot, TELEGRAM_CHAT_ID, '⏹️ Bot has stopped scanning for arbitrage opportunities.')
      .catch(error => logger.errorMessage('Error sending Telegram message', error));
  }

  // Also stop trade monitoring
  if (monitorInterval) {
    stopTradeMonitoring();
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
    const chatId = msg.chat.id;
    const userId = chatId.toString();

    // Get user's risk settings
    const riskSettings = riskManager.getRiskSettingsSummary(userId);

    sendMessage(bot, chatId,
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
      `Risk Level: ${riskSettings.riskLevel.toUpperCase()}\n` +
      `Max Position Size: ${riskSettings.maxPositionSizePercent}% of wallet\n` +
      `Stop Loss: ${riskSettings.stopLossPercent}%\n` +
      `Take Profit: ${riskSettings.takeProfitPercent}%\n` +
      `Max Daily Volume: ${settings.riskManagement.maxDailyVolume} USDC\n` +
      `Max Daily Trades: ${settings.riskManagement.maxDailyTrades}\n` +
      `Min Wallet Balance: ${settings.riskManagement.minWalletBalance} SOL\n` +
      `Circuit Breaker: ${settings.riskManagement.enableCircuitBreaker ? 'Enabled' : 'Disabled'}`
    );
  },

  // Risk management commands
  onSetRiskLevel: (msg, riskLevel) => {
    const chatId = msg.chat.id;
    const userId = chatId.toString();

    if (riskManager.setUserRiskLevel(userId, riskLevel)) {
      sendMessage(bot, chatId, `✅ Risk level set to *${riskLevel.toUpperCase()}*`);
    } else {
      sendMessage(bot, chatId, `❌ Failed to set risk level. Valid options are: low, medium, high`);
    }
  },

  onSetRiskParam: (msg, paramName, paramValue) => {
    const chatId = msg.chat.id;
    const userId = chatId.toString();

    // Validate parameter name
    const validParams = ['maxPositionSizePercent', 'stopLossPercent', 'takeProfitPercent', 'maxSlippage', 'minProfitThreshold'];

    if (!validParams.includes(paramName)) {
      sendMessage(bot, chatId, `❌ Invalid parameter name. Valid parameters are: ${validParams.join(', ')}`);
      return;
    }

    if (riskManager.setRiskParameter(userId, paramName, paramValue)) {
      sendMessage(bot, chatId, `✅ Risk parameter *${paramName}* set to *${paramValue}*`);
    } else {
      sendMessage(bot, chatId, `❌ Failed to set risk parameter`);
    }
  },

  onRiskSettings: (msg) => {
    const chatId = msg.chat.id;
    const userId = chatId.toString();

    const riskSettingsMessage = formatRiskSettings(userId);
    sendMessage(bot, chatId, riskSettingsMessage);
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
      '`/setprofit <percent>` - Set minimum profit percentage\n' +
      '`/setrisk <level>` - Set risk level (low, medium, high)\n' +
      '`/setriskparam <name> <value>` - Set specific risk parameter\n\n' +

      '*Information:*\n' +
      '`/status` - Get current bot status\n' +
      '`/summary` - Get performance summary\n' +
      '`/opportunities` - View recent opportunities\n' +
      '`/trades` - View recent trades\n' +
      '`/settings` - View current settings\n' +
      '`/risk` - View risk management settings\n' +
      '`/help` - Show this help message'
    );
  }
});

// Main function
// System monitoring function
async function monitorSystem() {
  try {
    await alertManager.checkSystemMetrics();
  } catch (error) {
    logger.errorMessage('Error in system monitoring', error);
  }
}

// Start system monitoring
function startSystemMonitoring() {
  // Check system metrics every 5 minutes
  setInterval(monitorSystem, 5 * 60 * 1000);
  logger.successMessage('System monitoring started');
}

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

    // Start trade monitoring for stop-loss and take-profit
    if (settings.riskManagement.enableStopLossAndTakeProfit) {
      startTradeMonitoring();
      startSystemMonitoring();
    }

    logger.startupMessage('Bot initialization complete!');
  } catch (error) {
    logger.errorMessage('Error in main function', error);
    await alertManager.trackError({ message: error.message, critical: true });

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
process.on('uncaughtException', async (error) => {
  logger.errorMessage('Uncaught exception', error);
  await alertManager.trackError({ message: error.message, critical: true });

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
process.on('unhandledRejection', async (reason, promise) => {
  logger.errorMessage('Unhandled promise rejection', reason);
  await alertManager.trackError({ message: reason.toString(), critical: true });

  // Send error notification
  if (bot && TELEGRAM_CHAT_ID && settings.notifications.sendErrorAlerts) {
    sendErrorAlert(bot, TELEGRAM_CHAT_ID, `Unhandled promise rejection: ${reason}`)
      .catch(() => {});
  }
});
