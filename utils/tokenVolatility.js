const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// File path for storing volatility data
const DATA_DIR = path.join(__dirname, '..', 'data');
const VOLATILITY_FILE = path.join(DATA_DIR, 'token_volatility.json');

// Time windows for volatility calculation (in minutes)
const TIME_WINDOWS = {
  SHORT: 5,    // 5 minutes
  MEDIUM: 60,  // 1 hour
  LONG: 1440   // 24 hours
};

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory: ${DATA_DIR}`);
  }
}

// Load volatility data
function loadVolatilityData() {
  ensureDataDir();
  
  if (fs.existsSync(VOLATILITY_FILE)) {
    try {
      const data = fs.readFileSync(VOLATILITY_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading volatility data:', error);
      return {};
    }
  }
  
  return {};
}

// Save volatility data
function saveVolatilityData(data) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(VOLATILITY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Error saving volatility data:', error);
    return false;
  }
}

// Record a new price point for a token
function recordPrice(tokenSymbol, price, timestamp = Date.now()) {
  const volatilityData = loadVolatilityData();
  
  // Initialize token data if it doesn't exist
  if (!volatilityData[tokenSymbol]) {
    volatilityData[tokenSymbol] = {
      priceHistory: [],
      volatility: {
        short: 0,
        medium: 0,
        long: 0
      },
      lastUpdated: null
    };
  }
  
  // Add new price point
  volatilityData[tokenSymbol].priceHistory.push({
    price,
    timestamp
  });
  
  // Keep only last 24 hours of data
  const cutoff = timestamp - (TIME_WINDOWS.LONG * 60 * 1000);
  volatilityData[tokenSymbol].priceHistory = volatilityData[tokenSymbol].priceHistory
    .filter(point => point.timestamp > cutoff);
  
  // Update volatility calculations
  updateVolatility(tokenSymbol, volatilityData);
  
  // Save updated data
  return saveVolatilityData(volatilityData);
}

// Calculate volatility for a specific time window
function calculateVolatility(priceHistory, minutes, currentTime) {
  const cutoff = currentTime - (minutes * 60 * 1000);
  const relevantPrices = priceHistory
    .filter(point => point.timestamp > cutoff)
    .map(point => point.price);
  
  if (relevantPrices.length < 2) {
    return 0;
  }
  
  // Calculate price returns
  const returns = [];
  for (let i = 1; i < relevantPrices.length; i++) {
    const return_ = (relevantPrices[i] - relevantPrices[i-1]) / relevantPrices[i-1];
    returns.push(return_);
  }
  
  // Calculate standard deviation of returns
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualize volatility
  const annualizationFactor = Math.sqrt(525600 / minutes); // 525600 = minutes in a year
  return stdDev * annualizationFactor * 100; // Convert to percentage
}

// Update volatility calculations for a token
function updateVolatility(tokenSymbol, volatilityData) {
  const token = volatilityData[tokenSymbol];
  const currentTime = Date.now();
  
  // Calculate volatility for each time window
  token.volatility = {
    short: calculateVolatility(token.priceHistory, TIME_WINDOWS.SHORT, currentTime),
    medium: calculateVolatility(token.priceHistory, TIME_WINDOWS.MEDIUM, currentTime),
    long: calculateVolatility(token.priceHistory, TIME_WINDOWS.LONG, currentTime)
  };
  
  token.lastUpdated = currentTime;
}

// Get volatility metrics for a token
function getTokenVolatility(tokenSymbol) {
  const volatilityData = loadVolatilityData();
  return volatilityData[tokenSymbol]?.volatility || null;
}

// Get high volatility tokens (above threshold)
function getHighVolatilityTokens(threshold = 50) {
  const volatilityData = loadVolatilityData();
  const highVolatilityTokens = [];
  
  for (const [symbol, data] of Object.entries(volatilityData)) {
    if (data.volatility.short > threshold || 
        data.volatility.medium > threshold || 
        data.volatility.long > threshold) {
      highVolatilityTokens.push({
        symbol,
        volatility: data.volatility
      });
    }
  }
  
  return highVolatilityTokens;
}

// Clean up old data
function cleanupOldData() {
  const volatilityData = loadVolatilityData();
  const cutoff = Date.now() - (TIME_WINDOWS.LONG * 60 * 1000);
  let cleanupCount = 0;
  
  for (const tokenSymbol in volatilityData) {
    const oldLength = volatilityData[tokenSymbol].priceHistory.length;
    volatilityData[tokenSymbol].priceHistory = volatilityData[tokenSymbol].priceHistory
      .filter(point => point.timestamp > cutoff);
    
    if (volatilityData[tokenSymbol].priceHistory.length === 0) {
      delete volatilityData[tokenSymbol];
      cleanupCount++;
    } else if (volatilityData[tokenSymbol].priceHistory.length < oldLength) {
      updateVolatility(tokenSymbol, volatilityData);
      cleanupCount++;
    }
  }
  
  if (cleanupCount > 0) {
    saveVolatilityData(volatilityData);
    logger.info(`Cleaned up data for ${cleanupCount} tokens`);
  }
}

module.exports = {
  recordPrice,
  getTokenVolatility,
  getHighVolatilityTokens,
  cleanupOldData,
  TIME_WINDOWS
};
