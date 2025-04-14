/**
 * Test script for Telegram bot commands
 * Tests the enhanced command handlers for risk management, token lists, and information
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');
const commands = require('../utils/telegramCommands');
const riskManager = require('../utils/riskManager');
const tokenManager = require('../utils/tokenManager');

// Mock data for testing
const mockOpportunities = [
  {
    tokenSymbol: 'SOL/USDC',
    profitPercent: 1.5,
    route: { path: ['Orca', 'Raydium'] },
    timestamp: Date.now()
  },
  {
    tokenSymbol: 'RAY/USDC',
    profitPercent: 0.8,
    route: { path: ['Serum', 'Raydium'] },
    timestamp: Date.now() - 1000 * 60 * 30 // 30 minutes ago
  }
];

const mockTrades = [
  {
    tokenSymbol: 'SOL/USDC',
    profit: 0.5,
    profitPercent: 2.1,
    route: { path: ['Orca', 'Raydium'] },
    timestamp: Date.now()
  },
  {
    tokenSymbol: 'RAY/USDC',
    profit: -0.1,
    profitPercent: -0.4,
    route: { path: ['Serum', 'Raydium'] },
    timestamp: Date.now() - 1000 * 60 * 45 // 45 minutes ago
  }
];

const mockSummary = {
  totalProfit: 0.4,
  totalTrades: 2,
  profitableTrades: 1,
  averageProfitPercent: 0.85,
  bestTradePercent: 2.1,
  totalVolume: 50,
  averageTradeSize: 25,
  totalOpportunities: 10,
  averageOpportunityProfit: 1.2,
  bestOpportunityProfit: 3.5
};

// Mock functions
const mockGetRecentOpportunities = () => Promise.resolve(mockOpportunities);
const mockGetRecentTrades = () => Promise.resolve(mockTrades);
const mockGetPerformanceSummary = () => Promise.resolve(mockSummary);

// Test function
async function testBotCommands() {
  try {
    logger.startupMessage('Testing enhanced Telegram bot commands...');

    // Create a bot instance with the real token
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const userId = process.env.TELEGRAM_CHAT_ID; // Use chat ID as user ID for testing

    // Mock message object
    const mockMsg = {
      chat: { id: chatId },
      from: { id: userId, first_name: 'Test User' }
    };

    logger.info('Testing risk management commands...');

    // Test risk level setting
    await commands.setRisk(bot, mockMsg, 'medium');
    const riskSettings = await riskManager.getRiskSettingsSummary(userId);
    logger.info('Risk settings updated:', riskSettings);

    // Test risk parameter setting
    await commands.setRiskParam(bot, mockMsg, 'maxPositionSize', 5);
    const updatedSettings = await riskManager.getRiskSettingsSummary(userId);
    logger.info('Risk parameter updated:', updatedSettings);

    logger.info('\nTesting token list management...');

    // Test whitelist operations
    const testToken = 'SOL';
    await commands.addToWhitelist(bot, mockMsg, testToken);
    const tokenLists = tokenManager.getUserTokenLists(userId);
    logger.info('Token lists updated:', tokenLists);

    // Test blacklist operations
    await commands.addToBlacklist(bot, mockMsg, 'SCAM');
    const updatedTokenLists = tokenManager.getUserTokenLists(userId);
    logger.info('Token lists after blacklist update:', updatedTokenLists);

    logger.info('\nTesting information commands...');

    // Test opportunities command
    global.getRecentOpportunities = mockGetRecentOpportunities;
    await commands.opportunities(bot, mockMsg);
    logger.info('Opportunities command tested');

    // Test trades command
    global.getRecentTrades = mockGetRecentTrades;
    await commands.trades(bot, mockMsg);
    logger.info('Trades command tested');

    // Test summary command
    global.getPerformanceSummary = mockGetPerformanceSummary;
    await commands.summary(bot, mockMsg);
    logger.info('Summary command tested');

    logger.successMessage('Bot command tests completed successfully');
  } catch (error) {
    logger.errorMessage('Error testing bot commands:', error);
    throw error;
  }
}

// Run the test
testBotCommands().then(() => {
  console.log('All tests completed successfully');
}).catch(error => {
  console.error('Tests failed:', error);
  process.exit(1);
});
