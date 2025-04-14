const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// File paths for storing data
const DATA_DIR = path.join(__dirname, '..', 'data');
const TIME_ANALYTICS_FILE = path.join(DATA_DIR, 'time_analytics.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');

// Load data from JSON file
function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error(`Error loading data from ${filePath}:`, error);
  }
  return [];
}

// Time periods for analysis
const TIME_PERIODS = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory: ${DATA_DIR}`);
  }
}

// Load time analytics data
function loadTimeAnalytics() {
  ensureDataDir();
  
  let analytics = createEmptyAnalytics();
  
  if (fs.existsSync(TIME_ANALYTICS_FILE)) {
    try {
      const data = fs.readFileSync(TIME_ANALYTICS_FILE, 'utf8');
      analytics = JSON.parse(data);
    } catch (error) {
      logger.error('Error loading time analytics:', error);
    }
  }
  
  // Always ensure all required properties exist
  Object.values(TIME_PERIODS).forEach(period => {
    if (!analytics[period]) {
      analytics[period] = {};
    }
  });
  
  if (!analytics.lastUpdated) {
    analytics.lastUpdated = new Date().toISOString();
  }
  
  return analytics;
}

// Save time analytics data
function saveTimeAnalytics(data) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(TIME_ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Error saving time analytics:', error);
    return false;
  }
}

// Create empty analytics structure
function createEmptyAnalytics() {
  return {
    hourly: {},    // Key: YYYY-MM-DD-HH
    daily: {},     // Key: YYYY-MM-DD
    weekly: {},    // Key: YYYY-WW
    monthly: {},   // Key: YYYY-MM
    lastUpdated: null
  };
}

// Create empty period stats
function createEmptyPeriodStats() {
  return {
    opportunities: 0,
    trades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    totalVolume: 0,
    bestTrade: null,
    worstTrade: null,
    avgTradeProfit: 0,
    avgTradeDuration: 0,
    maxDrawdown: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    winRate: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    profitableHours: [],  // Hours with positive profit
    tokens: Object.create(null),  // Token-specific stats
    dexes: Object.create(null),   // DEX-specific stats
    riskMetrics: {
      maxDrawdown: 0,
      volatility: 0,
      valueAtRisk: 0
    }
  };
}

// Get period keys for a timestamp
function getPeriodKeys(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const week = String(getWeekNumber(date)).padStart(2, '0');
  
  return {
    hourly: `${year}-${month}-${day}-${hour}`,
    daily: `${year}-${month}-${day}`,
    weekly: `${year}-${week}`,
    monthly: `${year}-${month}`
  };
}

// Get week number (ISO week)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Record opportunity in time analytics
function recordOpportunity(opportunity) {
  const analytics = loadTimeAnalytics();
  const periodKeys = getPeriodKeys(new Date(opportunity.recordedAt));
  
  // Update stats for each time period
  Object.values(TIME_PERIODS).forEach(period => {
    const key = periodKeys[period];
    if (!analytics[period][key]) {
      const stats = createEmptyPeriodStats();
      stats.profitableHours = [];
      analytics[period][key] = stats;
    }
    
    const stats = analytics[period][key];
    stats.opportunities++;
    
    // Update token stats
    const token = opportunity.tokenSymbol;
    if (!stats.tokens[token]) {
      stats.tokens[token] = {
        opportunities: 0,
        volume: 0,
        profit: 0,
        successRate: 0,
        avgProfit: 0,
        totalTrades: 0
      };
    }
    stats.tokens[token].opportunities++;
    
    // Update DEX stats
    opportunity.route.path.forEach(dex => {
      if (!stats.dexes[dex]) {
        stats.dexes[dex] = {
          opportunities: 0,
          volume: 0,
          profit: 0,
          successRate: 0,
          avgProfit: 0,
          totalTrades: 0,
          latency: 0
        };
      }
      stats.dexes[dex].opportunities++;
    });
  });
  
  analytics.lastUpdated = new Date().toISOString();
  return saveTimeAnalytics(analytics);
}

// Record trade in time analytics
function recordTrade(trade) {
  const analytics = loadTimeAnalytics();
  const periodKeys = getPeriodKeys(new Date(trade.recordedAt));
  
  // Update stats for each time period
  Object.values(TIME_PERIODS).forEach(period => {
    const key = periodKeys[period];
    if (!analytics[period][key]) {
      analytics[period][key] = createEmptyPeriodStats();
    }
    
    const stats = analytics[period][key];
    const trades = loadData(TRADES_FILE) || [];
    stats.trades++;
    
    if (trade.success) {
      stats.successfulTrades++;
      stats.totalProfit += trade.profit || 0;
      stats.totalVolume += trade.volume || 0;
      
      // Update best/worst trades
      if (!stats.bestTrade || (trade.profitPercent > stats.bestTrade.profitPercent)) {
        stats.bestTrade = {
          id: trade.id,
          profit: trade.profit,
          profitPercent: trade.profitPercent,
          timestamp: trade.recordedAt
        };
      }
      
      if (!stats.worstTrade || (trade.profitPercent < stats.worstTrade.profitPercent)) {
        stats.worstTrade = {
          id: trade.id,
          profit: trade.profit,
          profitPercent: trade.profitPercent,
          timestamp: trade.recordedAt
        };
      }
      
      // Calculate average trade metrics
      stats.avgTradeProfit = stats.totalProfit / stats.successfulTrades;
      if (trade.duration) {
        stats.avgTradeDuration = ((stats.avgTradeDuration * (stats.successfulTrades - 1)) + trade.duration) / stats.successfulTrades;
      }
      
      // Update consecutive wins/losses
      stats.consecutiveWins++;
      stats.consecutiveLosses = 0;
      stats.maxConsecutiveWins = Math.max(stats.maxConsecutiveWins, stats.consecutiveWins);
      
      // Update profitable hours
      const hour = new Date(trade.recordedAt).getHours();
      if (!stats.profitableHours) {
        stats.profitableHours = [];
      }
      if (!stats.profitableHours.includes(hour)) {
        stats.profitableHours.push(hour);
        stats.profitableHours.sort((a, b) => a - b);
      }
      
      // Update token stats
      const token = trade.tokenSymbol;
      if (!stats.tokens[token]) {
        stats.tokens[token] = {
          opportunities: 0,
          volume: 0,
          profit: 0,
          successRate: 0,
          avgProfit: 0,
          totalTrades: 0
        };
      }
      stats.tokens[token].volume += trade.volume || 0;
      stats.tokens[token].profit += trade.profit || 0;
      stats.tokens[token].totalTrades++;
      stats.tokens[token].successRate = (stats.tokens[token].profit > 0 ? 1 : 0) / stats.tokens[token].totalTrades * 100;
      stats.tokens[token].avgProfit = stats.tokens[token].profit / stats.tokens[token].totalTrades;
      
      // Update DEX stats
      trade.route.path.forEach(dex => {
        if (!stats.dexes[dex]) {
          stats.dexes[dex] = {
            opportunities: 0,
            volume: 0,
            profit: 0,
            successRate: 0,
            avgProfit: 0,
            totalTrades: 0,
            latency: 0
          };
        }
        stats.dexes[dex].volume += trade.volume || 0;
        stats.dexes[dex].profit += trade.profit || 0;
        stats.dexes[dex].totalTrades++;
        stats.dexes[dex].successRate = (stats.dexes[dex].profit > 0 ? 1 : 0) / stats.dexes[dex].totalTrades * 100;
        stats.dexes[dex].avgProfit = stats.dexes[dex].profit / stats.dexes[dex].totalTrades;
        if (trade.latency) {
          stats.dexes[dex].latency = ((stats.dexes[dex].latency * (stats.dexes[dex].totalTrades - 1)) + trade.latency) / stats.dexes[dex].totalTrades;
        }
      });
    } else {
      stats.failedTrades++;
      stats.consecutiveWins = 0;
      stats.consecutiveLosses++;
      stats.maxConsecutiveLosses = Math.max(stats.maxConsecutiveLosses, stats.consecutiveLosses);
    }
    
    // Calculate win rate
    stats.winRate = (stats.successfulTrades / stats.trades) * 100;
    
    // Calculate profit factor (total profit / total loss)
    const totalLoss = trades
      .filter(t => t.profit < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit), 0);
    stats.profitFactor = totalLoss > 0 ? stats.totalProfit / totalLoss : stats.totalProfit;
    
    // Calculate Sharpe Ratio (assuming risk-free rate of 0.1%)
    const returns = trades.map(t => t.profitPercent / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const riskFreeRate = 0.001;
    stats.sharpeRatio = stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
    
    // Calculate risk metrics
    const equityCurve = trades.reduce((curve, t) => {
      const lastBalance = curve.length > 0 ? curve[curve.length - 1] : 0;
      curve.push(lastBalance + (t.profit || 0));
      return curve;
    }, []);
    
    if (equityCurve.length > 0) {
      // Calculate max drawdown
      let peak = equityCurve[0];
      let maxDrawdown = 0;
      
      equityCurve.forEach(balance => {
        if (balance > peak) peak = balance;
        const drawdown = (peak - balance) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });
      
      stats.riskMetrics.maxDrawdown = maxDrawdown * 100;
      
      // Calculate Value at Risk (95% confidence)
      const sortedReturns = returns.sort((a, b) => a - b);
      const varIndex = Math.floor(sortedReturns.length * 0.05);
      stats.riskMetrics.valueAtRisk = varIndex >= 0 ? Math.abs(sortedReturns[varIndex] * 100) : 0;
      
      // Calculate volatility
      stats.riskMetrics.volatility = stdDev * Math.sqrt(365) * 100; // Annualized volatility
    }
  });
  
  analytics.lastUpdated = new Date().toISOString();
  return saveTimeAnalytics(analytics);
}

// Get performance metrics for a specific time period
function getPerformanceMetrics(period, key) {
  const analytics = loadTimeAnalytics();
  return analytics[period][key] || null;
}

// Get best performing tokens for a period
function getBestPerformingTokens(period, key, limit = 5) {
  const stats = getPerformanceMetrics(period, key);
  if (!stats) return [];
  
  return Object.entries(stats.tokens)
    .map(([token, data]) => ({
      token,
      profit: data.profit,
      volume: data.volume,
      opportunities: data.opportunities
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
}

// Get best performing DEXes for a period
function getBestPerformingDEXes(period, key, limit = 5) {
  const stats = getPerformanceMetrics(period, key);
  if (!stats) return [];
  
  return Object.entries(stats.dexes)
    .map(([dex, data]) => ({
      dex,
      profit: data.profit,
      volume: data.volume,
      opportunities: data.opportunities
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
}

// Clean up old data (keep last 90 days)
function cleanupOldData() {
  const analytics = loadTimeAnalytics();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  
  let cleanupCount = 0;
  
  Object.values(TIME_PERIODS).forEach(period => {
    Object.keys(analytics[period]).forEach(key => {
      const date = new Date(key.split('-').slice(0, 3).join('-'));
      if (date < cutoff) {
        delete analytics[period][key];
        cleanupCount++;
      }
    });
  });
  
  if (cleanupCount > 0) {
    saveTimeAnalytics(analytics);
    logger.info(`Cleaned up ${cleanupCount} old time periods`);
  }
}

module.exports = {
  TIME_PERIODS,
  recordOpportunity,
  recordTrade,
  getPerformanceMetrics,
  getBestPerformingTokens,
  getBestPerformingDEXes,
  cleanupOldData,
  getPeriodKeys
};
