/**
 * User Account Management
 * Handles user accounts, subscriptions, and tier management
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { DEFAULT_TIER, getTierConfig } = require('../config/tiers');

// Path to user data file
const USER_DATA_FILE = path.join(__dirname, '../data/users.json');

// In-memory cache of user data
let users = {};

/**
 * Initialize user manager
 * Loads user data from disk
 */
async function initializeUserManager() {
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
    
    // Try to load existing user data
    try {
      const data = await fs.readFile(USER_DATA_FILE, 'utf8');
      users = JSON.parse(data);
      logger.info(`Loaded ${Object.keys(users).length} user accounts`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create empty user data
        users = {};
        await saveUserData();
        logger.info('Created new user database');
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Error initializing user manager:', error);
    // Initialize with empty user data as fallback
    users = {};
  }
}

/**
 * Save user data to disk
 */
async function saveUserData() {
  try {
    await fs.writeFile(USER_DATA_FILE, JSON.stringify(users, null, 2));
    logger.debug('User data saved to disk');
    return true;
  } catch (error) {
    logger.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID (typically Telegram chat ID)
 * @returns {Object} User object or null if not found
 */
function getUser(userId) {
  return users[userId] || null;
}

/**
 * Create or update user
 * @param {string} userId - User ID (typically Telegram chat ID)
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user object
 */
async function updateUser(userId, userData) {
  // Get existing user or create new one with default tier
  const existingUser = users[userId] || {
    id: userId,
    tier: DEFAULT_TIER,
    created: Date.now(),
    wallets: [],
    settings: {},
    usage: {
      scans: 0,
      lastScan: null,
      dailyScans: 0,
      dailyReset: Date.now()
    }
  };
  
  // Update user data
  users[userId] = {
    ...existingUser,
    ...userData,
    updated: Date.now()
  };
  
  // Save to disk
  await saveUserData();
  
  return users[userId];
}

/**
 * Get user tier
 * @param {string} userId - User ID
 * @returns {string} Tier name (defaults to FREE if user not found)
 */
function getUserTier(userId) {
  const user = getUser(userId);
  return user ? user.tier : DEFAULT_TIER;
}

/**
 * Set user tier
 * @param {string} userId - User ID
 * @param {string} tier - Tier name
 * @returns {boolean} Success status
 */
async function setUserTier(userId, tier) {
  try {
    // Validate tier
    getTierConfig(tier);
    
    // Update user
    await updateUser(userId, { tier });
    logger.info(`User ${userId} tier set to ${tier}`);
    return true;
  } catch (error) {
    logger.error(`Error setting user tier: ${error.message}`);
    return false;
  }
}

/**
 * Check if user has access to a feature
 * @param {string} userId - User ID
 * @param {string} featurePath - Feature path (e.g., "notifications.email")
 * @returns {boolean} Whether user has access to the feature
 */
function userHasFeature(userId, featurePath) {
  const { hasFeature } = require('../config/tiers');
  const tier = getUserTier(userId);
  return hasFeature(tier, featurePath);
}

/**
 * Get user limit for a specific resource
 * @param {string} userId - User ID
 * @param {string} limitName - Limit name (e.g., "maxPairs")
 * @returns {any} Limit value
 */
function getUserLimit(userId, limitName) {
  const { getTierLimit } = require('../config/tiers');
  const tier = getUserTier(userId);
  return getTierLimit(tier, limitName);
}

/**
 * Record user scan
 * @param {string} userId - User ID
 * @returns {boolean} Whether scan was allowed (false if limit reached)
 */
async function recordUserScan(userId) {
  const user = getUser(userId);
  if (!user) {
    // Create user if not exists
    await updateUser(userId, {});
  }
  
  // Check if daily reset is needed
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (now - user.usage.dailyReset > oneDayMs) {
    user.usage.dailyScans = 0;
    user.usage.dailyReset = now;
  }
  
  // Get daily scan limit
  const dailyScanLimit = getUserLimit(userId, 'maxDailyScans');
  
  // Check if limit reached
  if (user.usage.dailyScans >= dailyScanLimit) {
    logger.warn(`User ${userId} reached daily scan limit (${dailyScanLimit})`);
    return false;
  }
  
  // Update usage
  user.usage.scans++;
  user.usage.dailyScans++;
  user.usage.lastScan = now;
  
  // Save changes
  await saveUserData();
  
  return true;
}

/**
 * Get user scan interval based on tier
 * @param {string} userId - User ID
 * @returns {number} Scan interval in milliseconds
 */
function getUserScanInterval(userId) {
  return getUserLimit(userId, 'scanInterval');
}

/**
 * Check if user is limited to simulation mode
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is limited to simulation mode
 */
function isSimulationOnly(userId) {
  return getUserLimit(userId, 'simulationOnly');
}

/**
 * Get user's allowed arbitrage types
 * @param {string} userId - User ID
 * @returns {Array<string>} Array of allowed arbitrage types
 */
function getAllowedArbitrageTypes(userId) {
  return getUserLimit(userId, 'arbitrageTypes');
}

/**
 * Get user's max concurrent requests
 * @param {string} userId - User ID
 * @returns {number} Max concurrent requests
 */
function getMaxConcurrentRequests(userId) {
  return getUserLimit(userId, 'maxConcurrentRequests');
}

/**
 * Get user's max token pairs
 * @param {string} userId - User ID
 * @returns {number} Max token pairs
 */
function getMaxTokenPairs(userId) {
  return getUserLimit(userId, 'maxPairs');
}

/**
 * Get user's support level
 * @param {string} userId - User ID
 * @returns {string} Support level
 */
function getSupportLevel(userId) {
  return getUserLimit(userId, 'supportLevel');
}

/**
 * Get user's tier name (display name)
 * @param {string} userId - User ID
 * @returns {string} Tier display name
 */
function getUserTierName(userId) {
  const tier = getUserTier(userId);
  const tierConfig = getTierConfig(tier);
  return tierConfig.name;
}

/**
 * Get user's usage statistics
 * @param {string} userId - User ID
 * @returns {Object} Usage statistics
 */
function getUserUsage(userId) {
  const user = getUser(userId);
  if (!user) {
    return {
      scans: 0,
      lastScan: null,
      dailyScans: 0,
      dailyReset: Date.now()
    };
  }
  return user.usage;
}

module.exports = {
  initializeUserManager,
  getUser,
  updateUser,
  getUserTier,
  setUserTier,
  userHasFeature,
  getUserLimit,
  recordUserScan,
  getUserScanInterval,
  isSimulationOnly,
  getAllowedArbitrageTypes,
  getMaxConcurrentRequests,
  getMaxTokenPairs,
  getSupportLevel,
  getUserTierName,
  getUserUsage
};
