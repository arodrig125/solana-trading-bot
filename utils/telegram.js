const TelegramBot = require('node-telegram-bot-api');
const { getPerformanceSummary, getRecentOpportunities, getRecentTrades, formatPerformanceSummary } = require('./analytics');
const settings = require('../config/settings');
const logger = require('./logger');
const riskManager = require('./riskManager');
const tokenManager = require('./tokenManager');
const telegramUI = require('./telegramUI');

// Initialize Telegram bot
function initBot(token) {
  if (!token) {
    logger.errorMessage('No Telegram bot token provided');
    return null;
  }

  try {
    // Create bot instance with polling
    const bot = new TelegramBot(token, {
      polling: true,
      polling_options: {
        timeout: 10,
        limit: 100
      },
      onlyFirstMatch: true
    });

    // Handle callback queries from inline keyboards
    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const action = query.data;

      try {
        switch (action) {
          case 'menu':
            await bot.editMessageText(
              'Main Menu',
              {
                chat_id: chatId,
                message_id: messageId,
                ...telegramUI.getMainMenuKeyboard()
              }
            );
            break;

          case 'status':
            const status = {
              mode: settings.get('tradingMode', 'simulation'),
              isPaused: settings.get('isPaused', false),
              uptime: getUptime(),
              opportunities: await getRecentOpportunities(24).length,
              trades: await getRecentTrades(24).length,
              profit: await getTotalProfit(24)
            };

            await bot.editMessageText(
              telegramUI.getStatusMessage(status),
              {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                ...telegramUI.getTradingControlsKeyboard(
                  status.mode === 'live',
                  status.isPaused
                )
              }
            );
            break;

          // Add more cases for other actions...
        }

        // Answer callback query to remove loading state
        await bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error('Error handling callback query:', error);
        await bot.answerCallbackQuery(query.id, {
          text: 'Error processing request',
          show_alert: true
        });
      }
    });

    return bot;
  } catch (error) {
    logger.errorMessage('Error initializing Telegram bot', error);
    return null;
  }
}

// Send message with retry
async function sendMessage(bot, chatId, message, options = {}) {
  if (!bot || !chatId) {
    logger.warningMessage('Cannot send Telegram message: bot or chatId not provided');
    return false;
  }

  // Validate chat ID - it should be a number, not a bot username
  if (typeof chatId === 'string' && chatId.startsWith('@')) {
    logger.warningMessage(`Invalid chat ID format: ${chatId}. This appears to be a username, not a chat ID.`);
    return false;
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...options
    });
    return true;
  } catch (error) {
    logger.error('Error sending Telegram message:', error);

    // Retry with plain text if markdown fails
    if (options.parse_mode === 'Markdown') {
      try {
        await bot.sendMessage(chatId, message, {
          ...options,
          parse_mode: undefined
        });
        logger.info('Sent Telegram message with plain text (markdown failed)');
        return true;
      } catch (retryError) {
        logger.error('Error sending plain text Telegram message:', retryError);
        return false;
      }
    }

    return false;
  }
}

// Format opportunity for Telegram message
function formatOpportunity(opportunity) {
  if (opportunity.type === 'triangular') {
    return `💰 *Triangular Arbitrage Opportunity*\n\n` +
      `*Path:*\n` +
      opportunity.path.map(step =>
        `${step.from} → ${step.to}: ${step.fromAmount} → ${step.toAmount}`
      ).join('\n') + '\n\n' +
      `*Start:* ${opportunity.startAmount}\n` +
      `*End:* ${opportunity.endAmount}\n` +
      `*Profit:* ${opportunity.profitAmount} (${opportunity.profitPercent.toFixed(2)}%)\n` +
      `*Time:* ${new Date(opportunity.timestamp).toLocaleString()}`;
  } else {
    return `💰 *Exchange Arbitrage Opportunity*\n\n` +
      `*Pair:* ${opportunity.pair}\n` +
      `*Input:* ${opportunity.inputAmount}\n` +
      `*Output 1:* ${opportunity.outputAmount1}\n` +
      `*Output 2:* ${opportunity.outputAmount2}\n` +
      `*Profit:* ${opportunity.profitAmount} (${opportunity.profitPercent.toFixed(2)}%)\n` +
      `*Time:* ${new Date(opportunity.timestamp).toLocaleString()}`;
  }
}

