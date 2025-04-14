// telegramCommands.js - Command handlers for the Telegram bot
const logger = require('./logger');
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
const commands = {
  // Start command - show welcome message
  async start(bot, msg) {
    const chatId = msg.chat.id;
    const username = msg.from.first_name;

    await bot.sendMessage(
      chatId,
      telegramUI.getWelcomeMessage(username),
      telegramUI.getMainMenuKeyboard()
    );
  },

  // Status command - show current status with controls
  async status(bot, msg) {
    const chatId = msg.chat.id;
    const status = {
      mode: settings.get('tradingMode', 'simulation'),
      isPaused: settings.get('isPaused', false),
      uptime: getUptime(),
      opportunities: (await getRecentOpportunities(24)).length,
      trades: (await getRecentTrades(24)).length,
      profit: await getTotalProfit(24)
    };

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
  },

  // Settings command - show settings menu
  async settings(bot, msg) {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      '*Settings* ⚙️\n\nSelect a category to configure:',
      {
        parse_mode: 'Markdown',
        ...telegramUI.getSettingsKeyboard()
      }
    );
  },

  // Risk command - show risk management menu
  async risk(bot, msg) {
    const chatId = msg.chat.id;
    const currentRisk = riskManager.getRiskLevel(msg.from.id);
    
    await bot.sendMessage(
      chatId,
      '*Risk Management* ⚠️\n\nSelect your preferred risk level:',
      {
        parse_mode: 'Markdown',
        ...telegramUI.getRiskManagementKeyboard(currentRisk)
      }
    );
  },

  // Risk parameter commands
  async setRisk(bot, msg, riskLevel) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await riskManager.setRiskLevel(userId, riskLevel);
      const settings = riskManager.getRiskSettingsSummary(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Risk level set to *${riskLevel.toUpperCase()}*\n\n` +
        'Updated parameters:\n' +
        `- Max Position Size: *${settings.maxPositionSizePercent}%*\n` +
        `- Stop Loss: *${settings.stopLossPercent}%*\n` +
        `- Take Profit: *${settings.takeProfitPercent}%*\n` +
        `- Max Slippage: *${settings.maxSlippage}%*\n` +
        `- Min Profit Threshold: *${settings.minProfitThreshold}%*`,
        {
          parse_mode: 'Markdown',
          ...telegramUI.getRiskManagementKeyboard(riskLevel)
        }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error setting risk level. Please try again.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  async setRiskParam(bot, msg, paramName, paramValue) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await riskManager.setRiskParameter(userId, paramName, paramValue);
      const settings = riskManager.getRiskSettingsSummary(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Risk parameter *${paramName}* set to *${paramValue}*\n\n` +
        'Current settings:\n' +
        `- Max Position Size: *${settings.maxPositionSizePercent}%*\n` +
        `- Stop Loss: *${settings.stopLossPercent}%*\n` +
        `- Take Profit: *${settings.takeProfitPercent}%*\n` +
        `- Max Slippage: *${settings.maxSlippage}%*\n` +
        `- Min Profit Threshold: *${settings.minProfitThreshold}%*`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error setting risk parameter. Please check the parameter name and value.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  // Token management commands
  async whitelist(bot, msg) {
    const chatId = msg.chat.id;
    const tokens = tokenManager.getWhitelist(msg.from.id);
    
    await bot.sendMessage(
      chatId,
      '*Whitelisted Tokens* ⬜️\n\nTokens in your whitelist:',
      {
        parse_mode: 'Markdown',
        ...telegramUI.getTokenListKeyboard(tokens, 'whitelist')
      }
    );
  },

  async addToWhitelist(bot, msg, token) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.addToWhitelist(userId, token);
      const tokens = tokenManager.getWhitelist(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Added *${token}* to whitelist\n\nCurrent whitelist:`,
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'whitelist')
        }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error adding token to whitelist. Please check the token address.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  async removeFromWhitelist(bot, msg, token) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.removeFromWhitelist(userId, token);
      const tokens = tokenManager.getWhitelist(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Removed *${token}* from whitelist\n\nCurrent whitelist:`,
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'whitelist')
        }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error removing token from whitelist.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  // Blacklist commands
  async blacklist(bot, msg) {
    const chatId = msg.chat.id;
    const tokens = tokenManager.getBlacklist(msg.from.id);
    
    await bot.sendMessage(
      chatId,
      '*Blacklisted Tokens* ⬛️\n\nTokens in your blacklist:',
      {
        parse_mode: 'Markdown',
        ...telegramUI.getTokenListKeyboard(tokens, 'blacklist')
      }
    );
  },

  async addToBlacklist(bot, msg, token) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.addToBlacklist(userId, token);
      const tokens = tokenManager.getBlacklist(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Added *${token}* to blacklist\n\nCurrent blacklist:`,
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'blacklist')
        }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error adding token to blacklist. Please check the token address.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  async removeFromBlacklist(bot, msg, token) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await tokenManager.removeFromBlacklist(userId, token);
      const tokens = tokenManager.getBlacklist(userId);
      
      await bot.sendMessage(
        chatId,
        `✅ Removed *${token}* from blacklist\n\nCurrent blacklist:`,
        {
          parse_mode: 'Markdown',
          ...telegramUI.getTokenListKeyboard(tokens, 'blacklist')
        }
      );
    } catch (error) {
      await bot.sendMessage(
        chatId,
        '❌ Error removing token from blacklist.',
        { parse_mode: 'Markdown' }
      );
    }
  },

  // Trading mode commands
  async live(bot, msg) {
    const chatId = msg.chat.id;
    settings.set('tradingMode', 'live');
    await bot.sendMessage(chatId, '🔴 Switched to *LIVE* trading mode', {
      parse_mode: 'Markdown',
      ...telegramUI.getTradingControlsKeyboard(true, settings.get('isPaused', false))
    });
  },

  async simulate(bot, msg) {
    const chatId = msg.chat.id;
    settings.set('tradingMode', 'simulation');
    await bot.sendMessage(chatId, '⚪️ Switched to *SIMULATION* mode', {
      parse_mode: 'Markdown',
      ...telegramUI.getTradingControlsKeyboard(false, settings.get('isPaused', false))
    });
  },

  async pause(bot, msg) {
    const chatId = msg.chat.id;
    settings.set('isPaused', true);
    await bot.sendMessage(chatId, '⏸️ Bot is now *PAUSED*', {
      parse_mode: 'Markdown',
      ...telegramUI.getTradingControlsKeyboard(
        settings.get('tradingMode', 'simulation') === 'live',
        true
      )
    });
  },

  async resume(bot, msg) {
    const chatId = msg.chat.id;
    settings.set('isPaused', false);
    await bot.sendMessage(chatId, '▶️ Bot has *RESUMED* operation', {
      parse_mode: 'Markdown',
      ...telegramUI.getTradingControlsKeyboard(
        settings.get('tradingMode', 'simulation') === 'live',
        false
      )
    });
  },

  // Information commands
  async opportunities(bot, msg) {
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
      
      await bot.sendMessage(
        chatId,
        formatRecentOpportunities(opportunities),
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error getting opportunities:', error);
      await bot.sendMessage(chatId, '❌ Error retrieving recent opportunities');
    }
  },

  async trades(bot, msg) {
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
      
      await bot.sendMessage(
        chatId,
        formatRecentTrades(trades),
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error getting trades:', error);
      await bot.sendMessage(chatId, '❌ Error retrieving recent trades');
    }
  },

  async summary(bot, msg) {
    const chatId = msg.chat.id;
    const summary = await getPerformanceSummary();
    
    await bot.sendMessage(
      chatId,
      formatPerformanceSummary(summary),
      { parse_mode: 'Markdown' }
    );
  },

  // Simple commands
  async ping(bot, msg) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '🟢 Bot is running!');
  },

  async help(bot, msg) {
    const chatId = msg.chat.id;
    const helpMessage = 
      '*SolarBot Help* ❓\n\n' +
      'Here are the main commands you can use:\n\n' +
      '🔹 *Basic Commands*\n' +
      '/start - Show main menu\n' +
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
      '/opportunities - View recent opportunities\n' +
      '/trades - View recent trades\n' +
      '/summary - View performance summary\n\n' +
      'Use the menu below for easy access to commands:';

    await bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      ...telegramUI.getMainMenuKeyboard()
    });
  }
};

module.exports = commands;
