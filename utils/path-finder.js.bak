/**
 * Path finder for discovering arbitrage opportunities
 * This module discovers and scores potential arbitrage paths
 */

const logger = require('./logger');
const { TOKENS, WHITELISTED_TOKENS, BLACKLISTED_TOKENS } = require('../config/tokens');
const settings = require('../config/settings');

// Cache for token relationships
let tokenRelationships = {};
let popularTokenPairs = [];

/**
 * Initialize the path finder
 * @param {Object} jupiterClient - Jupiter API client
 */
async function initializePathFinder(jupiterClient) {
  try {
    logger.info('Initializing path finder...');
    
    // Build token relationships
    await buildTokenRelationships(jupiterClient);
    
    // Identify popular token pairs
    identifyPopularTokenPairs();
    
    logger.info(`Path finder initialized with ${Object.keys(tokenRelationships).length} token relationships`);
  } catch (error) {
    logger.error('Error initializing path finder:', error);
  }
}

/**
 * Build relationships between tokens based on liquidity and trading volume
 * @param {Object} jupiterClient - Jupiter API client
 */
async function buildTokenRelationships(jupiterClient) {
  try {
    // Get all tokens
    const tokens = Object.values(TOKENS);
    
    // Filter tokens based on whitelist/blacklist
    const filteredTokens = tokens.filter(token => {
      if (BLACKLISTED_TOKENS.includes(token.mint)) {
        return false;
      }
      
      if (WHITELISTED_TOKENS.length > 0 && !WHITELISTED_TOKENS.includes(token.mint)) {
        return false;
      }
      
      return true;
    });
    
    logger.info(`Building relationships for ${filteredTokens.length} tokens...`);
    
    // Initialize relationships
    tokenRelationships = {};
    
    // For each token, find related tokens
    for (const token of filteredTokens) {
      tokenRelationships[token.mint] = {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        category: token.category || 'other',
        related: []
      };
    }
    
    // Add some predefined relationships for common tokens
    addPredefinedRelationships();
    
    logger.info('Token relationships built successfully');
  } catch (error) {
    logger.error('Error building token relationships:', error);
  }
}

/**
 * Add predefined relationships for common tokens
 */
function addPredefinedRelationships() {
  // Get token mints by symbol
  const getTokenMintBySymbol = (symbol) => {
    const token = Object.values(TOKENS).find(t => t.symbol === symbol);
    return token ? token.mint : null;
  };
  
  // Common stablecoin relationships
  const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDH', 'UXD'];
  const stablecoinMints = stablecoins.map(getTokenMintBySymbol).filter(Boolean);
  
  // Create relationships between all stablecoins
  for (const mintA of stablecoinMints) {
    for (const mintB of stablecoinMints) {
      if (mintA !== mintB) {
        addRelationship(mintA, mintB, 0.9); // High score for stablecoin pairs
      }
    }
  }
  
  // Major token relationships
  const majorTokens = ['SOL', 'BTC', 'ETH', 'BONK', 'RAY', 'SRM', 'MNGO', 'ORCA'];
  const majorTokenMints = majorTokens.map(getTokenMintBySymbol).filter(Boolean);
  
  // Create relationships between major tokens
  for (const mintA of majorTokenMints) {
    for (const mintB of majorTokenMints) {
      if (mintA !== mintB) {
        addRelationship(mintA, mintB, 0.8); // High score for major token pairs
      }
    }
    
    // Create relationships between major tokens and stablecoins
    for (const stableMint of stablecoinMints) {
      addRelationship(mintA, stableMint, 0.85); // Very high score for major-stable pairs
    }
  }
  
  // Add some specific high-liquidity pairs
  const specificPairs = [
    { a: 'SOL', b: 'USDC', score: 0.95 },
    { a: 'BTC', b: 'USDC', score: 0.95 },
    { a: 'ETH', b: 'USDC', score: 0.95 },
    { a: 'SOL', b: 'USDT', score: 0.9 },
    { a: 'RAY', b: 'USDC', score: 0.85 },
    { a: 'BONK', b: 'SOL', score: 0.85 },
    { a: 'ORCA', b: 'USDC', score: 0.8 },
    { a: 'MNGO', b: 'USDC', score: 0.8 },
    { a: 'SRM', b: 'USDC', score: 0.8 },
  ];
  
  for (const pair of specificPairs) {
    const mintA = getTokenMintBySymbol(pair.a);
    const mintB = getTokenMintBySymbol(pair.b);
    
    if (mintA && mintB) {
      addRelationship(mintA, mintB, pair.score);
    }
  }
}

