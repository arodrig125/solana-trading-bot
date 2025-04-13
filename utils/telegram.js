const TelegramBot = require('node-telegram-bot-api');
const { getPerformanceSummary, getRecentOpportunities, getRecentTrades, formatPerformanceSummary } = require('./analytics');
const settings = require('../config/settings');
const logger = require('./logger');

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

  // Default to HTML formatting which is more flexible than Markdown
  const parseMode = options.parse_mode || 'HTML';

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: parseMode,
      ...options
    });
    return true;
  } catch (error) {
    logger.error('Error sending Telegram message:', error);

    // Retry with plain text if formatting fails
    if (parseMode) {
      try {
        await bot.sendMessage(chatId, stripFormatting(message), {
          ...options,
          parse_mode: undefined
        });
        logger.info(`Sent Telegram message with plain text (${parseMode} formatting failed)`);
        return true;
      } catch (retryError) {
        logger.error('Error sending plain text Telegram message:', retryError);
        return false;
      }
    }

    return false;
  }
}

// Send a rich message with inline keyboard
async function sendRichMessage(bot, chatId, message, keyboard = null, options = {}) {
  if (!bot || !chatId) {
    logger.warningMessage('Cannot send rich Telegram message: bot or chatId not provided');
    return false;
  }

  try {
    const messageOptions = {
      parse_mode: 'HTML',
      ...options
    };

    // Add inline keyboard if provided
    if (keyboard) {
      messageOptions.reply_markup = {
        inline_keyboard: keyboard
      };
    }

    await bot.sendMessage(chatId, message, messageOptions);
    return true;
  } catch (error) {
    logger.error('Error sending rich Telegram message:', error);

    // Fallback to plain message
    return sendMessage(bot, chatId, stripFormatting(message), options);
  }
}