// Format trade for Telegram message
function formatTrade(trade) {
  const status = trade.success ? '✅ *Successful*' : '❌ *Failed*';
  const simulation = trade.simulation ? '🔄 *SIMULATION*' : '🔴 *LIVE*';

  let message = `🤖 *Trade ${status}*\n${simulation}\n\n`;

  if (trade.opportunity) {
    if (trade.opportunity.type === 'triangular') {
      message += `*Path:*\n` +
        trade.opportunity.path.map(step =>
          `${step.from} → ${step.to}: ${step.fromAmount} → ${step.toAmount}`
        ).join('\n') + '\n\n';
    } else {
      message += `*Pair:* ${trade.opportunity.pair}\n`;
    }

    message += `*Profit:* ${trade.opportunity.profitAmount} (${trade.opportunity.profitPercent.toFixed(2)}%)\n`;
  }

  if (trade.txId && trade.txId !== 'simulation-tx-id') {
    message += `*Transaction:* [View on Explorer](https://explorer.solana.com/tx/${trade.txId})\n`;
  }

  if (trade.error) {
    message += `*Error:* ${trade.error}\n`;
  }

  message += `*Time:* ${new Date(trade.timestamp).toLocaleString()}`;

  return message;
}

// Send opportunity alert
async function sendOpportunityAlert(bot, chatId, opportunity) {
  if (!settings.notifications.sendOpportunityAlerts) {
    return false;
  }

  // Only send alerts for opportunities that meet the minimum profit threshold
  if (opportunity.profitPercent < settings.notifications.minAlertProfitPercent) {
    logger.info(`Opportunity alert skipped: profit ${opportunity.profitPercent.toFixed(2)}% below threshold ${settings.notifications.minAlertProfitPercent}%`);
    return false;
  }

  const message = formatOpportunity(opportunity);
  return await sendMessage(bot, chatId, message);
}

// Send trade alert
async function sendTradeAlert(bot, chatId, trade) {
  if (!settings.notifications.sendTradeAlerts) {
    return false;
  }

  const message = formatTrade(trade);
  return await sendMessage(bot, chatId, message);
}

// Send daily summary
async function sendDailySummary(bot, chatId) {
  if (!settings.notifications.sendDailySummaries) {
    return false;
  }

  const summary = getPerformanceSummary();
  const message = formatPerformanceSummary(summary);

  return await sendMessage(bot, chatId, message);
}

// Send error alert
async function sendErrorAlert(bot, chatId, errorMessage) {
  if (!settings.notifications.sendErrorAlerts) {
    return false;
  }

  const message = `❌ *Error Alert*\n\n${errorMessage}\n\nTime: ${new Date().toLocaleString()}`;
  return await sendMessage(bot, chatId, message);
}

// Format recent opportunities for Telegram
function formatRecentOpportunities(opportunities) {
  if (!opportunities || opportunities.length === 0) {
    return '📊 *Recent Opportunities*\n\nNo opportunities found.';
  }

  let message = '📊 *Recent Opportunities*\n\n';

  opportunities.forEach((opp, index) => {
    message += `*${index + 1}. ${opp.type === 'triangular' ? 'Triangular' : 'Exchange'} (${opp.profitPercent.toFixed(2)}%)*\n`;

    if (opp.type === 'triangular') {
      message += `Path: ${opp.path.map(p => p.from).join(' → ')} → ${opp.path[opp.path.length - 1].to}\n`;
    } else {
      message += `Pair: ${opp.pair}\n`;
    }

    message += `Profit: ${opp.profitAmount} (${opp.profitPercent.toFixed(2)}%)\n`;
    message += `Time: ${new Date(opp.timestamp).toLocaleString()}\n\n`;
  });

  return message;
}

// Format recent trades for Telegram
function formatRecentTrades(trades) {
  if (!trades || trades.length === 0) {
    return '📊 *Recent Trades*\n\nNo trades found.';
  }

  let message = '📊 *Recent Trades*\n\n';

  trades.forEach((trade, index) => {
    const status = trade.success ? '✅' : '❌';
    const mode = trade.simulation ? 'SIM' : 'LIVE';

    message += `*${index + 1}. ${status} ${mode}*: `;

    if (trade.opportunity) {
      if (trade.opportunity.type === 'triangular') {
        message += `Triangular - ${trade.opportunity.path.map(p => p.from).join(' → ')} → ${trade.opportunity.path[trade.opportunity.path.length - 1].to}\n`;
      } else {
        message += `${trade.opportunity.pair}\n`;
      }

      message += `Profit: ${trade.opportunity.profitAmount} (${trade.opportunity.profitPercent.toFixed(2)}%)\n`;
    } else {
      message += `Unknown\n`;
    }

    message += `Time: ${new Date(trade.timestamp).toLocaleString()}\n\n`;
  });

  return message;
}