/**
 * Add a relationship between two tokens
 * @param {string} mintA - First token mint
 * @param {string} mintB - Second token mint
 * @param {number} score - Relationship score (0-1)
 */
function addRelationship(mintA, mintB, score) {
  if (!tokenRelationships[mintA] || !tokenRelationships[mintB]) {
    return;
  }
  
  // Check if relationship already exists
  const existingRelationship = tokenRelationships[mintA].related.find(r => r.mint === mintB);
  
  if (existingRelationship) {
    // Update score if new score is higher
    if (score > existingRelationship.score) {
      existingRelationship.score = score;
    }
  } else {
    // Add new relationship
    tokenRelationships[mintA].related.push({
      mint: mintB,
      symbol: tokenRelationships[mintB].symbol,
      score
    });
  }
  
  // Add reverse relationship
  const existingReverseRelationship = tokenRelationships[mintB].related.find(r => r.mint === mintA);
  
  if (existingReverseRelationship) {
    // Update score if new score is higher
    if (score > existingReverseRelationship.score) {
      existingReverseRelationship.score = score;
    }
  } else {
    // Add new relationship
    tokenRelationships[mintB].related.push({
      mint: mintA,
      symbol: tokenRelationships[mintA].symbol,
      score
    });
  }
}

/**
 * Identify popular token pairs based on relationships
 */
function identifyPopularTokenPairs() {
  popularTokenPairs = [];
  
  // Get all token mints
  const tokenMints = Object.keys(tokenRelationships);
  
  // For each token, find its most related tokens
  for (const mintA of tokenMints) {
    const relatedTokens = tokenRelationships[mintA].related;
    
    // Sort by score
    relatedTokens.sort((a, b) => b.score - a.score);
    
    // Take top related tokens
    const topRelated = relatedTokens.slice(0, 5);
    
    // Add pairs to popular pairs
    for (const related of topRelated) {
      const mintB = related.mint;
      
      // Ensure we don't add duplicate pairs
      const pairExists = popularTokenPairs.some(pair => 
        (pair.a === mintA && pair.b === mintB) || 
        (pair.a === mintB && pair.b === mintA)
      );
      
      if (!pairExists) {
        popularTokenPairs.push({
          a: mintA,
          b: mintB,
          score: related.score,
          name: `${tokenRelationships[mintA].symbol}-${tokenRelationships[mintB].symbol}`
        });
      }
    }
  }
  
  // Sort by score
  popularTokenPairs.sort((a, b) => b.score - a.score);
  
  // Take top pairs
  popularTokenPairs = popularTokenPairs.slice(0, 20);
  
  logger.info(`Identified ${popularTokenPairs.length} popular token pairs`);
}

/**
 * Get top paths for a starting token
 * @param {string} startTokenMint - Starting token mint
 * @param {number} pathLength - Length of the path
 * @param {number} limit - Maximum number of paths to return
 * @param {string[]} allowedTokens - List of allowed token mints
 * @param {Object} pathHistoryData - Path history data for scoring
 * @returns {Array} Top paths
 */
function getTopPaths(startTokenMint, pathLength, limit = 5, allowedTokens = null, pathHistoryData = {}) {
  try {
    // Validate inputs
    if (!startTokenMint || !tokenRelationships[startTokenMint]) {
      logger.warn(`Invalid start token mint: ${startTokenMint}`);
      return [];
    }
    
    if (pathLength < 2 || pathLength > 5) {
      logger.warn(`Invalid path length: ${pathLength}. Must be between 2 and 5.`);
      return [];
    }
    
    // Generate paths
    const paths = generatePaths(startTokenMint, pathLength, allowedTokens);
    
    // Score paths
    const scoredPaths = scorePaths(paths, pathHistoryData);
    
    // Sort by score
    scoredPaths.sort((a, b) => b.score - a.score);
    
    // Take top paths
    const topPaths = scoredPaths.slice(0, limit);
    
    // Add token symbols
    topPaths.forEach(path => {
      path.tokenSymbols = path.path.map(mint => {
        const token = tokenRelationships[mint];
        return token ? token.symbol : mint.substring(0, 6) + '...';
      });
    });
    
    return topPaths;
  } catch (error) {
    logger.error('Error getting top paths:', error);
    return [];
  }
}

/**
 * Generate paths starting from a token
 * @param {string} startTokenMint - Starting token mint
 * @param {number} pathLength - Length of the path
 * @param {string[]} allowedTokens - List of allowed token mints
 * @returns {Array} Generated paths
 */
