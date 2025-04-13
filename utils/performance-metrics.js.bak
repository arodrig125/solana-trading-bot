/**
 * Performance metrics tracking for the arbitrage bot
 * This module tracks various performance metrics to help optimize the bot
 */

const logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

// Metrics storage
let metrics = {
  // Scan performance
  scanMetrics: {
    totalScans: 0,
    totalScanTime: 0,
    averageScanTime: 0,
    lastScanTime: 0,
    fastestScanTime: Infinity,
    slowestScanTime: 0,
    scansPerHour: 0,
    lastScanTimestamp: null,
    scanHistory: []
  },
  
  // Opportunity metrics
  opportunityMetrics: {
    totalOpportunities: 0,
    opportunitiesByType: {},
    averageProfitPercent: 0,
    highestProfitPercent: 0,
    opportunitiesPerScan: 0,
    opportunitiesPerHour: 0,
    opportunityHistory: []
  },
  
  // API metrics
  apiMetrics: {
    totalApiCalls: 0,
    successfulApiCalls: 0,
    failedApiCalls: 0,
    averageApiCallTime: 0,
    apiCallsPerScan: 0,
    apiCallsPerHour: 0,
    apiCallHistory: []
  },
  
  // System metrics
  systemMetrics: {
    startTime: Date.now(),
    uptime: 0,
    memoryUsage: {},
    cpuUsage: {}
  }
};

// File path for metrics persistence
const METRICS_FILE = path.join(__dirname, '../data/performance-metrics.json');

/**
 * Initialize performance metrics
 */
async function initializeMetrics() {
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
    
    // Try to load existing metrics
    try {
      const data = await fs.readFile(METRICS_FILE, 'utf8');
      const loadedMetrics = JSON.parse(data);
      
      // Merge loaded metrics with default structure
      metrics = {
        ...metrics,
        ...loadedMetrics,
        // Always reset these on startup
        systemMetrics: {
          ...metrics.systemMetrics,
          startTime: Date.now(),
          uptime: 0
        }
      };
      
      logger.info('Loaded performance metrics from file');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, use default metrics
        logger.info('No existing performance metrics found, starting fresh');
        await saveMetrics();
      } else {
        throw error;
      }
    }
    
    // Start periodic metrics updates
    startPeriodicUpdates();
  } catch (error) {
    logger.error('Error initializing performance metrics:', error);
  }
}

/**
 * Save metrics to disk
 */
async function saveMetrics() {
  try {
    await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));
    logger.debug('Performance metrics saved to disk');
  } catch (error) {
    logger.error('Error saving performance metrics:', error);
  }
}

/**
 * Start periodic metrics updates
 */
function startPeriodicUpdates() {
  // Update system metrics every minute
  setInterval(() => {
    updateSystemMetrics();
  }, 60000);
  
  // Save metrics to disk every 5 minutes
  setInterval(() => {
    saveMetrics();
  }, 300000);
}

/**
 * Update system metrics
 */
function updateSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  
  metrics.systemMetrics.uptime = Math.floor((Date.now() - metrics.systemMetrics.startTime) / 1000);
  metrics.systemMetrics.memoryUsage = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memoryUsage.external / 1024 / 1024) // MB
  };
}

/**
 * Record the start of a scan
 * @returns {number} Timestamp of scan start
 */
function recordScanStart() {
  const timestamp = Date.now();
  metrics.scanMetrics.lastScanTimestamp = timestamp;
  return timestamp;
}

/**
 * Record the end of a scan
 * @param {number} startTimestamp - Timestamp when scan started
 * @param {number} opportunitiesFound - Number of opportunities found
 */
