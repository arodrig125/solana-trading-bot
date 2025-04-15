// telegramCommands.js - Command handlers for the Telegram bot
const logger = require('./logger');
const { isValidTelegramMsg } = require('./telegramValidation');
const { sendError, sendSuccess } = require('./telegramResponses');
const { isAdmin } = require('./telegramAuth');

// --- Global Telegram Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_COMMANDS = 5;
// userId -> [timestamp, ...]
const userCommandTimestamps = new Map();

async function checkRateLimit(msg) {
  const userId = msg.from.id;
  if (await isAdmin(msg.from)) return false; // No limit for admins
  const now = Date.now();
  let timestamps = userCommandTimestamps.get(userId) || [];
  // Remove timestamps older than window
  timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_COMMANDS) {
    userCommandTimestamps.set(userId, timestamps); // update
    return true; // Rate limit exceeded
  }
  timestamps.push(now);
  userCommandTimestamps.set(userId, timestamps);
  return false;
}

const settings = require('../config/settings');
const riskManager = require('./riskManager');
const tokenManager = require('./tokenManager');
const telegramUI = require('./telegramUI');
const { getRecentOpportunities, getRecentTrades, getPerformanceSummary } = require('./analytics');

// Get bot uptime in human readable format
function getUptime() {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  let uptimeStr = '';
  if (days > 0) uptimeStr += `${days}d `;
  if (hours > 0) uptimeStr += `${hours}h `;
  uptimeStr += `${minutes}m`;
  
  return uptimeStr;
}

const {
  formatRecentOpportunities,
  formatRecentTrades,
  formatPerformanceSummary
} = require('./telegramFormatters');

// Command handlers
// Helper to wrap all command handlers with rate limiting
function withRateLimit(handler) {
  return async function(bot, msg, ...args) {
    if (await checkRateLimit(msg)) {
      await sendError(bot, msg.chat.id, '⏳ You are sending commands too quickly. Please wait a minute and try again.');
      return;
    }
    return handler.call(this, bot, msg, ...args);
  };
}

