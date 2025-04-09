const winston = require('winston');
const path = require('path');
const fs = require('fs');
const settings = require('../config/settings');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
  level: settings.advanced.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'solana-arb-bot' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

// Add file transport if enabled
if (settings.advanced.logToFile) {
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: settings.advanced.maxLogSize * 1024 * 1024,
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: settings.advanced.maxLogSize * 1024 * 1024,
    maxFiles: 5
  }));
}

// Add custom logging methods
logger.startupMessage = (message) => {
  logger.info(`🚀 ${message}`);
  console.log(`🚀 ${message}`);
};

logger.successMessage = (message) => {
  logger.info(`✅ ${message}`);
  console.log(`✅ ${message}`);
};

logger.warningMessage = (message) => {
  logger.warn(`⚠️ ${message}`);
  console.log(`⚠️ ${message}`);
};

logger.errorMessage = (message, error) => {
  if (error) {
    logger.error(`❌ ${message}`, { error: error.message, stack: error.stack });
    console.error(`❌ ${message}: ${error.message}`);
  } else {
    logger.error(`❌ ${message}`);
    console.error(`❌ ${message}`);
  }
};

logger.opportunityFound = (opportunity) => {
  logger.info(`💰 Arbitrage opportunity found: ${JSON.stringify(opportunity)}`);
  console.log(`💰 Arbitrage opportunity found: ${opportunity.type} - Profit: ${opportunity.profitPercent.toFixed(2)}%`);
};

logger.tradeExecuted = (trade) => {
  const status = trade.success ? 'successful' : 'failed';
  const mode = trade.simulation ? 'SIMULATION' : 'LIVE';
  
  logger.info(`🤖 Trade ${status} (${mode}): ${JSON.stringify(trade)}`);
  console.log(`🤖 Trade ${status} (${mode}) - Profit: ${trade.opportunity?.profitPercent?.toFixed(2) || 0}%`);
};

module.exports = logger;
