/**
 * Token Management System for SolarBot
 * 
 * This module provides token whitelist/blacklist functionality:
 * - Maintain user-specific token whitelists and blacklists
 * - Assess token risk based on various factors
 * - Automatically blacklist suspicious tokens
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const tierManager = require('./tier-manager');

// Constants
const DEFAULT_MAX_TOKENS = {
  'STARTER': 10,
  'PRO': 25,
  'ELITE': 50,
  'INSTITUTIONAL': 100
};

// Path to token lists data file
const dataDir = path.join(__dirname, '..', 'data');
const tokenListsFile = path.join(dataDir, 'token-lists.json');
const tokenRiskFile = path.join(dataDir, 'token-risk.json');

// In-memory cache of user token lists
let userTokenLists = {};

// In-memory cache of token risk assessments
let tokenRiskAssessments = {};

/**
 * Initialize the token manager
 */
function initializeTokenManager() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing token lists
  if (fs.existsSync(tokenListsFile)) {
    try {
      userTokenLists = JSON.parse(fs.readFileSync(tokenListsFile, 'utf8'));
      logger.info(`Loaded token lists for ${Object.keys(userTokenLists).length} users`);
    } catch (error) {
      logger.errorMessage('Error loading token lists:', error);
      userTokenLists = {};
    }
  } else {
    logger.info('No token lists file found, starting with empty lists');
    userTokenLists = {};
  }

  // Load existing token risk assessments
  if (fs.existsSync(tokenRiskFile)) {
    try {
      tokenRiskAssessments = JSON.parse(fs.readFileSync(tokenRiskFile, 'utf8'));
      logger.info(`Loaded risk assessments for ${Object.keys(tokenRiskAssessments).length} tokens`);
    } catch (error) {
      logger.errorMessage('Error loading token risk assessments:', error);
      tokenRiskAssessments = {};
    }
  } else {
    logger.info('No token risk file found, starting with empty assessments');
    tokenRiskAssessments = {};
  }
}

/**
 * Save token lists to disk
 */
function saveTokenLists() {
  try {
    fs.writeFileSync(tokenListsFile, JSON.stringify(userTokenLists, null, 2));
    return true;
  } catch (error) {
    logger.errorMessage('Error saving token lists:', error);
    return false;
  }
}

/**
 * Save token risk assessments to disk
 */
function saveTokenRiskAssessments() {
  try {
    fs.writeFileSync(tokenRiskFile, JSON.stringify(tokenRiskAssessments, null, 2));
    return true;
  } catch (error) {
    logger.errorMessage('Error saving token risk assessments:', error);
    return false;
  }
}

/**
 * Initialize token lists for a user
 * @param {string} userId - User ID
 */
function initializeUserTokenLists(userId) {
  if (!userTokenLists[userId]) {
    userTokenLists[userId] = {
      whitelist: [],
      blacklist: [],
      useWhitelist: false,
      useBlacklist: true
    };
    saveTokenLists();
  }
}

/**
 * Add a token to a user's whitelist
 * @param {string} userId - User ID
 * @param {string} token - Token symbol or address
 * @returns {Object} - Result with success status and message
 */
function addToWhitelist(userId, token) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check if token is already in whitelist
  if (userTokenLists[userId].whitelist.includes(token)) {
    return { success: false, message: `${token} is already in your whitelist` };
  }
  
  // Check if token is in blacklist
  if (userTokenLists[userId].blacklist.includes(token)) {
    return { success: false, message: `${token} is in your blacklist. Remove it from blacklist first.` };
  }
  
  // Check if user has reached their token limit
  const userTier = tierManager.getUserTier(userId);
  const maxTokens = DEFAULT_MAX_TOKENS[userTier] || DEFAULT_MAX_TOKENS.STARTER;
  
  if (userTokenLists[userId].whitelist.length >= maxTokens) {
    return { 
      success: false, 
      message: `You've reached your maximum of ${maxTokens} whitelisted tokens for your ${userTier} tier. Upgrade your tier or remove some tokens.` 
    };
  }
  
  // Add token to whitelist
  userTokenLists[userId].whitelist.push(token);
  saveTokenLists();
  
  return { success: true, message: `Added ${token} to your whitelist` };
}