function generatePaths(startTokenMint, pathLength, allowedTokens = null) {
  // Initialize paths with starting token
  let paths = [[startTokenMint]];
  
  // Build paths iteratively
  for (let i = 1; i < pathLength; i++) {
    const newPaths = [];
    
    for (const path of paths) {
      const lastToken = path[path.length - 1];
      const relationships = tokenRelationships[lastToken]?.related || [];
      
      for (const related of relationships) {
        // Skip if token is already in path (avoid cycles)
        if (path.includes(related.mint)) {
          continue;
        }
        
        // Skip if token is not allowed
        if (allowedTokens && !allowedTokens.includes(related.mint)) {
          continue;
        }
        
        // Skip if token is blacklisted
        if (BLACKLISTED_TOKENS.includes(related.mint)) {
          continue;
        }
        
        // Create new path
        const newPath = [...path, related.mint];
        newPaths.push(newPath);
      }
    }
    
    // Update paths
    paths = newPaths;
    
    // Limit number of paths to avoid explosion
    if (paths.length > 1000) {
      // Sort by relationship score
      paths.sort((a, b) => {
        const scoreA = getPathRelationshipScore(a);
        const scoreB = getPathRelationshipScore(b);
        return scoreB - scoreA;
      });
      
      // Take top paths
      paths = paths.slice(0, 1000);
    }
  }
  
  return paths;
}

/**
 * Get relationship score for a path
 * @param {string[]} path - Token path
 * @returns {number} Relationship score
 */
function getPathRelationshipScore(path) {
  let score = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    const mintA = path[i];
    const mintB = path[i + 1];
    
    const relationship = tokenRelationships[mintA]?.related.find(r => r.mint === mintB);
    
    if (relationship) {
      score += relationship.score;
    }
  }
  
  return score / (path.length - 1);
}

/**
 * Score paths based on various factors
 * @param {Array} paths - Paths to score
 * @param {Object} pathHistoryData - Path history data
 * @returns {Array} Scored paths
 */
function scorePaths(paths, pathHistoryData = {}) {
  const scoredPaths = [];
  
  for (const path of paths) {
    // Skip invalid paths
    if (path.length < 2) {
      continue;
    }
    
    // Calculate relationship score
    const relationshipScore = getPathRelationshipScore(path);
    
    // Calculate history score
    const historyScore = getPathHistoryScore(path, pathHistoryData);
    
    // Calculate diversity score (prefer paths with diverse token types)
    const diversityScore = getPathDiversityScore(path);
    
    // Calculate final score
    const finalScore = (
      relationshipScore * 0.5 +
      historyScore * 0.3 +
      diversityScore * 0.2
    );
    
    // Add to scored paths
    scoredPaths.push({
      path,
      score: finalScore,
      relationshipScore,
      historyScore,
      diversityScore
    });
  }
  
  return scoredPaths;
}

/**
 * Get history score for a path
 * @param {string[]} path - Token path
 * @param {Object} pathHistoryData - Path history data
 * @returns {number} History score
 */
function getPathHistoryScore(path, pathHistoryData = {}) {
  const pathKey = path.join('-');
  const history = pathHistoryData[pathKey];
  
  if (!history) {
    return 0.5; // Neutral score for new paths
  }
  
  // Calculate success rate
  const successRate = history.successes / history.attempts;
  
  // Calculate profit consistency
  let profitConsistency = 0.5;
  if (history.successes > 0) {
    profitConsistency = Math.min(history.avgProfitPercent / 5, 1); // Normalize to 0-1
  }
  
  // Calculate recency score
  let recencyScore = 0.5;
  if (history.lastSuccess) {
    const daysSinceLastSuccess = (Date.now() - history.lastSuccess) / (24 * 60 * 60 * 1000);
    recencyScore = Math.max(0, 1 - (daysSinceLastSuccess / 7)); // Higher score for recent success
  }
  
  // Combine scores
  return (
    successRate * 0.6 +
    profitConsistency * 0.3 +
    recencyScore * 0.1
  );
}

/**
 * Get diversity score for a path
 * @param {string[]} path - Token path
 * @returns {number} Diversity score
 */
function getPathDiversityScore(path) {
  // Count token categories
  const categories = new Set();
  
  for (const mint of path) {
    const category = tokenRelationships[mint]?.category || 'other';
    categories.add(category);
  }
  
  // More diverse paths get higher scores
  return Math.min(categories.size / 3, 1);
}

/**
 * Get popular token pairs
 * @returns {Array} Popular token pairs
 */
function getPopularTokenPairs() {
  return popularTokenPairs;
}

/**
 * Get token relationships
 * @returns {Object} Token relationships
 */
function getTokenRelationships() {
  return tokenRelationships;
}

module.exports = {
  initializePathFinder,
  getTopPaths,
  getPopularTokenPairs,
  getTokenRelationships
};
