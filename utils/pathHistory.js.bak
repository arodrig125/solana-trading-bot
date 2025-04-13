/**
 * Path history module for tracking performance of arbitrage paths
 * This module maintains historical data on path profitability
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// In-memory cache of path history
let pathHistoryCache = {};
let isInitialized = false;

// File path for persistent storage
const HISTORY_FILE_PATH = path.join(__dirname, '../data/path_history.json');

/**
 * Initialize the path history module
 * @returns {Promise<Object>} - The loaded path history data
 */
async function initializePathHistory() {
  if (isInitialized) {
    return pathHistoryCache;
  }
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(HISTORY_FILE_PATH);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    
    // Try to load existing history file
    try {
      const data = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
      pathHistoryCache = JSON.parse(data);
      logger.info(`Loaded path history with ${Object.keys(pathHistoryCache).length} entries`);
    } catch (err) {
      // File might not exist yet, that's fine
      if (err.code !== 'ENOENT') {
        throw err;
      }
      pathHistoryCache = {};
      logger.info('No existing path history found, starting fresh');
    }
    
    isInitialized = true;
    return pathHistoryCache;
  } catch (error) {
    logger.error('Error initializing path history', error);
    // Return empty object as fallback
    pathHistoryCache = {};
    isInitialized = true;
    return pathHistoryCache;
  }
}

/**
 * Save the current path history to disk
 * @returns {Promise<void>}
 */
async function savePathHistory() {
  try {
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(pathHistoryCache, null, 2), 'utf8');
    logger.debug('Path history saved to disk');
  } catch (error) {
    logger.error('Error saving path history', error);
  }
}

/**
 * Record an arbitrage attempt for a specific path
 * @param {Array<string>} path - Array of token mint addresses in the path
 * @param {boolean} success - Whether the arbitrage was successful
 * @param {number} profitPercent - The profit percentage (can be negative)
 * @param {number} timestamp - Timestamp of the attempt
 */
async function recordPathAttempt(path, success, profitPercent, timestamp = Date.now()) {
  await initializePathHistory();
  
  const pathKey = path.join('-');
  
  // Initialize path entry if it doesn't exist
  if (!pathHistoryCache[pathKey]) {
    pathHistoryCache[pathKey] = {
      path,
      attempts: 0,
      successes: 0,
      failures: 0,
      successRate: 0,
      totalProfit: 0,
      averageProfit: 0,
      recentAttempts: []
    };
  }
  
  const pathData = pathHistoryCache[pathKey];
  
  // Update statistics
  pathData.attempts += 1;
  if (success) {
    pathData.successes += 1;
  } else {
    pathData.failures += 1;
  }
  
  pathData.successRate = pathData.successes / pathData.attempts;
  pathData.totalProfit += profitPercent;
  pathData.averageProfit = pathData.totalProfit / pathData.attempts;
  
  // Add to recent attempts (keep last 10)
  pathData.recentAttempts.push({
    timestamp,
    success,
    profitPercent
  });
  
  // Keep only the most recent 10 attempts
  if (pathData.recentAttempts.length > 10) {
    pathData.recentAttempts.shift();
  }
  
  // Save to disk periodically (every 10 records)
  if (Math.random() < 0.1) {
    await savePathHistory();
  }
}

/**
 * Get the history data for a specific path
 * @param {Array<string>} path - Array of token mint addresses in the path
 * @returns {Object|null} - The path history data or null if not found
 */
async function getPathHistory(path) {
  await initializePathHistory();
  
  const pathKey = path.join('-');
  return pathHistoryCache[pathKey] || null;
}

/**
 * Get all path history data
 * @returns {Object} - All path history data
 */
async function getAllPathHistory() {
  await initializePathHistory();
  return pathHistoryCache;
}

/**
 * Get the top performing paths based on success rate and profit
 * @param {number} limit - Maximum number of paths to return
 * @param {number} minAttempts - Minimum number of attempts required
 * @returns {Array<Object>} - Top performing paths
 */
async function getTopPerformingPaths(limit = 10, minAttempts = 5) {
  await initializePathHistory();
  
  return Object.values(pathHistoryCache)
    .filter(pathData => pathData.attempts >= minAttempts)
    .sort((a, b) => {
      // Sort by a combination of success rate and average profit
      const scoreA = a.successRate * (1 + a.averageProfit / 10);
      const scoreB = b.successRate * (1 + b.averageProfit / 10);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

module.exports = {
  initializePathHistory,
  recordPathAttempt,
  getPathHistory,
  getAllPathHistory,
  getTopPerformingPaths,
  savePathHistory
};