/**
 * Remove a token from a user's whitelist
 * @param {string} userId - User ID
 * @param {string} token - Token symbol or address
 * @returns {Object} - Result with success status and message
 */
function removeFromWhitelist(userId, token) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check if token is in whitelist
  if (!userTokenLists[userId].whitelist.includes(token)) {
    return { success: false, message: `${token} is not in your whitelist` };
  }
  
  // Remove token from whitelist
  userTokenLists[userId].whitelist = userTokenLists[userId].whitelist.filter(t => t !== token);
  saveTokenLists();
  
  return { success: true, message: `Removed ${token} from your whitelist` };
}

/**
 * Add a token to a user's blacklist
 * @param {string} userId - User ID
 * @param {string} token - Token symbol or address
 * @returns {Object} - Result with success status and message
 */
function addToBlacklist(userId, token) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check if token is already in blacklist
  if (userTokenLists[userId].blacklist.includes(token)) {
    return { success: false, message: `${token} is already in your blacklist` };
  }
  
  // Check if token is in whitelist
  if (userTokenLists[userId].whitelist.includes(token)) {
    return { success: false, message: `${token} is in your whitelist. Remove it from whitelist first.` };
  }
  
  // Add token to blacklist
  userTokenLists[userId].blacklist.push(token);
  saveTokenLists();
  
  return { success: true, message: `Added ${token} to your blacklist` };
}

/**
 * Remove a token from a user's blacklist
 * @param {string} userId - User ID
 * @param {string} token - Token symbol or address
 * @returns {Object} - Result with success status and message
 */
function removeFromBlacklist(userId, token) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check if token is in blacklist
  if (!userTokenLists[userId].blacklist.includes(token)) {
    return { success: false, message: `${token} is not in your blacklist` };
  }
  
  // Remove token from blacklist
  userTokenLists[userId].blacklist = userTokenLists[userId].blacklist.filter(t => t !== token);
  saveTokenLists();
  
  return { success: true, message: `Removed ${token} from your blacklist` };
}

/**
 * Toggle whitelist usage for a user
 * @param {string} userId - User ID
 * @param {boolean} useWhitelist - Whether to use whitelist
 * @returns {Object} - Result with success status and message
 */
function setUseWhitelist(userId, useWhitelist) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Set whitelist usage
  userTokenLists[userId].useWhitelist = useWhitelist;
  saveTokenLists();
  
  return { 
    success: true, 
    message: `Whitelist ${useWhitelist ? 'enabled' : 'disabled'}. ${useWhitelist ? 'Only whitelisted tokens will be traded.' : 'All tokens may be traded (subject to blacklist).'}` 
  };
}

/**
 * Toggle blacklist usage for a user
 * @param {string} userId - User ID
 * @param {boolean} useBlacklist - Whether to use blacklist
 * @returns {Object} - Result with success status and message
 */
function setUseBlacklist(userId, useBlacklist) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Set blacklist usage
  userTokenLists[userId].useBlacklist = useBlacklist;
  saveTokenLists();
  
  return { 
    success: true, 
    message: `Blacklist ${useBlacklist ? 'enabled' : 'disabled'}. ${useBlacklist ? 'Blacklisted tokens will not be traded.' : 'All tokens may be traded (subject to whitelist).'}` 
  };
}

/**
 * Check if a token is allowed for trading by a user
 * @param {string} userId - User ID
 * @param {string} token - Token symbol or address
 * @returns {boolean} - Whether the token is allowed
 */
function isTokenAllowed(userId, token) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check blacklist first (if enabled)
  if (userTokenLists[userId].useBlacklist && userTokenLists[userId].blacklist.includes(token)) {
    return false;
  }
  
  // Check whitelist (if enabled)
  if (userTokenLists[userId].useWhitelist) {
    return userTokenLists[userId].whitelist.includes(token);
  }
  
  // If whitelist is not enabled and token is not blacklisted, it's allowed
  return true;
}

