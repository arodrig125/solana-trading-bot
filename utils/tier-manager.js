/**
 * Tier Manager - Manages user subscription tiers and their features
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Define tier levels and their features
const TIERS = {
  STARTER: {
    name: 'Starter',
    features: {
      maxTokenPairs: 5,
      maxConcurrentRequests: 2,
      scanInterval: 120000, // 2 minutes
      maxDailyScans: 100,
      allowedArbitrageTypes: ['simple'],
      simulationOnly: true,
      supportLevel: 'Community'
    }
  },
  PRO: {
    name: 'Pro',
    features: {
      maxTokenPairs: 20,
      maxConcurrentRequests: 5,
      scanInterval: 60000, // 1 minute
      maxDailyScans: 500,
      allowedArbitrageTypes: ['simple', 'triangular'],
      simulationOnly: false,
      supportLevel: 'Email'
    }
  },
  ELITE: {
    name: 'Elite',
    features: {
      maxTokenPairs: 50,
      maxConcurrentRequests: 10,
      scanInterval: 30000, // 30 seconds
      maxDailyScans: 2000,
      allowedArbitrageTypes: ['simple', 'triangular', 'multi-hop'],
      simulationOnly: false,
      supportLevel: 'Priority'
    }
  },
  INSTITUTIONAL: {
    name: 'Institutional',
    features: {
      maxTokenPairs: Infinity,
      maxConcurrentRequests: 20,
      scanInterval: 10000, // 10 seconds
      maxDailyScans: Infinity,
      allowedArbitrageTypes: ['simple', 'triangular', 'multi-hop', 'flash-loan'],
      simulationOnly: false,
      supportLevel: 'Dedicated'
    }
  }
};

// Path to user tiers data file
const dataDir = path.join(__dirname, '..', 'data');
const tiersFile = path.join(dataDir, 'user-tiers.json');

// In-memory cache of user tiers
let userTiers = {};

/**
 * Initialize the tier manager
 */
function initializeTierManager() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing user tiers
  if (fs.existsSync(tiersFile)) {
    try {
      userTiers = JSON.parse(fs.readFileSync(tiersFile, 'utf8'));
      logger.info(`Loaded ${Object.keys(userTiers).length} user tiers from storage`);
    } catch (error) {
      logger.errorMessage('Error loading user tiers:', error);
      userTiers = {};
    }
  } else {
    logger.info('No user tiers file found, starting with empty tiers');
    userTiers = {};
  }
}

/**
 * Save user tiers to disk
 */
function saveTiers() {
  try {
    fs.writeFileSync(tiersFile, JSON.stringify(userTiers, null, 2));
    return true;
  } catch (error) {
    logger.errorMessage('Error saving user tiers:', error);
    return false;
  }
}

/**
 * Set a user's subscription tier
 * @param {string} userId - The user's ID
 * @param {string} tier - The tier name (FREE, PRO, ELITE, INSTITUTIONAL)
 * @returns {boolean} - Whether the operation was successful
 */
function setUserTier(userId, tier) {
  // Validate tier
  if (!TIERS[tier]) {
    logger.errorMessage(`Invalid tier: ${tier}`);
    return false;
  }

  // Set user tier
  userTiers[userId] = tier;

  // Save to disk
  const saved = saveTiers();

  if (saved) {
    logger.info(`Set user ${userId} tier to ${tier}`);
  }

  return saved;
}

/**
 * Get a user's subscription tier
 * @param {string} userId - The user's ID
 * @returns {string} - The tier name (defaults to STARTER)
 */
function getUserTier(userId) {
  return userTiers[userId] || 'STARTER';
}

/**
 * Get a user's subscription tier name (display name)
 * @param {string} userId - The user's ID
 * @returns {string} - The tier display name
 */
function getUserTierName(userId) {
  const tier = getUserTier(userId);
  return TIERS[tier].name;
}

/**
 * Get a specific feature value for a user based on their tier
 * @param {string} userId - The user's ID
 * @param {string} feature - The feature name
 * @returns {any} - The feature value
 */
function getUserFeature(userId, feature) {
  const tier = getUserTier(userId);
  return TIERS[tier].features[feature];
}

/**
 * Check if a user is limited to simulation mode
 * @param {string} userId - The user's ID
 * @returns {boolean} - Whether the user is limited to simulation mode
 */
function isSimulationOnly(userId) {
  return getUserFeature(userId, 'simulationOnly');
}

/**
 * Get the maximum number of token pairs a user can scan
 * @param {string} userId - The user's ID
 * @returns {number} - The maximum number of token pairs
 */
function getMaxTokenPairs(userId) {
  return getUserFeature(userId, 'maxTokenPairs');
}

/**
 * Get the maximum number of concurrent requests a user can make
 * @param {string} userId - The user's ID
 * @returns {number} - The maximum number of concurrent requests
 */
function getMaxConcurrentRequests(userId) {
  return getUserFeature(userId, 'maxConcurrentRequests');
}

/**
 * Get the scan interval for a user
 * @param {string} userId - The user's ID
 * @returns {number} - The scan interval in milliseconds
 */
function getUserScanInterval(userId) {
  return getUserFeature(userId, 'scanInterval');
}

/**
 * Get the allowed arbitrage types for a user
 * @param {string} userId - The user's ID
 * @returns {string[]} - The allowed arbitrage types
 */
function getAllowedArbitrageTypes(userId) {
  return getUserFeature(userId, 'allowedArbitrageTypes');
}

/**
 * Get the support level for a user
 * @param {string} userId - The user's ID
 * @returns {string} - The support level
 */
function getSupportLevel(userId) {
  return getUserFeature(userId, 'supportLevel');
}

/**
 * Get a specific limit for a user based on their tier
 * @param {string} userId - The user's ID
 * @param {string} limitName - The limit name
 * @returns {any} - The limit value
 */
function getUserLimit(userId, limitName) {
  return getUserFeature(userId, limitName);
}

// Initialize on module load
initializeTierManager();

module.exports = {
  setUserTier,
  getUserTier,
  getUserTierName,
  isSimulationOnly,
  getMaxTokenPairs,
  getMaxConcurrentRequests,
  getUserScanInterval,
  getAllowedArbitrageTypes,
  getSupportLevel,
  getUserLimit,
  TIERS
};
