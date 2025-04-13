/**
 * Path history tracking for arbitrage paths
 * This module tracks the success/failure history of arbitrage paths
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// Path to store history data
const HISTORY_FILE = path.join(__dirname, '../data/path-history.json');

// In-memory cache of path history
let pathHistoryCache = null;

/**
 * Initialize path history
 * Creates the data directory if it doesn't exist
 */
async function initPathHistory() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Load existing history or create new
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf8');
      pathHistoryCache = JSON.parse(data);
      logger.info(`Loaded path history with ${Object.keys(pathHistoryCache).length} entries`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create new history
        pathHistoryCache = {};
        await savePathHistory();
        logger.info('Created new path history file');
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Error initializing path history:', error);
    // Initialize with empty cache if there's an error
    pathHistoryCache = {};
  }
}

/**
 * Save path history to disk
 */
async function savePathHistory() {
  try {
    if (!pathHistoryCache) {
      await initPathHistory();
    }
    
    await fs.writeFile(HISTORY_FILE, JSON.stringify(pathHistoryCache, null, 2));
    logger.debug('Path history saved to disk');
  } catch (error) {
    logger.error('Error saving path history:', error);
  }
}

/**
 * Get path history for a specific path
 * @param {string[]} path - Array of token mint addresses
 * @returns {Object} Path history data
 */
function getPathHistory(path) {
  if (!pathHistoryCache) {
    return null;
  }
  
  const pathKey = path.join('-');
  return pathHistoryCache[pathKey] || null;
}

/**
 * Get all path history data
 * @returns {Object} All path history data
 */
async function getAllPathHistory() {
  if (!pathHistoryCache) {
    await initPathHistory();
  }
  
  return pathHistoryCache;
}

/**
 * Record an attempt for a path
 * @param {string[]} path - Array of token mint addresses
 * @param {boolean} success - Whether the attempt was successful
 * @param {number} profitPercent - Profit percentage (if successful)
 */
async function recordPathAttempt(path, success, profitPercent = 0) {
  if (!pathHistoryCache) {
    await initPathHistory();
  }
  
  const pathKey = path.join('-');
  const now = Date.now();
  
  // Initialize path history if it doesn't exist
  if (!pathHistoryCache[pathKey]) {
    pathHistoryCache[pathKey] = {
      attempts: 0,
      successes: 0,
      failures: 0,
      lastAttempt: now,
      lastSuccess: success ? now : null,
      lastFailure: !success ? now : null,
      avgProfitPercent: success ? profitPercent : 0,
      totalProfitPercent: success ? profitPercent : 0,
      history: []
    };
  }
  
  // Update path history
  const history = pathHistoryCache[pathKey];
  history.attempts++;
  
  if (success) {
    history.successes++;
    history.lastSuccess = now;
    history.totalProfitPercent += profitPercent;
    history.avgProfitPercent = history.totalProfitPercent / history.successes;
  } else {
    history.failures++;
    history.lastFailure = now;
  }
  
  history.lastAttempt = now;
  
  // Add to history array (keep last 100 attempts)
  history.history.push({
    timestamp: now,
    success,
    profitPercent: success ? profitPercent : 0
  });
  
  // Trim history to last 100 attempts
  if (history.history.length > 100) {
    history.history = history.history.slice(-100);
  }
  
  // Save to disk
  await savePathHistory();
}

/**
 * Add a result for a path
 * @param {string[]} path - Array of token mint addresses
 * @param {boolean} success - Whether the attempt was successful
 */
async function addPathResult(path, success) {
  await recordPathAttempt(path, success);
}

/**
 * Calculate success rate for a path
 * @param {string[]} path - Array of token mint addresses
 * @returns {number} Success rate (0-1)
 */
function calculateSuccessRate(path) {
  if (!pathHistoryCache) {
    return 0;
  }
  
  const pathKey = path.join('-');
  const history = pathHistoryCache[pathKey];
  
  if (!history || history.attempts === 0) {
    return 0;
  }
  
  return history.successes / history.attempts;
}

/**
 * Calculate average profit for a path
 * @param {string[]} path - Array of token mint addresses
 * @returns {number} Average profit percentage
 */
function calculateAverageProfit(path) {
  if (!pathHistoryCache) {
    return 0;
  }
  
  const pathKey = path.join('-');
  const history = pathHistoryCache[pathKey];
  
  if (!history || history.successes === 0) {
    return 0;
  }
  
  return history.avgProfitPercent;
}

// Initialize on module load
initPathHistory();

module.exports = {
  initPathHistory,
  getPathHistory,
  getAllPathHistory,
  recordPathAttempt,
  addPathResult,
  calculateSuccessRate,
  calculateAverageProfit
};
