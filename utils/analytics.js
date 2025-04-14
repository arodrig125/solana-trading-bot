const fs = require('fs');
const path = require('path');
const { logToSheets, logDailySummary } = require('./sheets');
const logger = require('./logger');
const tokenVolatility = require('./tokenVolatility');
const timeAnalytics = require('./timeAnalytics');

// File paths for storing data
const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const PERFORMANCE_FILE = path.join(DATA_DIR, 'performance.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory: ${DATA_DIR}`);
  }
}

// Load data from file
function loadData(filePath, defaultValue = []) {
  ensureDataDir();
  
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error loading data from ${filePath}:`, error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

// Save data to file
function saveData(filePath, data) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error saving data to ${filePath}:`, error);
    return false;
  }
}

// Generate unique ID
function generateId(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Record an arbitrage opportunity
function recordOpportunity(opportunity) {
  const opportunities = loadData(OPPORTUNITIES_FILE);
  
  // Add ID and timestamp if not present
  const enhancedOpportunity = {
    ...opportunity,
    id: opportunity.id || generateId('opp-'),
    recordedAt: new Date().toISOString()
  };
  
  opportunities.push(enhancedOpportunity);
  
  // Keep only the last 1000 opportunities to avoid file size issues
  if (opportunities.length > 1000) {
    opportunities.shift();
  }
  
  // Record price points for volatility tracking
  if (opportunity.tokenPrices) {
    Object.entries(opportunity.tokenPrices).forEach(([token, price]) => {
      tokenVolatility.recordPrice(token, price);
    });
  }

  // Record for time analytics
  timeAnalytics.recordOpportunity(enhancedOpportunity);
  
  return saveData(OPPORTUNITIES_FILE, opportunities);
}

// Record a trade
function recordTrade(trade) {
  const trades = loadData(TRADES_FILE);
  
  // Add ID and timestamp if not present
  const enhancedTrade = {
    ...trade,
    id: trade.id || generateId('trade-'),
    recordedAt: new Date().toISOString()
  };
  
  trades.push(enhancedTrade);
  
  // Keep only the last 1000 trades to avoid file size issues
  if (trades.length > 1000) {
    trades.shift();
  }

  // Record for time analytics
  timeAnalytics.recordTrade(enhancedTrade);
  
  return saveData(TRADES_FILE, trades);
}

// Update performance metrics
function updatePerformance(trade) {
  const performance = loadData(PERFORMANCE_FILE, {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    totalVolume: 0,
    averageProfitPercent: 0,
    bestTrade: null,
    worstTrade: null,
    dailyStats: {},
    lastUpdated: null
  });
  
  // Update overall stats
  performance.totalTrades += 1;
  
  if (trade.success) {
    performance.successfulTrades += 1;
    
    // Only count profit for successful trades
    const profitAmount = trade.opportunity.profitAmount || 0;
    const profitPercent = trade.opportunity.profitPercent || 0;
    const tradeVolume = trade.opportunity.startAmount || 0;
    
    performance.totalProfit += profitAmount;
    performance.totalVolume += tradeVolume;
    
    // Update average profit percent
    performance.averageProfitPercent = 
      (performance.averageProfitPercent * (performance.successfulTrades - 1) + profitPercent) / 
      performance.successfulTrades;
    
    // Update best trade
    if (!performance.bestTrade || profitPercent > performance.bestTrade.profitPercent) {
      performance.bestTrade = {
        tradeId: trade.id || `trade-${performance.totalTrades}`,
        profitAmount,
        profitPercent,
        timestamp: trade.timestamp
      };
    }
    
    // Update worst trade
    if (!performance.worstTrade || profitPercent < performance.worstTrade.profitPercent) {
      performance.worstTrade = {
        tradeId: trade.id || `trade-${performance.totalTrades}`,
        profitAmount,
        profitPercent,
        timestamp: trade.timestamp
      };
    }
  } else {
    performance.failedTrades += 1;
  }
  
  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  if (!performance.dailyStats[today]) {
    performance.dailyStats[today] = {
      date: today,
      trades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      profit: 0,
      volume: 0
    };
  }
  
  performance.dailyStats[today].trades += 1;
  
  if (trade.success) {
    performance.dailyStats[today].successfulTrades += 1;
    performance.dailyStats[today].profit += trade.opportunity.profitAmount || 0;
    performance.dailyStats[today].volume += trade.opportunity.startAmount || 0;
  } else {
    performance.dailyStats[today].failedTrades += 1;
  }
  
  // Update last updated timestamp
  performance.lastUpdated = new Date().toISOString();
  
  return saveData(PERFORMANCE_FILE, performance);
}

// Get performance summary
function getPerformanceSummary() {
  const performance = loadData(PERFORMANCE_FILE, {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    totalVolume: 0,
    averageProfitPercent: 0,
    lastUpdated: null
  });
  
  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = performance.dailyStats?.[today] || {
    trades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    profit: 0,
    volume: 0
  };
  
  // Get time-based metrics
  const periodKeys = timeAnalytics.getPeriodKeys(Date.now());
  const hourlyStats = timeAnalytics.getPerformanceMetrics(timeAnalytics.TIME_PERIODS.HOURLY, periodKeys.hourly) || createEmptyPeriodStats();
  const dailyStats = timeAnalytics.getPerformanceMetrics(timeAnalytics.TIME_PERIODS.DAILY, periodKeys.daily) || createEmptyPeriodStats();
  const weeklyStats = timeAnalytics.getPerformanceMetrics(timeAnalytics.TIME_PERIODS.WEEKLY, periodKeys.weekly) || createEmptyPeriodStats();
  const monthlyStats = timeAnalytics.getPerformanceMetrics(timeAnalytics.TIME_PERIODS.MONTHLY, periodKeys.monthly) || createEmptyPeriodStats();

  // Get best performers
  const bestDailyTokens = timeAnalytics.getBestPerformingTokens(timeAnalytics.TIME_PERIODS.DAILY, periodKeys.daily, 3);
  const bestDailyDEXes = timeAnalytics.getBestPerformingDEXes(timeAnalytics.TIME_PERIODS.DAILY, periodKeys.daily, 3);

  return {
    overall: {
      totalTrades: performance.totalTrades,
      successfulTrades: performance.successfulTrades,
      failedTrades: performance.failedTrades,
      successRate: performance.totalTrades > 0 
        ? (performance.successfulTrades / performance.totalTrades) * 100 
        : 0,
      totalProfit: performance.totalProfit,
      totalVolume: performance.totalVolume,
      averageProfitPercent: performance.averageProfitPercent
    },
    timeMetrics: {
      hourly: hourlyStats,
      daily: dailyStats,
      weekly: weeklyStats,
      monthly: monthlyStats
    },
    bestPerformers: {
      tokens: bestDailyTokens,
      dexes: bestDailyDEXes
    },
    today: dailyStats,
    bestTrade: performance.bestTrade,
    worstTrade: performance.worstTrade,
    lastUpdated: performance.lastUpdated
  };
}

// Get recent opportunities
function getRecentOpportunities(hours = 24) {
  const opportunities = loadData(OPPORTUNITIES_FILE);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return opportunities
    .filter(opp => new Date(opp.recordedAt) > cutoffTime)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

// Get recent trades
function getRecentTrades(hours = 24) {
  const trades = loadData(TRADES_FILE);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return trades
    .filter(trade => new Date(trade.recordedAt) > cutoffTime)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

// Check if we've hit risk management limits
function checkRiskLimits(tokenSymbol) {
  const performance = loadData(PERFORMANCE_FILE, {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    dailyStats: {}
  });
  
  const today = new Date().toISOString().split('T')[0];
  const todayStats = performance.dailyStats?.[today] || {
    trades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    profit: 0,
    volume: 0
  };
  
  const settings = require('../config/settings');
  
  // Check daily trade limit
  if (todayStats.trades >= settings.riskManagement.maxDailyTrades) {
    logger.warningMessage(`Daily trade limit reached (${todayStats.trades}/${settings.riskManagement.maxDailyTrades})`);
    return {
      canTrade: false,
      reason: 'Daily trade limit reached'
    };
  }
  
  // Check daily volume limit
  if (todayStats.volume >= settings.riskManagement.maxDailyVolume) {
    logger.warningMessage(`Daily volume limit reached (${todayStats.volume}/${settings.riskManagement.maxDailyVolume})`);
    return {
      canTrade: false,
      reason: 'Daily volume limit reached'
    };
  }
  
  // Check circuit breaker (consecutive losses)
  if (settings.riskManagement.enableCircuitBreaker) {
    const recentTrades = getRecentTrades(settings.riskManagement.circuitBreakerThreshold);
    
    if (recentTrades.length >= settings.riskManagement.circuitBreakerThreshold) {
      const consecutiveLosses = recentTrades.every(trade => !trade.success);
      
      if (consecutiveLosses) {
        logger.warningMessage(`Circuit breaker triggered: ${settings.riskManagement.circuitBreakerThreshold} consecutive failed trades`);
        return {
          canTrade: false,
          reason: 'Circuit breaker triggered'
        };
      }
    }
  }
  
  // Check if we're in loss for the day
  if (todayStats.profit < 0) {
    const lossPercentage = (Math.abs(todayStats.profit) / todayStats.volume) * 100;
    
    if (lossPercentage >= settings.riskManagement.maxLossPercentage) {
      logger.warningMessage(`Maximum loss percentage reached: ${lossPercentage.toFixed(2)}%`);
      return {
        canTrade: false,
        reason: 'Maximum loss percentage reached'
      };
    }
  }
  
  // Check token volatility
  const volatility = tokenVolatility.getTokenVolatility(tokenSymbol);
  if (volatility && volatility.short > settings.riskManagement.maxVolatility) {
    logger.warningMessage(`Token ${tokenSymbol} volatility too high: ${volatility.short.toFixed(2)}%`);
    return {
      canTrade: false,
      reason: 'Token volatility too high'
    };
  }

  return {
    canTrade: true
  };
}

// Generate daily report
async function generateDailyReport(sheetsClient, sheetId) {
  const summary = getPerformanceSummary();
  
  if (sheetsClient && sheetId) {
    try {
      await logDailySummary(sheetsClient, sheetId, summary);
      logger.successMessage('Daily report logged to Google Sheets');
      return true;
    } catch (error) {
      logger.errorMessage('Error logging daily report to Google Sheets', error);
      return false;
    }
  }
  
  return false;
}

// Format performance summary for Telegram
function formatPerformanceSummary(summary) {
  return `📊 *Performance Summary*\n\n` +
    `*Overall Stats:*\n` +
    `Total Trades: ${summary.overall.totalTrades}\n` +
    `Successful: ${summary.overall.successfulTrades}\n` +
    `Failed: ${summary.overall.failedTrades}\n` +
    `Success Rate: ${summary.overall.successRate.toFixed(2)}%\n` +
    `Total Profit: ${summary.overall.totalProfit.toFixed(6)} USDC\n` +
    `Total Volume: ${summary.overall.totalVolume.toFixed(2)} USDC\n` +
    `Avg Profit: ${summary.overall.averageProfitPercent.toFixed(2)}%\n\n` +
    
    `*Today's Stats:*\n` +
    `Trades: ${summary.today.trades}\n` +
    `Successful: ${summary.today.successfulTrades}\n` +
    `Profit: ${summary.today.profit.toFixed(6)} USDC\n` +
    `Volume: ${summary.today.volume.toFixed(2)} USDC\n\n` +
    
    (summary.bestTrade ? 
      `*Best Trade:*\n` +
      `Profit: ${summary.bestTrade.profitPercent.toFixed(2)}%\n` +
      `Amount: ${summary.bestTrade.profitAmount.toFixed(6)} USDC\n` +
      `Date: ${new Date(summary.bestTrade.timestamp).toLocaleString()}\n\n` : '') +
    
    `Last Updated: ${summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleString() : 'Never'}`;
}

module.exports = {
  recordOpportunity,
  recordTrade,
  updatePerformance,
  getPerformanceSummary,
  getRecentOpportunities,
  getRecentTrades,
  checkRiskLimits,
  generateDailyReport,
  formatPerformanceSummary
};
