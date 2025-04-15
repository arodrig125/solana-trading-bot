// telegramResponses.js - Centralized error and success response utilities for the Telegram bot

/**
 * Send a standardized error message to the user and log the error.
 * @param {TelegramBot} bot - Telegram bot instance
 * @param {number|string} chatId - Telegram chat ID
 * @param {string} errorMsg - User-facing error message
 * @param {Error|string} [error] - Optional error object to log
 */
async function sendError(bot, chatId, errorMsg, error) {
  try {
    await bot.sendMessage(chatId, `❌ ${errorMsg}`, { parse_mode: 'Markdown' });
    if (error) {
      // Optionally log to your logger if available
      if (typeof logger !== 'undefined' && logger.error) {
        logger.error(errorMsg, error);
      } else {
        console.error(errorMsg, error);
      }
    }
  } catch (sendErr) {
    console.error('Failed to send Telegram error message:', sendErr);
  }
}

/**
 * Send a standardized success message to the user.
 * @param {TelegramBot} bot - Telegram bot instance
 * @param {number|string} chatId - Telegram chat ID
 * @param {string} message - User-facing success message
 */
async function sendSuccess(bot, chatId, message) {
  try {
    await bot.sendMessage(chatId, `✅ ${message}`, { parse_mode: 'Markdown' });
  } catch (sendErr) {
    console.error('Failed to send Telegram success message:', sendErr);
  }
}

module.exports = {
  sendError,
  sendSuccess
};
