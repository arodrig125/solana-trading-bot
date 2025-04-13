const TelegramBot = require('node-telegram-bot-api');
const { getPerformanceSummary, getRecentOpportunities, getRecentTrades, formatPerformanceSummary } = require('./analytics');
const settings = require('../config/settings');
const logger = require('./logger');
const riskManager = require('./riskManager');
const tokenManager = require('./tokenManager');

// Initialize Telegram bot
function initBot(token) {
  if (!token) {
    logger.errorMessage('No Telegram bot token provided');
    return null;
  }

  try {
    // Add polling options to handle conflicts
    return new TelegramBot(token, {
      polling: true,
      // Add these options to handle the 409 Conflict error
      polling_options: {
        timeout: 10,
        limit: 100
      },
      // Add a small random delay to avoid conflicts
      onlyFirstMatch: true
    });
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
function setupCommands(bot, callbacks) {
  if (!bot) {
    logger.errorMessage('Cannot setup commands: bot not initialized');
    return null;
  }

  const {
    onStart,
    onPing,
    onChatId,
    onLive,
    onSimulate,
    onPause,
    onResume,
    onSetProfit,
    onStatus,
    onSummary,
    onOpportunities,
    onTrades,
    onSettings,
    onHelp,
    onSetRiskLevel,
    onSetRiskParam,
    onRiskSettings,
    onWhitelist,
    onBlacklist,
    onAddToWhitelist,
    onRemoveFromWhitelist,
    onAddToBlacklist,
    onRemoveFromBlacklist,
    onSetUseWhitelist,
    onSetUseBlacklist,
    onTokenRisk
  } = callbacks;

  // Basic commands
  bot.onText(/\/start/, onStart);
  bot.onText(/\/ping/, onPing);
  bot.onText(/\/chatid/, onChatId);

  // Mode commands
  bot.onText(/\/live/, onLive);
  bot.onText(/\/simulate/, onSimulate);

  // Control commands
  bot.onText(/\/pause/, onPause);
  bot.onText(/\/resume/, onResume);

  // Settings commands
  bot.onText(/\/setprofit (.+)/, (msg, match) => {
    const profit = parseFloat(match[1]);
    if (isNaN(profit)) {
      sendMessage(bot, msg.chat.id, '❌ Invalid profit percentage. Please provide a number.');
      return;
    }
    onSetProfit(msg, profit);
  });

  // Risk management commands
  bot.onText(/\/setrisk (low|medium|high)/, (msg, match) => {
    const riskLevel = match[1].toLowerCase();
    onSetRiskLevel(msg, riskLevel);
  });

  bot.onText(/\/setriskparam (\w+) (.+)/, (msg, match) => {
    const paramName = match[1];
    const paramValue = parseFloat(match[2]);

    if (isNaN(paramValue)) {
      sendMessage(bot, msg.chat.id, '❌ Invalid parameter value. Please provide a number.');
      return;
    }

    onSetRiskParam(msg, paramName, paramValue);
  });

  bot.onText(/\/risk/, onRiskSettings);

  // Token list management commands
  bot.onText(/\/whitelist/, onWhitelist);
  bot.onText(/\/blacklist/, onBlacklist);

  bot.onText(/\/addwhitelist (.+)/, (msg, match) => {
    const token = match[1].trim();
    onAddToWhitelist(msg, token);
  });

  bot.onText(/\/removewhitelist (.+)/, (msg, match) => {
    const token = match[1].trim();
    onRemoveFromWhitelist(msg, token);
  });

  bot.onText(/\/addblacklist (.+)/, (msg, match) => {
    const token = match[1].trim();
    onAddToBlacklist(msg, token);
  });

  bot.onText(/\/removeblacklist (.+)/, (msg, match) => {
    const token = match[1].trim();
    onRemoveFromBlacklist(msg, token);
  });

  bot.onText(/\/usewhitelist (on|off)/, (msg, match) => {
    const useWhitelist = match[1].toLowerCase() === 'on';
    onSetUseWhitelist(msg, useWhitelist);
  });

  bot.onText(/\/useblacklist (on|off)/, (msg, match) => {
    const useBlacklist = match[1].toLowerCase() === 'on';
    onSetUseBlacklist(msg, useBlacklist);
  });

  bot.onText(/\/tokenrisk (.+)/, (msg, match) => {
    const token = match[1].trim();
    onTokenRisk(msg, token);
  });

  // Info commands
  bot.onText(/\/status/, onStatus);
  bot.onText(/\/summary/, onSummary);
  bot.onText(/\/opportunities/, onOpportunities);
  bot.onText(/\/trades/, onTrades);
  bot.onText(/\/settings/, onSettings);
  bot.onText(/\/help/, onHelp);

  // Handle errors
  bot.on('polling_error', (error) => {
    logger.error('Telegram polling error:', error);

    // If we get a 409 Conflict error, wait a bit and restart polling
    if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
      logger.warn('Detected 409 Conflict error, waiting 5 seconds before restarting polling');

      // Stop polling
      bot.stopPolling();

      // Wait 5 seconds and restart polling
      setTimeout(() => {
        logger.info('Restarting Telegram polling');
        bot.startPolling();
      }, 5000);
    }
  });

  // Set bot commands for menu
  bot.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'ping', description: 'Check if the bot is running' },
    { command: 'live', description: 'Enable live trading mode' },
    { command: 'simulate', description: 'Enable simulation mode' },
    { command: 'pause', description: 'Pause background scanning' },
    { command: 'resume', description: 'Resume background scanning' },
    { command: 'status', description: 'Get current bot status' },
    { command: 'summary', description: 'Get performance summary' },
    { command: 'risk', description: 'View risk management settings' },
    { command: 'setrisk', description: 'Set risk level (low/medium/high)' },
    { command: 'whitelist', description: 'View your token whitelist' },
    { command: 'blacklist', description: 'View your token blacklist' },
    { command: 'addwhitelist', description: 'Add token to whitelist' },
    { command: 'addblacklist', description: 'Add token to blacklist' },
    { command: 'tokenrisk', description: 'Check risk assessment for a token' },
    { command: 'help', description: 'Show help message' }
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