// Setup bot commands
function setupCommands(bot) {
  if (!bot) {
    logger.errorMessage('Cannot setup commands: bot not initialized');
    return null;
  }

  const commands = require('./telegramCommands');

  // Basic commands
  bot.onText(/\/start/, msg => commands.start(bot, msg));
  bot.onText(/\/ping/, msg => commands.ping(bot, msg));
  bot.onText(/\/help/, msg => commands.help(bot, msg));

  // Status and settings
  bot.onText(/\/status/, msg => commands.status(bot, msg));
  bot.onText(/\/settings/, msg => commands.settings(bot, msg));

  // Trading controls
  bot.onText(/\/live/, msg => commands.live(bot, msg));
  bot.onText(/\/simulate/, msg => commands.simulate(bot, msg));
  bot.onText(/\/pause/, msg => commands.pause(bot, msg));
  bot.onText(/\/resume/, msg => commands.resume(bot, msg));

  // Risk management
  bot.onText(/\/risk/, msg => commands.risk(bot, msg));
  bot.onText(/\/setrisk (low|medium|high)/, (msg, match) => {
    const riskLevel = match[1].toLowerCase();
    commands.setRisk(bot, msg, riskLevel);
  });

  // Token management
  bot.onText(/\/whitelist/, msg => commands.whitelist(bot, msg));
  bot.onText(/\/blacklist/, msg => commands.blacklist(bot, msg));

  bot.onText(/\/addwhitelist (.+)/, (msg, match) => {
    const token = match[1].trim();
    commands.addToWhitelist(bot, msg, token);
  });

  bot.onText(/\/addblacklist (.+)/, (msg, match) => {
    const token = match[1].trim();
    commands.addToBlacklist(bot, msg, token);
  });

  bot.onText(/\/removewhitelist (.+)/, (msg, match) => {
    const token = match[1].trim();
    commands.removeFromWhitelist(bot, msg, token);
  });

  bot.onText(/\/removeblacklist (.+)/, (msg, match) => {
    const token = match[1].trim();
    commands.removeFromBlacklist(bot, msg, token);
  });

  // Handle errors
  bot.on('polling_error', (error) => {
    logger.error('Telegram polling error:', error);

    if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
      logger.warn('Detected 409 Conflict error, waiting 5 seconds before restarting polling');
      bot.stopPolling();
      
      setTimeout(() => {
        logger.info('Restarting Telegram polling');
        bot.startPolling();
      }, 5000);
    }
  });

  // Set bot commands for menu
  bot.setMyCommands([
    { command: 'start', description: '🚀 Start the bot' },
    { command: 'status', description: '📊 View bot status and controls' },
    { command: 'settings', description: '⚙️ Configure bot settings' },
    { command: 'risk', description: '⚠️ Risk management' },
    { command: 'whitelist', description: '⬜️ Token whitelist' },
    { command: 'blacklist', description: '⬛️ Token blacklist' },
    { command: 'help', description: '❓ Show help message' }
  ]).catch(error => {
    logger.error('Error setting bot commands:', error);
  });

  return bot;
}



/**
 * Format risk settings for display
 * @param {string} userId - User ID
 * @returns {string} - Formatted risk settings message
 */
function formatRiskSettings(userId) {
  const settings = riskManager.getRiskSettingsSummary(userId);

  let message = '⚠️ *Risk Management Settings*\n\n';
  message += `Risk Level: *${settings.riskLevel.toUpperCase()}*\n\n`;
  message += 'Parameters:\n';
  message += `- Max Position Size: *${settings.maxPositionSizePercent}%* of wallet\n`;
  message += `- Stop Loss: *${settings.stopLossPercent}%*\n`;
  message += `- Take Profit: *${settings.takeProfitPercent}%*\n`;
  message += `- Max Slippage: *${settings.maxSlippage}%*\n`;
  message += `- Min Profit Threshold: *${settings.minProfitThreshold}%*\n\n`;

  message += 'Commands:\n';
  message += '- /setrisk [low|medium|high] - Set risk level\n';
  message += '- /setriskparam [name] [value] - Set specific parameter\n';
  message += '  Example: /setriskparam stopLossPercent 1.5\n';
  message += '  Available parameters: maxPositionSizePercent, stopLossPercent, takeProfitPercent, maxSlippage, minProfitThreshold\n';

  return message;
}

module.exports = {
  initBot,
  sendMessage,
  formatOpportunity,
  formatTrade,
  sendOpportunityAlert,
  sendTradeAlert,
  sendDailySummary,
  sendErrorAlert,
  formatRecentOpportunities,
  formatRecentTrades,
  formatRiskSettings,
  setupCommands
};