// Strip formatting from a message
function stripFormatting(message) {
  // Remove HTML tags
  let plainText = message.replace(/<[^>]*>/g, '');

  // Remove Markdown formatting
  plainText = plainText
    .replace(/\*/g, '')
    .replace(/\_/g, '')
    .replace(/\`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  return plainText;
}

// Format opportunity for Telegram message (Markdown)
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
  } else if (opportunity.type === 'exchange') {
    return `💱 *Exchange Arbitrage Opportunity*\n\n` +
      `*Pair:* ${opportunity.pair}\n` +
      `*Input:* ${opportunity.inputAmount}\n` +
      `*Output 1:* ${opportunity.outputAmount1}\n` +
      `*Output 2:* ${opportunity.outputAmount2}\n` +
      `*Profit:* ${opportunity.profitAmount} (${opportunity.profitPercent.toFixed(2)}%)\n` +
      `*Time:* ${new Date(opportunity.timestamp).toLocaleString()}`;
  } else if (opportunity.type === 'dynamic') {
    return `🔄 *Dynamic Arbitrage Opportunity*\n\n` +
      `*Path:* ${opportunity.path.join(' → ')}\n` +
      `*Start:* ${opportunity.startAmount} ${opportunity.startToken}\n` +
      `*End:* ${opportunity.endAmount} ${opportunity.startToken}\n` +
      `*Profit:* ${opportunity.profitAmount} ${opportunity.startToken} (${opportunity.profitPercent.toFixed(2)}%)\n` +
      `*Time:* ${new Date(opportunity.timestamp).toLocaleString()}`;
  }

  return 'Unknown opportunity type';
}

// Format opportunity for Telegram message (HTML)
function formatOpportunityHTML(opportunity) {
  if (opportunity.type === 'triangular') {
    return `<b>💰 Triangular Arbitrage Opportunity</b>\n\n` +
      `<b>Path:</b>\n` +
      opportunity.path.map(step =>
        `${step.from} → ${step.to}: <code>${step.fromAmount}</code> → <code>${step.toAmount}</code>`
      ).join('\n') + '\n\n' +
      `<b>Start:</b> <code>${opportunity.startAmount}</code>\n` +
      `<b>End:</b> <code>${opportunity.endAmount}</code>\n` +
      `<b>Profit:</b> <code>${opportunity.profitAmount}</code> (<b>${opportunity.profitPercent.toFixed(2)}%</b>)\n` +
      `<i>Time: ${new Date(opportunity.timestamp).toLocaleString()}</i>`;
  } else if (opportunity.type === 'exchange') {
    return `<b>💱 Exchange Arbitrage Opportunity</b>\n\n` +
      `<b>Pair:</b> ${opportunity.pair}\n` +
      `<b>Input:</b> <code>${opportunity.inputAmount}</code>\n` +
      `<b>Output 1:</b> <code>${opportunity.outputAmount1}</code>\n` +
      `<b>Output 2:</b> <code>${opportunity.outputAmount2}</code>\n` +
      `<b>Profit:</b> <code>${opportunity.profitAmount}</code> (<b>${opportunity.profitPercent.toFixed(2)}%</b>)\n` +
      `<i>Time: ${new Date(opportunity.timestamp).toLocaleString()}</i>`;
  } else if (opportunity.type === 'dynamic') {
    return `<b>🔄 Dynamic Arbitrage Opportunity</b>\n\n` +
      `<b>Path:</b> ${opportunity.path.join(' → ')}\n` +
      `<b>Start:</b> <code>${opportunity.startAmount}</code> ${opportunity.startToken}\n` +
      `<b>End:</b> <code>${opportunity.endAmount}</code> ${opportunity.startToken}\n` +
      `<b>Profit:</b> <code>${opportunity.profitAmount}</code> ${opportunity.startToken} (<b>${opportunity.profitPercent.toFixed(2)}%</b>)\n` +
      `<i>Time: ${new Date(opportunity.timestamp).toLocaleString()}</i>`;
  }

  return 'Unknown opportunity type';
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

  // Format the message with HTML
  const message = formatOpportunityHTML(opportunity);

  // Create inline keyboard for actions
  const keyboard = [
    [
      { text: '📊 View Details', callback_data: `opportunity_details_${opportunity.id || Date.now()}` },
      { text: '📈 Similar Opportunities', callback_data: `similar_opportunities_${opportunity.type}` }
    ],
    [
      { text: '🔄 Refresh Data', callback_data: 'refresh_data' },
      { text: '⚙️ Settings', callback_data: 'settings' }
    ]
  ];

  return await sendRichMessage(bot, chatId, message, keyboard);
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
    onHelp
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

  // Info commands
  bot.onText(/\/status/, onStatus);
  bot.onText(/\/summary/, onSummary);
  bot.onText(/\/opportunities/, onOpportunities);
  bot.onText(/\/trades/, onTrades);
  bot.onText(/\/settings/, onSettings);
  bot.onText(/\/help/, onHelp);

  // Handle callback queries from inline keyboards
  bot.on('callback_query', async (query) => {
    try {
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const data = query.data;

      logger.info(`Received callback query: ${data}`);

      // Acknowledge the callback query
      await bot.answerCallbackQuery(query.id);

      // Handle different callback types
      if (data === 'refresh_data') {
        // Send a temporary message
        await bot.editMessageText('🔄 Refreshing data...', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });

        // Get fresh data
        const opportunities = getRecentOpportunities(5);

        if (opportunities && opportunities.length > 0) {
          // Format the latest opportunity with HTML
          const message = formatOpportunityHTML(opportunities[0]);

          // Create inline keyboard
          const keyboard = [
            [
              { text: '📊 View Details', callback_data: `opportunity_details_${opportunities[0].id || Date.now()}` },
              { text: '📈 Similar Opportunities', callback_data: `similar_opportunities_${opportunities[0].type}` }
            ],
            [
              { text: '🔄 Refresh Data', callback_data: 'refresh_data' },
              { text: '⚙️ Settings', callback_data: 'settings' }
            ]
          ];

          // Update the message
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          });
        } else {
          await bot.editMessageText('<b>No recent opportunities found</b>\n\nTry again later.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'refresh_data' }]
              ]
            }
          });
        }
      } else if (data === 'settings') {
        // Show settings menu
        const settingsMessage = '<b>⚙️ Bot Settings</b>\n\n' +
          `<b>Mode:</b> ${settings.trading.simulationMode ? 'Simulation' : 'Live'}\n` +
          `<b>Min Profit:</b> ${settings.trading.defaultMinProfitPercent}%\n` +
          `<b>Notifications:</b> ${settings.notifications.sendOpportunityAlerts ? 'Enabled' : 'Disabled'}\n`;

        const settingsKeyboard = [
          [
            { text: '🔄 Simulation Mode', callback_data: 'settings_simulation' },
            { text: '🔴 Live Mode', callback_data: 'settings_live' }
          ],
          [
            { text: '📊 Set Min Profit', callback_data: 'settings_profit' },
            { text: '🔔 Toggle Notifications', callback_data: 'settings_notifications' }
          ],
          [{ text: '« Back', callback_data: 'refresh_data' }]
        ];

        await bot.editMessageText(settingsMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: settingsKeyboard }
        });
      } else if (data.startsWith('opportunity_details_')) {
        // Show opportunity details
        const opportunityId = data.replace('opportunity_details_', '');
        const opportunities = getRecentOpportunities(10);
        const opportunity = opportunities.find(o => (o.id || Date.now().toString()) === opportunityId) || opportunities[0];

        if (opportunity) {
          let detailsMessage = `<b>📊 Opportunity Details</b>\n\n`;

          if (opportunity.type === 'triangular') {
            detailsMessage += `<b>Type:</b> Triangular Arbitrage\n` +
              `<b>Path:</b> ${opportunity.name || opportunity.path.map(p => p.from).join(' → ')}\n` +
              `<b>Profit:</b> <code>${opportunity.profitAmount}</code> (${opportunity.profitPercent.toFixed(2)}%)\n\n` +
              `<b>Steps:</b>\n`;

            opportunity.path.forEach((step, index) => {
              detailsMessage += `${index + 1}. ${step.from} → ${step.to}: <code>${step.fromAmount}</code> → <code>${step.toAmount}</code>\n`;
            });
          } else if (opportunity.type === 'exchange') {
            detailsMessage += `<b>Type:</b> Exchange Arbitrage\n` +
              `<b>Pair:</b> ${opportunity.pair}\n` +
              `<b>Input:</b> <code>${opportunity.inputAmount}</code>\n` +
              `<b>Output 1:</b> <code>${opportunity.outputAmount1}</code>\n` +
              `<b>Output 2:</b> <code>${opportunity.outputAmount2}</code>\n` +
              `<b>Profit:</b> <code>${opportunity.profitAmount}</code> (${opportunity.profitPercent.toFixed(2)}%)\n`;
          } else if (opportunity.type === 'dynamic') {
            detailsMessage += `<b>Type:</b> Dynamic Arbitrage\n` +
              `<b>Path:</b> ${opportunity.path.join(' → ')}\n` +
              `<b>Start:</b> <code>${opportunity.startAmount}</code> ${opportunity.startToken}\n` +
              `<b>End:</b> <code>${opportunity.endAmount}</code> ${opportunity.startToken}\n` +
              `<b>Profit:</b> <code>${opportunity.profitAmount}</code> (${opportunity.profitPercent.toFixed(2)}%)\n`;
          }

          detailsMessage += `\n<i>Time: ${new Date(opportunity.timestamp).toLocaleString()}</i>`;

          const detailsKeyboard = [
            [
              { text: '📈 Similar Opportunities', callback_data: `similar_opportunities_${opportunity.type}` },
              { text: '🔄 Refresh', callback_data: 'refresh_data' }
            ],
            [{ text: '« Back', callback_data: 'refresh_data' }]
          ];

          await bot.editMessageText(detailsMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: detailsKeyboard }
          });
        } else {
          await bot.editMessageText('<b>Opportunity not found</b>', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Back', callback_data: 'refresh_data' }]
              ]
            }
          });
        }
      } else if (data.startsWith('similar_opportunities_')) {
        // Show similar opportunities
        const type = data.replace('similar_opportunities_', '');
        const opportunities = getRecentOpportunities(10).filter(o => o.type === type);

        if (opportunities && opportunities.length > 0) {
          let similarMessage = `<b>📈 Similar ${type.charAt(0).toUpperCase() + type.slice(1)} Opportunities</b>\n\n`;

          opportunities.forEach((opp, index) => {
            if (index < 5) { // Limit to 5 opportunities
              if (type === 'triangular') {
                similarMessage += `${index + 1}. <b>${opp.name || opp.path.map(p => p.from).join(' → ')}</b>\n` +
                  `   Profit: <code>${opp.profitAmount}</code> (${opp.profitPercent.toFixed(2)}%)\n`;
              } else if (type === 'exchange') {
                similarMessage += `${index + 1}. <b>${opp.pair}</b>\n` +
                  `   Profit: <code>${opp.profitAmount}</code> (${opp.profitPercent.toFixed(2)}%)\n`;
              } else if (type === 'dynamic') {
                similarMessage += `${index + 1}. <b>${opp.path.join(' → ')}</b>\n` +
                  `   Profit: <code>${opp.profitAmount}</code> (${opp.profitPercent.toFixed(2)}%)\n`;
              }
            }
          });

          const similarKeyboard = [
            [
              { text: '🔄 Refresh', callback_data: 'refresh_data' },
              { text: '« Back', callback_data: 'refresh_data' }
            ]
          ];

          await bot.editMessageText(similarMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: similarKeyboard }
          });
        } else {
          await bot.editMessageText(`<b>No ${type} opportunities found</b>`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Back', callback_data: 'refresh_data' }]
              ]
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error handling callback query:', error);
      try {
        await bot.answerCallbackQuery(query.id, {
          text: 'Error processing request. Please try again.',
          show_alert: true
        });
      } catch (e) {
        logger.error('Error sending callback answer:', e);
      }
    }
  });

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
    { command: 'help', description: 'Show help message' }
  ]).catch(error => {
    logger.error('Error setting bot commands:', error);
  });

  return bot;
}

module.exports = {
  initBot,
  sendMessage,
  sendRichMessage,
  formatOpportunity,
  formatOpportunityHTML,
  formatTrade,
  sendOpportunityAlert,
  sendTradeAlert,
  sendDailySummary,
  sendErrorAlert,
  formatRecentOpportunities,
  formatRecentTrades,
  setupCommands,
  stripFormatting
};
