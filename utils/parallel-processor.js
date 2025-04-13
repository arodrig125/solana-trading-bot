/**
 * Parallel processing utility for arbitrage opportunity detection
 * This module helps optimize performance by processing multiple tasks in parallel
 */

const logger = require('./logger');
const settings = require('../config/settings');

/**
 * Process an array of tasks in parallel with concurrency control
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} concurrency - Maximum number of concurrent tasks
 * @returns {Promise<Array>} - Array of results
 */
async function processInParallel(items, processor, concurrency = 3) {
  // Use configured concurrency if not specified
  const maxConcurrent = concurrency || settings.scanning.maxConcurrentRequests || 3;
  
  // Track active promises and results
  const results = [];
  const activePromises = new Set();
  
  // Process items with concurrency control
  for (const item of items) {
    // Create a promise for this item
    const promise = (async () => {
      try {
        const result = await processor(item);
        if (result) {
          results.push(result);
        }
        return result;
      } catch (error) {
        logger.error(`Error processing item in parallel: ${error.message}`);
        return null;
      } finally {
        // Remove this promise from active set when done
        activePromises.delete(promise);
      }
    })();
    
    // Add to active promises
    activePromises.add(promise);
    
    // Wait if we've reached max concurrency
    if (activePromises.size >= maxConcurrent) {
      await Promise.race(activePromises);
    }
  }
  
  // Wait for all remaining promises to complete
  await Promise.all(activePromises);
  
  return results;
}

/**
 * Process arbitrage pairs in parallel
 * @param {Array} pairs - Array of token pairs to check
 * @param {Function} checkFunction - Function to check each pair
 * @param {Object} jupiterClient - Jupiter API client
 * @param {number} concurrency - Maximum number of concurrent checks
 * @returns {Promise<Array>} - Array of arbitrage opportunities
 */
async function processArbitragePairs(pairs, checkFunction, jupiterClient, concurrency = 3) {
  return processInParallel(
    pairs,
    async (pair) => {
      try {
        return await checkFunction(jupiterClient, pair);
      } catch (error) {
        logger.error(`Error checking arbitrage for ${pair.name || 'unknown pair'}:`, error);
        return null;
      }
    },
    concurrency
  );
}

/**
 * Process arbitrage paths in parallel
 * @param {Array} paths - Array of token paths to check
 * @param {Function} checkFunction - Function to check each path
 * @param {Object} jupiterClient - Jupiter API client
 * @param {string} amount - Amount to use for checking
 * @param {number} concurrency - Maximum number of concurrent checks
 * @returns {Promise<Array>} - Array of arbitrage opportunities
 */
async function processArbitragePaths(paths, checkFunction, jupiterClient, amount, concurrency = 3) {
  return processInParallel(
    paths,
    async (path) => {
      try {
        return await checkFunction(jupiterClient, path, amount);
      } catch (error) {
        logger.error(`Error checking arbitrage for path ${path.name || 'unknown path'}:`, error);
        return null;
      }
    },
    concurrency
  );
}

module.exports = {
  processInParallel,
  processArbitragePairs,
  processArbitragePaths
};
