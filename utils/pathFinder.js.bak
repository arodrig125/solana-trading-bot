/**
 * Path finder module for dynamic arbitrage path generation
 * This module discovers and evaluates potential arbitrage paths
 */

const { TOKENS } = require('../config/tokens');
const logger = require('./logger');

/**
 * Generate all possible paths of a given length starting and ending with the same token
 * @param {string} startTokenMint - The mint address of the starting token
 * @param {number} pathLength - The length of the path (3 for triangular, 4 for quadrangular, etc.)
 * @param {Array<string>} allowedTokens - Array of allowed token mint addresses
 * @returns {Array<Array<string>>} - Array of possible paths (each path is an array of token mint addresses)
 */
function generatePaths(startTokenMint, pathLength, allowedTokens) {
  // If no allowed tokens specified, use all tokens except blacklisted ones
  const tokenMints = allowedTokens || Object.values(TOKENS).map(token => token.mint);
  
  // Filter out the start token from the available tokens for intermediate steps
  const availableTokens = tokenMints.filter(mint => mint !== startTokenMint);
  
  // For a path of length N, we need N-2 intermediate tokens
  // (since the first and last tokens are the same)
  const paths = [];
  
  // Helper function to recursively build paths
  function buildPath(currentPath, remainingLength) {
    // If we've reached the desired path length minus 1, add the start token to complete the cycle
    if (remainingLength === 1) {
      paths.push([...currentPath, startTokenMint]);
      return;
    }
    
    // Otherwise, try each available token as the next step
    for (const tokenMint of availableTokens) {
      // Skip tokens already in the path to avoid loops
      if (!currentPath.includes(tokenMint)) {
        buildPath([...currentPath, tokenMint], remainingLength - 1);
      }
    }
  }
  
  // Start building paths from the start token
  buildPath([startTokenMint], pathLength - 1);
  
  return paths;
}

/**
 * Score paths based on liquidity, historical profitability, and other factors
 * @param {Array<Array<string>>} paths - Array of paths to score
 * @param {Object} historicalData - Historical profitability data
 * @returns {Array<Object>} - Scored paths with metadata
 */
function scorePaths(paths, historicalData = {}) {
  return paths.map(path => {
    // Create pairs from the path
    const pairs = [];
    for (let i = 0; i < path.length - 1; i++) {
      pairs.push([path[i], path[i + 1]]);
    }
    
    // Calculate base score
    let score = 1.0;
    
    // Adjust score based on token priorities
    const tokenPriorities = path.map(mint => {
      const token = Object.values(TOKENS).find(t => t.mint === mint);
      return token?.priority || 0;
    });
    
    // Higher priority tokens get higher scores
    const priorityScore = tokenPriorities.reduce((sum, priority) => sum + priority, 0) / tokenPriorities.length;
    score *= (priorityScore / 50); // Normalize
    
    // Adjust score based on historical profitability if available
    if (historicalData) {
      const pathKey = path.join('-');
      const pathHistory = historicalData[pathKey];
      
      if (pathHistory) {
        // Boost score for historically profitable paths
        score *= (1 + pathHistory.successRate);
        
        // Boost score for paths with higher average profit
        score *= (1 + pathHistory.averageProfit / 5);
      }
    }
    
    return {
      path,
      pairs,
      score,
      tokenSymbols: path.map(mint => {
        const token = Object.values(TOKENS).find(t => t.mint === mint);
        return token?.symbol || mint.substring(0, 6) + '...';
      })
    };
  })
  .sort((a, b) => b.score - a.score); // Sort by score descending
}

/**
 * Get the top N paths based on scoring
 * @param {string} startTokenMint - The mint address of the starting token
 * @param {number} pathLength - The length of the path
 * @param {number} limit - Maximum number of paths to return
 * @param {Array<string>} allowedTokens - Array of allowed token mint addresses
 * @param {Object} historicalData - Historical profitability data
 * @returns {Array<Object>} - Top scored paths
 */
function getTopPaths(startTokenMint, pathLength = 3, limit = 10, allowedTokens = null, historicalData = null) {
  const paths = generatePaths(startTokenMint, pathLength, allowedTokens);
  logger.debug(`Generated ${paths.length} possible paths of length ${pathLength}`);
  
  const scoredPaths = scorePaths(paths, historicalData);
  logger.debug(`Scored paths, top score: ${scoredPaths[0]?.score || 'N/A'}`);
  
  return scoredPaths.slice(0, limit);
}

/**
 * Generate multi-length paths (e.g., both triangular and quadrangular)
 * @param {string} startTokenMint - The mint address of the starting token
 * @param {Array<number>} pathLengths - Array of path lengths to generate
 * @param {number} limitPerLength - Maximum number of paths per length
 * @param {Array<string>} allowedTokens - Array of allowed token mint addresses
 * @param {Object} historicalData - Historical profitability data
 * @returns {Array<Object>} - Combined top paths of different lengths
 */
function getMultiLengthPaths(startTokenMint, pathLengths = [3, 4], limitPerLength = 5, allowedTokens = null, historicalData = null) {
  let allPaths = [];
  
  for (const length of pathLengths) {
    const paths = getTopPaths(startTokenMint, length, limitPerLength, allowedTokens, historicalData);
    allPaths = allPaths.concat(paths);
  }
  
  // Sort all paths by score
  return allPaths.sort((a, b) => b.score - a.score);
}

module.exports = {
  generatePaths,
  scorePaths,
  getTopPaths,
  getMultiLengthPaths
};