/**
 * Check if a trading pair is allowed for a user
 * @param {string} userId - User ID
 * @param {string} pair - Trading pair (e.g., "SOL/USDC")
 * @returns {Object} - Result with allowed status and reason
 */
function isPairAllowed(userId, pair) {
  // Split the pair into tokens
  const tokens = pair.split('/');
  
  if (tokens.length !== 2) {
    return { allowed: false, reason: 'Invalid trading pair format' };
  }
  
  const token1 = tokens[0].toUpperCase();
  const token2 = tokens[1].toUpperCase();
  
  // Check if either token is not allowed
  if (!isTokenAllowed(userId, token1)) {
    return { allowed: false, reason: `${token1} is not allowed for trading` };
  }
  
  if (!isTokenAllowed(userId, token2)) {
    return { allowed: false, reason: `${token2} is not allowed for trading` };
  }
  
  // Both tokens are allowed
  return { allowed: true, reason: 'Both tokens are allowed' };
}

/**
 * Assess the risk of a token
 * @param {string} token - Token symbol or address
 * @returns {Object} - Risk assessment with score and factors
 */
function assessTokenRisk(token) {
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Check if we already have a risk assessment for this token
  if (tokenRiskAssessments[token]) {
    return tokenRiskAssessments[token];
  }
  
  // Default risk assessment for unknown tokens
  // In a real implementation, this would query external APIs or on-chain data
  const assessment = {
    token,
    riskScore: 50, // Medium risk by default (0-100 scale)
    lastUpdated: Date.now(),
    factors: {
      liquidity: 'unknown',
      age: 'unknown',
      marketCap: 'unknown',
      volatility: 'medium',
      developerActivity: 'unknown',
      communitySize: 'unknown',
      exchangeListings: 'unknown'
    },
    warnings: []
  };
  
  // Store the assessment
  tokenRiskAssessments[token] = assessment;
  saveTokenRiskAssessments();
  
  return assessment;
}

/**
 * Update the risk assessment for a token
 * @param {string} token - Token symbol or address
 * @param {Object} assessment - Risk assessment data
 * @returns {boolean} - Success status
 */
function updateTokenRiskAssessment(token, assessment) {
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Update the assessment
  tokenRiskAssessments[token] = {
    ...assessment,
    lastUpdated: Date.now()
  };
  
  return saveTokenRiskAssessments();
}

/**
 * Automatically blacklist a token for all users if it's deemed too risky
 * @param {string} token - Token symbol or address
 * @param {string} reason - Reason for blacklisting
 * @returns {boolean} - Success status
 */
function autoBlacklistToken(token, reason) {
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  // Update risk assessment
  const assessment = assessTokenRisk(token);
  assessment.riskScore = 100; // Maximum risk
  assessment.warnings.push({
    timestamp: Date.now(),
    reason
  });
  
  updateTokenRiskAssessment(token, assessment);
  
  // Add to all users' blacklists
  let success = true;
  for (const userId in userTokenLists) {
    if (!userTokenLists[userId].blacklist.includes(token)) {
      userTokenLists[userId].blacklist.push(token);
    }
  }
  
  return saveTokenLists() && success;
}

/**
 * Get a user's token lists
 * @param {string} userId - User ID
 * @returns {Object} - User's token lists
 */
function getUserTokenLists(userId) {
  // Initialize user token lists if they don't exist
  initializeUserTokenLists(userId);
  
  return userTokenLists[userId];
}

/**
 * Get token risk assessment
 * @param {string} token - Token symbol or address
 * @returns {Object} - Token risk assessment
 */
function getTokenRiskAssessment(token) {
  // Normalize token symbol to uppercase
  token = token.toUpperCase();
  
  return assessTokenRisk(token);
}

// Initialize on module load
initializeTokenManager();

module.exports = {
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  setUseWhitelist,
  setUseBlacklist,
  isTokenAllowed,
  isPairAllowed,
  assessTokenRisk,
  updateTokenRiskAssessment,
  autoBlacklistToken,
  getUserTokenLists,
  getTokenRiskAssessment
};