function recordScanEnd(startTimestamp, opportunitiesFound = 0) {
  const endTimestamp = Date.now();
  const scanDuration = endTimestamp - startTimestamp;
  
  // Update scan metrics
  metrics.scanMetrics.totalScans++;
  metrics.scanMetrics.totalScanTime += scanDuration;
  metrics.scanMetrics.lastScanTime = scanDuration;
  metrics.scanMetrics.fastestScanTime = Math.min(metrics.scanMetrics.fastestScanTime, scanDuration);
  metrics.scanMetrics.slowestScanTime = Math.max(metrics.scanMetrics.slowestScanTime, scanDuration);
  metrics.scanMetrics.averageScanTime = metrics.scanMetrics.totalScanTime / metrics.scanMetrics.totalScans;
  
  // Add to scan history (keep last 100)
  metrics.scanMetrics.scanHistory.push({
    timestamp: endTimestamp,
    duration: scanDuration,
    opportunitiesFound
  });
  
  if (metrics.scanMetrics.scanHistory.length > 100) {
    metrics.scanMetrics.scanHistory.shift();
  }
  
  // Calculate scans per hour based on recent history
  const oneHourAgo = Date.now() - 3600000;
  const scansInLastHour = metrics.scanMetrics.scanHistory.filter(scan => scan.timestamp >= oneHourAgo).length;
  metrics.scanMetrics.scansPerHour = scansInLastHour;
  
  // Log scan performance
  logger.debug(`Scan completed in ${scanDuration}ms, found ${opportunitiesFound} opportunities`);
}

/**
 * Record an API call
 * @param {string} endpoint - API endpoint called
 * @param {boolean} success - Whether the call was successful
 * @param {number} duration - Duration of the call in ms
 */
function recordApiCall(endpoint, success, duration) {
  metrics.apiMetrics.totalApiCalls++;
  
  if (success) {
    metrics.apiMetrics.successfulApiCalls++;
  } else {
    metrics.apiMetrics.failedApiCalls++;
  }
  
  // Update average call time
  const totalCallTime = metrics.apiMetrics.averageApiCallTime * (metrics.apiMetrics.totalApiCalls - 1) + duration;
  metrics.apiMetrics.averageApiCallTime = totalCallTime / metrics.apiMetrics.totalApiCalls;
  
  // Add to API call history (keep last 1000)
  metrics.apiMetrics.apiCallHistory.push({
    timestamp: Date.now(),
    endpoint,
    success,
    duration
  });
  
  if (metrics.apiMetrics.apiCallHistory.length > 1000) {
    metrics.apiMetrics.apiCallHistory.shift();
  }
  
  // Calculate API calls per hour
  const oneHourAgo = Date.now() - 3600000;
  const callsInLastHour = metrics.apiMetrics.apiCallHistory.filter(call => call.timestamp >= oneHourAgo).length;
  metrics.apiMetrics.apiCallsPerHour = callsInLastHour;
  
  // Calculate API calls per scan
  if (metrics.scanMetrics.totalScans > 0) {
    metrics.apiMetrics.apiCallsPerScan = metrics.apiMetrics.totalApiCalls / metrics.scanMetrics.totalScans;
  }
}

/**
 * Record an arbitrage opportunity
 * @param {Object} opportunity - Arbitrage opportunity
 */
function recordOpportunity(opportunity) {
  metrics.opportunityMetrics.totalOpportunities++;
  
  // Update by type
  const type = opportunity.type || 'unknown';
  metrics.opportunityMetrics.opportunitiesByType[type] = (metrics.opportunityMetrics.opportunitiesByType[type] || 0) + 1;
  
  // Update profit metrics
  const profitPercent = opportunity.profitPercent || 0;
  const totalProfit = metrics.opportunityMetrics.averageProfitPercent * (metrics.opportunityMetrics.totalOpportunities - 1) + profitPercent;
  metrics.opportunityMetrics.averageProfitPercent = totalProfit / metrics.opportunityMetrics.totalOpportunities;
  metrics.opportunityMetrics.highestProfitPercent = Math.max(metrics.opportunityMetrics.highestProfitPercent, profitPercent);
  
  // Add to opportunity history (keep last 100)
  metrics.opportunityMetrics.opportunityHistory.push({
    timestamp: Date.now(),
    type,
    profitPercent,
    details: {
      pair: opportunity.pair || opportunity.name,
      inputAmount: opportunity.inputAmount || opportunity.startAmount,
      profitAmount: opportunity.profitAmount
    }
  });
  
  if (metrics.opportunityMetrics.opportunityHistory.length > 100) {
    metrics.opportunityMetrics.opportunityHistory.shift();
  }
  
  // Calculate opportunities per scan
  if (metrics.scanMetrics.totalScans > 0) {
    metrics.opportunityMetrics.opportunitiesPerScan = metrics.opportunityMetrics.totalOpportunities / metrics.scanMetrics.totalScans;
  }
  
  // Calculate opportunities per hour
  const oneHourAgo = Date.now() - 3600000;
  const opportunitiesInLastHour = metrics.opportunityMetrics.opportunityHistory.filter(opp => opp.timestamp >= oneHourAgo).length;
  metrics.opportunityMetrics.opportunitiesPerHour = opportunitiesInLastHour;
}

