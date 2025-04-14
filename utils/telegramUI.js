// telegramUI.js - Enhanced Telegram UI components
const { InlineKeyboard } = require('node-telegram-bot-api');

// Main menu keyboard
const getMainMenuKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '📈 Summary', callback_data: 'summary' }
        ],
        [
          { text: '💰 Opportunities', callback_data: 'opportunities' },
          { text: '📜 Recent Trades', callback_data: 'trades' }
        ],
        [
          { text: '⚙️ Settings', callback_data: 'settings' },
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    }
  };
};

// Trading controls keyboard
const getTradingControlsKeyboard = (isLive, isPaused) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { 
            text: isLive ? '🔴 Live Mode' : '⚪️ Simulation Mode', 
            callback_data: isLive ? 'simulate' : 'live' 
          }
        ],
        [
          { 
            text: isPaused ? '▶️ Resume' : '⏸️ Pause', 
            callback_data: isPaused ? 'resume' : 'pause' 
          }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'menu' }
        ]
      ]
    }
  };
};

// Risk management keyboard
const getRiskManagementKeyboard = (currentRisk) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { 
            text: currentRisk === 'low' ? '✅ Low' : 'Low', 
            callback_data: 'risk_low' 
          },
          { 
            text: currentRisk === 'medium' ? '✅ Medium' : 'Medium', 
            callback_data: 'risk_medium' 
          },
          { 
            text: currentRisk === 'high' ? '✅ High' : 'High', 
            callback_data: 'risk_high' 
          }
        ],
        [
          { text: '📋 View Risk Settings', callback_data: 'view_risk' }
        ],
        [
          { text: '🔙 Back to Settings', callback_data: 'settings' }
        ]
      ]
    }
  };
};

// Settings keyboard
const getSettingsKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⚠️ Risk Management', callback_data: 'risk' },
          { text: '🔑 API Keys', callback_data: 'keys' }
        ],
        [
          { text: '⬜️ Whitelist', callback_data: 'whitelist' },
          { text: '⬛️ Blacklist', callback_data: 'blacklist' }
        ],
        [
          { text: '📱 Notifications', callback_data: 'notifications' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'menu' }
        ]
      ]
    }
  };
};

// Token list keyboard (for whitelist/blacklist)
const getTokenListKeyboard = (tokens, type) => {
  const keyboard = [];
  
  // Add tokens in rows of 2
  for (let i = 0; i < tokens.length; i += 2) {
    const row = [];
    row.push({ 
      text: `❌ ${tokens[i]}`, 
      callback_data: `remove_${type}_${tokens[i]}` 
    });
    
    if (tokens[i + 1]) {
      row.push({ 
        text: `❌ ${tokens[i + 1]}`, 
        callback_data: `remove_${type}_${tokens[i + 1]}` 
      });
    }
    keyboard.push(row);
  }
  
  // Add control buttons
  keyboard.push([
    { text: '➕ Add Token', callback_data: `add_${type}` }
  ]);
  keyboard.push([
    { text: '🔙 Back to Settings', callback_data: 'settings' }
  ]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
};

// Format welcome message
const getWelcomeMessage = (username) => {
  return `Welcome ${username} to SolarBot! 🚀\n\n` +
    `I'm your Solana trading assistant. Here's what I can do:\n\n` +
    `📊 Monitor arbitrage opportunities\n` +
    `💰 Execute trades automatically\n` +
    `⚠️ Manage risk settings\n` +
    `📈 Track performance\n\n` +
    `Use the menu below to get started:`;
};

// Format status message
const getStatusMessage = (status) => {
  const {
    mode,
    isPaused,
    uptime,
    opportunities,
    trades,
    profit
  } = status;

  return `*Current Status* 🤖\n\n` +
    `*Mode:* ${mode === 'live' ? '🔴 Live' : '⚪️ Simulation'}\n` +
    `*State:* ${isPaused ? '⏸️ Paused' : '▶️ Running'}\n` +
    `*Uptime:* ${uptime}\n\n` +
    `*Today's Stats:*\n` +
    `• Opportunities Found: ${opportunities}\n` +
    `• Trades Executed: ${trades}\n` +
    `• Total Profit: ${profit} SOL\n\n` +
    `Use the controls below to manage the bot:`;
};

module.exports = {
  getMainMenuKeyboard,
  getTradingControlsKeyboard,
  getRiskManagementKeyboard,
  getSettingsKeyboard,
  getTokenListKeyboard,
  getWelcomeMessage,
  getStatusMessage
};