const commands = {
  // Start command - show welcome message
  async start(bot, msg) {
    if (!isValidTelegramMsg(msg, 'start')) return;
    const chatId = msg.chat.id;
    const username = msg.from.first_name;

    try {
      await bot.sendMessage(
        chatId,
        telegramUI.getWelcomeMessage(username),
        telegramUI.getMainMenuKeyboard()
      );
      // Optionally use sendSuccess for a custom message
      // await sendSuccess(bot, chatId, 'Welcome!');
    } catch (error) {
      await sendError(bot, chatId, 'Failed to send welcome message.', error);
    }
  },

  // Status command - show current status with controls
  async status(bot, msg) {
    if (!isValidTelegramMsg(msg, 'status')) return;
    const chatId = msg.chat.id;
    const status = {
      mode: settings.get('tradingMode', 'simulation'),
      isPaused: settings.get('isPaused', false),
      uptime: getUptime(),
      opportunities: (await getRecentOpportunities(24)).length,
      trades: (await getRecentTrades(24)).length,
      profit: await getTotalProfit(24)
    };

    try {
      await bot.sendMessage(
        chatId,
        telegramUI.getStatusMessage(status),
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTradingControlsKeyboard(
            status.mode === 'live',
            status.isPaused
          )
        }
      );
    } catch (error) {
      await sendError(bot, chatId, 'Failed to send status message.', error);
    }
  },

  // Settings command - show settings menu
  async settings(bot, msg) {
    if (!isValidTelegramMsg(msg, 'settings')) return;
    const chatId = msg.chat.id;
    if (!(await isAdmin(msg.from))) {
      await sendError(bot, chatId, 'You do not have permission to access settings.');
      return;
    }
    try {
      await bot.sendMessage(
        chatId,
        '*Settings* ⚙️\n\nSelect a category to configure:',
        {
          parse_mode: 'Markdown',
          ...telegramUI.getSettingsKeyboard()
        }
      );
    } catch (error) {
      await sendError(bot, chatId, 'Failed to show settings menu.', error);
    }
  },

  // Risk command - show risk management menu
  async risk(bot, msg) {
    if (!isValidTelegramMsg(msg, 'risk') || !msg.from.id) return;
    const chatId = msg.chat.id;
    const currentRisk = riskManager.getRiskLevel(msg.from.id);
    
    if (!(await isAdmin(msg.from))) {
      await sendError(bot, chatId, 'You do not have permission to access risk management.');
      return;
    }
    try {
      await bot.sendMessage(
        chatId,
        '*Risk Management* ⚠️\n\nSelect your preferred risk level:',
        {
          parse_mode: 'Markdown',
          ...telegramUI.getRiskManagementKeyboard(currentRisk)
        }
      );
    } catch (error) {
      await sendError(bot, chatId, 'Failed to show risk management menu.', error);
    }
  },

  // Risk parameter commands
  async setRisk(bot, msg, riskLevel) {
    if (!isValidTelegramMsg(msg, 'setRisk') || !msg.from.id) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await riskManager.setRiskLevel(userId, riskLevel);
      const settings = riskManager.getRiskSettingsSummary(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Risk level set to *${riskLevel.toUpperCase()}*\n\n` +
        'Updated parameters:\n' +
        `- Max Position Size: *${settings.maxPositionSizePercent}%*\n` +
        `- Stop Loss: *${settings.stopLossPercent}%*\n` +
        `- Take Profit: *${settings.takeProfitPercent}%*\n` +
        `- Max Slippage: *${settings.maxSlippage}%*\n` +
        `- Min Profit Threshold: *${settings.minProfitThreshold}%*`
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error setting risk level. Please try again.', error);
    }
  },

  async setRiskParam(bot, msg, paramName, paramValue) {
    if (!isValidTelegramMsg(msg, 'setRiskParam') || !msg.from.id) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await riskManager.setRiskParameter(userId, paramName, paramValue);
      const settings = riskManager.getRiskSettingsSummary(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Risk parameter *${paramName}* set to *${paramValue}*\n\n` +
        'Current settings:\n' +
        `- Max Position Size: *${settings.maxPositionSizePercent}%*\n` +
        `- Stop Loss: *${settings.stopLossPercent}%*\n` +
        `- Take Profit: *${settings.takeProfitPercent}%*\n` +
        `- Max Slippage: *${settings.maxSlippage}%*\n` +
        `- Min Profit Threshold: *${settings.minProfitThreshold}%*`
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error setting risk parameter. Please check the parameter name and value.', error);
    }
  },

  // Token management commands
  async whitelist(bot, msg) {
    if (!isValidTelegramMsg(msg, 'whitelist')) return;
    const chatId = msg.chat.id;
    const tokens = tokenManager.getWhitelist(msg.from.id);
    
    try {
      await bot.sendMessage(
        chatId,
        '*Whitelisted Tokens* ⬜️\n\nTokens in your whitelist:',
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'whitelist')
        }
      );
    } catch (error) {
      await sendError(bot, chatId, 'Failed to show whitelist.', error);
    }
  },

  async addToWhitelist(bot, msg, token) {
    if (!isValidTelegramMsg(msg, 'addToWhitelist')) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.addToWhitelist(userId, token);
      const tokens = tokenManager.getWhitelist(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Added *${token}* to whitelist\n\nCurrent whitelist:`
      );
      await bot.sendMessage(
        chatId,
        tokens.join(', ') || 'No tokens in whitelist.'
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error adding token to whitelist. Please check the token address.', error);
    }
  },

  async removeFromWhitelist(bot, msg, token) {
    if (!isValidTelegramMsg(msg, 'removeFromWhitelist')) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.removeFromWhitelist(userId, token);
      const tokens = tokenManager.getWhitelist(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Removed *${token}* from whitelist\n\nCurrent whitelist:`
      );
      await bot.sendMessage(
        chatId,
        tokens.join(', ') || 'No tokens in whitelist.'
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error removing token from whitelist.', error);
    }
  },

  // Blacklist commands
  async blacklist(bot, msg) {
    if (!isValidTelegramMsg(msg, 'blacklist')) return;
    const chatId = msg.chat.id;
    const tokens = tokenManager.getBlacklist(msg.from.id);
    
    try {
      await bot.sendMessage(
        chatId,
        '*Blacklisted Tokens* ⬛️\n\nTokens in your blacklist:',
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'blacklist')
        }
      );
    } catch (error) {
      await sendError(bot, chatId, 'Failed to show blacklist.', error);
    }
  },

  async addToBlacklist(bot, msg, token) {
    if (!isValidTelegramMsg(msg, 'addToBlacklist')) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.addToBlacklist(userId, token);
      const tokens = tokenManager.getBlacklist(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Added *${token}* to blacklist\n\nCurrent blacklist:`
      );
      await bot.sendMessage(
        chatId,
        tokens.join(', ') || 'No tokens in blacklist.'
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error adding token to blacklist. Please check the token address.', error);
    }
  },

  async removeFromBlacklist(bot, msg, token) {
    if (!isValidTelegramMsg(msg, 'removeFromBlacklist')) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.removeFromBlacklist(userId, token);
      const tokens = tokenManager.getBlacklist(userId);
      
      await sendSuccess(
        bot,
        chatId,
        `Removed *${token}* from blacklist\n\nCurrent blacklist:`
      );
      await bot.sendMessage(
        chatId,
        tokens.join(', ') || 'No tokens in blacklist.'
      );
    } catch (error) {
      await sendError(bot, chatId, 'Error removing token from blacklist.', error);
    }
  },

  // Trading mode commands
  async live(bot, msg) {
    if (!isValidTelegramMsg(msg, 'live')) return;
    const chatId = msg.chat.id;
    settings.set('tradingMode', 'live');
    if (!(await isAdmin(msg.from))) {
      await sendError(bot, chatId, 'You do not have permission to enable live trading.');
      return;
    }
    try {
      await sendSuccess(bot, chatId, 'Switched to *LIVE* trading mode');
    } catch (error) {
      await sendError(bot, chatId, 'Error switching to live trading mode.', error);
    }
  },

  async simulate(bot, msg) {
    if (!isValidTelegramMsg(msg, 'simulate')) return;
    const chatId = msg.chat.id;
    settings.set('tradingMode', 'simulation');
    try {
      await sendSuccess(bot, chatId, 'Switched to *SIMULATION* mode');
    } catch (error) {
      await sendError(bot, chatId, 'Error switching to simulation mode.', error);
    }
  },

  async pause(bot, msg) {
    if (!isValidTelegramMsg(msg, 'pause')) return;
    const chatId = msg.chat.id;
    settings.set('isPaused', true);
    if (!(await isAdmin(msg.from))) {
      await sendError(bot, chatId, 'You do not have permission to pause the bot.');
      return;
    }
    try {
      await sendSuccess(bot, chatId, 'Bot is now *PAUSED*');
    } catch (error) {
      await sendError(bot, chatId, 'Error pausing the bot.', error);
    }
  },

  async resume(bot, msg) {
    if (!isValidTelegramMsg(msg, 'resume')) return;
    const chatId = msg.chat.id;
    settings.set('isPaused', false);
    if (!(await isAdmin(msg.from))) {
      await sendError(bot, chatId, 'You do not have permission to resume the bot.');
      return;
    }
    try {
      await sendSuccess(bot, chatId, 'Bot has *RESUMED* operation');
    } catch (error) {
      await sendError(bot, chatId, 'Error resuming the bot.', error);
    }
  },

  // Information commands
  async opportunities(bot, msg) {
    if (!isValidTelegramMsg(msg, 'opportunities')) return;
    const chatId = msg.chat.id;
    try {
      // For testing, create mock opportunities if getRecentOpportunities is not available
      const opportunities = await getRecentOpportunities(24) || [
        {
          tokenSymbol: 'SOL/USDC',
          profitPercent: 1.5,
          route: { path: ['Orca', 'Raydium'] },
          timestamp: Date.now()
        }
      ];
      
      await sendSuccess(bot, chatId, formatRecentOpportunities(opportunities));
    } catch (error) {
      logger.error('Error getting opportunities:', error);
      await sendError(bot, chatId, 'Error retrieving recent opportunities.', error);
    }
  },

  async trades(bot, msg) {
    if (!isValidTelegramMsg(msg, 'trades')) return;
    const chatId = msg.chat.id;
    try {
      // For testing, create mock trades if getRecentTrades is not available
      const trades = await getRecentTrades(24) || [
        {
          tokenSymbol: 'SOL/USDC',
          profit: 0.5,
          profitPercent: 2.1,
          route: { path: ['Orca', 'Raydium'] },
          timestamp: Date.now()
        }
      ];
      
      await sendSuccess(bot, chatId, formatRecentTrades(trades));
    } catch (error) {
      logger.error('Error getting trades:', error);
      await sendError(bot, chatId, 'Error retrieving recent trades.', error);
    }
  },

  async summary(bot, msg) {
    if (!isValidTelegramMsg(msg, 'summary')) return;
    const chatId = msg.chat.id;
    const summary = await getPerformanceSummary();
    
    try {
      await sendSuccess(bot, chatId, formatPerformanceSummary(summary));
    } catch (error) {
      await sendError(bot, chatId, 'Error showing performance summary.', error);
    }
  },

  // Simple commands
  async ping(bot, msg) {
    if (!isValidTelegramMsg(msg, 'ping')) return;
    const chatId = msg.chat.id;
    try {
      await sendSuccess(bot, chatId, 'Bot is running!');
    } catch (error) {
      await sendError(bot, chatId, 'Error responding to ping.', error);
    }
  },

  async help(bot, msg) {
    if (!isValidTelegramMsg(msg, 'help')) return;
    const chatId = msg.chat.id;
    // Determine user role (basic example)
    let role = 'User';
    if (await isAdmin(msg.from)) role = 'Admin';
    // Add future: check for premium, etc.

    const tips = [
      '💡 *Tip:* Use /portfolio to check your balances!',
      '💡 *Tip:* Use buttons below for quick actions.',
      '💡 *Tip:* Upgrade your tier for more features.'
    ];

    const helpMessage =
      `*SolarBot Help* ❓\n\n` +
      `👤 *Role:* ${role}\n\n` +
      'Here are the main commands you can use:\n\n' +
      '🔹 *Basic Commands*\n' +
      '/start - Show main menu\n' +
      '/help - Show this help message\n' +
      '/status - View bot status\n' +
      '/settings - Configure settings\n\n' +
      '🔹 *Trading Controls*\n' +
      '/live - Enable live trading\n' +
      '/simulate - Enable simulation mode\n' +
      '/pause - Pause the bot\n' +
      '/resume - Resume operation\n\n' +
      '🔹 *Risk Management*\n' +
      '/risk - View/change risk settings\n' +
      '/whitelist - Manage token whitelist\n' +
      '/blacklist - Manage token blacklist\n\n' +
      '🔹 *Information*\n' +
      '/portfolio - Show your balances\n' +
      '/pnl - Show your PnL\n' +
      '/stats - Show your usage stats\n' +
      '/opportunities - View recent opportunities\n' +
      '/trades - View recent trades\n' +
      '/summary - View performance summary\n\n' +
      `${tips[Math.floor(Math.random()*tips.length)]}\n\n` +
      'Use the menu below for easy access to commands:';

    // Inline keyboard for quick actions
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Portfolio', callback_data: 'portfolio' },
            { text: '💰 PnL', callback_data: 'pnl' }
          ],
          [
            { text: '📈 Stats', callback_data: 'stats' },
            { text: '🔄 Opportunities', callback_data: 'opportunities' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    };

    try {
      await bot.sendMessage(chatId, helpMessage, keyboard);
    } catch (error) {
      await sendError(bot, chatId, 'Error showing help message.', error);
    }
  },

  // --- Placeholders for new commands ---
  async portfolio(bot, msg) {
    if (!isValidTelegramMsg(msg, 'portfolio')) return;
    const chatId = msg.chat.id;
    // Placeholder: In the future, fetch real balances
    await sendSuccess(bot, chatId, '📊 *Portfolio*\n\nYour balances and recent trades will appear here soon!');
  },
  async pnl(bot, msg) {
    if (!isValidTelegramMsg(msg, 'pnl')) return;
    const chatId = msg.chat.id;
    // Placeholder: In the future, fetch real PnL
    await sendSuccess(bot, chatId, '💰 *PnL*\n\nYour profit & loss summary will appear here soon!');
  },
  async stats(bot, msg) {
    if (!isValidTelegramMsg(msg, 'stats')) return;
    const chatId = msg.chat.id;
    // Placeholder: In the future, fetch real stats
    await sendSuccess(bot, chatId, '📈 *Stats*\n\nYour API usage, tier, and limits will appear here soon!');
  }
};

// Wrap all commands with rate limiting
for (const key of Object.keys(commands)) {
  if (typeof commands[key] === 'function') {
    commands[key] = withRateLimit(commands[key]);
  }
}

module.exports = commands;