/**
 * Get performance metrics summary
 * @returns {Object} Performance metrics summary
 */
function getMetricsSummary() {
  // Update system metrics before returning
  updateSystemMetrics();
  
  return {
    scanning: {
      totalScans: metrics.scanMetrics.totalScans,
      averageScanTime: Math.round(metrics.scanMetrics.averageScanTime),
      scansPerHour: metrics.scanMetrics.scansPerHour,
      lastScanTime: metrics.scanMetrics.lastScanTime
    },
    opportunities: {
      total: metrics.opportunityMetrics.totalOpportunities,
      byType: metrics.opportunityMetrics.opportunitiesByType,
      averageProfit: metrics.opportunityMetrics.averageProfitPercent.toFixed(2) + '%',
      highestProfit: metrics.opportunityMetrics.highestProfitPercent.toFixed(2) + '%',
      perHour: metrics.opportunityMetrics.opportunitiesPerHour
    },
    api: {
      totalCalls: metrics.apiMetrics.totalApiCalls,
      successRate: metrics.apiMetrics.totalApiCalls > 0 
        ? (metrics.apiMetrics.successfulApiCalls / metrics.apiMetrics.totalApiCalls * 100).toFixed(1) + '%'
        : 'N/A',
      averageCallTime: Math.round(metrics.apiMetrics.averageApiCallTime),
      callsPerHour: metrics.apiMetrics.apiCallsPerHour
    },
    system: {
      uptime: formatUptime(metrics.systemMetrics.uptime),
      memory: `${metrics.systemMetrics.memoryUsage.heapUsed}MB / ${metrics.systemMetrics.memoryUsage.heapTotal}MB`
    }
  };
}

/**
 * Format uptime in a human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Get recommended scan interval based on recent performance
 * @returns {number} Recommended scan interval in milliseconds
 */
function getRecommendedScanInterval() {
  // Default interval from settings
  const defaultInterval = 120000; // 2 minutes
  
  // If we don't have enough data, return default
  if (metrics.scanMetrics.scanHistory.length < 5) {
    return defaultInterval;
  }
  
  // Calculate average scan time from recent scans
  const recentScans = metrics.scanMetrics.scanHistory.slice(-5);
  const avgScanTime = recentScans.reduce((sum, scan) => sum + scan.duration, 0) / recentScans.length;
  
  // Calculate opportunity frequency
  const oneHourAgo = Date.now() - 3600000;
  const opportunitiesInLastHour = metrics.opportunityMetrics.opportunityHistory.filter(opp => opp.timestamp >= oneHourAgo).length;
  
  // Adjust interval based on scan time and opportunity frequency
  if (opportunitiesInLastHour > 10) {
    // High opportunity frequency - scan more often
    return Math.max(30000, avgScanTime * 3); // At least 30 seconds, or 3x avg scan time
  } else if (opportunitiesInLastHour > 5) {
    // Medium opportunity frequency
    return Math.max(60000, avgScanTime * 5); // At least 1 minute, or 5x avg scan time
  } else {
    // Low opportunity frequency - scan less often
    return Math.max(120000, avgScanTime * 10); // At least 2 minutes, or 10x avg scan time
  }
}

// Initialize on module load
initializeMetrics();

module.exports = {
  recordScanStart,
  recordScanEnd,
  recordApiCall,
  recordOpportunity,
  getMetricsSummary,
  getRecommendedScanInterval,
  saveMetrics
};
