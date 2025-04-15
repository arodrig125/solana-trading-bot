// Helper to validate Telegram command message structure
// Usage: if (!isValidTelegramMsg(msg)) return;

const logger = require('./logger');

function isValidTelegramMsg(msg, commandName = '') {
  if (!msg || !msg.chat || !msg.chat.id || !msg.from || !msg.from.id) {
    logger.warn(`${commandName} command called with invalid Telegram message structure`, msg);
    return false;
  }
  return true;
}

module.exports = { isValidTelegramMsg };
