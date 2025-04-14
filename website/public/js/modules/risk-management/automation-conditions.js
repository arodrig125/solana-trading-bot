/**
 * SolarBot Risk Automation Condition Evaluator
 * Evaluates different types of conditions for risk automation rules
 */

class ConditionEvaluator {
  // Singleton pattern
  static instance = null;
  
  constructor() {
    if (ConditionEvaluator.instance) {
      return ConditionEvaluator.instance;
    }
    
    ConditionEvaluator.instance = this;
    
    // Available condition types and their evaluation functions
    this.conditionTypes = {
      // Account conditions
      'dailyPnL': this.evaluateDailyPnL.bind(this),
      'dailyLoss': this.evaluateDailyLoss.bind(this),
      'weeklyPnL': this.evaluateWeeklyPnL.bind(this),
      'drawdown': this.evaluateDrawdown.bind(this),
      'balance': this.evaluateBalance.bind(this),
      
      // Trading performance conditions
      'winStreak': this.evaluateWinStreak.bind(this),
      'lossStreak': this.evaluateLossStreak.bind(this),
      'winRate': this.evaluateWinRate.bind(this),
      'tradeVolume': this.evaluateTradeVolume.bind(this),
      
      // Market conditions
      'marketVolatility': this.evaluateMarketVolatility.bind(this),
      'priceChange': this.evaluatePriceChange.bind(this),
      'trendDirection': this.evaluateTrendDirection.bind(this),
      'marketCorrelation': this.evaluateMarketCorrelation.bind(this),
      
      // Position conditions
      'positionCount': this.evaluatePositionCount.bind(this),
      'positionSize': this.evaluatePositionSize.bind(this),
      'positionAge': this.evaluatePositionAge.bind(this),
      'positionPnL': this.evaluatePositionPnL.bind(this),
      
      // Time conditions
      'timeOfDay': this.evaluateTimeOfDay.bind(this),
      'dayOfWeek': this.evaluateDayOfWeek.bind(this),
      
      // Composite conditions
      'and': this.evaluateAnd.bind(this),
      'or': this.evaluateOr.bind(this),
      'not': this.evaluateNot.bind(this)
    };
    
    // Available operators and their evaluation functions
    this.operators = {
      'equals': (a, b) => a === b,
      'notEquals': (a, b) => a !== b,
      'greaterThan': (a, b) => a > b,
      'greaterThanOrEqual': (a, b) => a >= b,
      'lessThan': (a, b) => a < b,
      'lessThanOrEqual': (a, b) => a <= b,
      'between': (a, min, max) => a >= min && a <= max,
      'contains': (arr, item) => Array.isArray(arr) && arr.includes(item),
      'startsWith': (a, b) => typeof a === 'string' && a.startsWith(b),
      'endsWith': (a, b) => typeof a === 'string' && a.endsWith(b)
    };
  }
  
  /**
   * Evaluate all conditions for a rule
   * @param {Array} conditions - List of condition objects
   * @param {Object} context - Evaluation context with market and account data
   * @returns {boolean} True if all conditions are met
   */
  evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) return false;
    
    // By default, conditions are combined with logical AND
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, context);
      if (!result) return false; // Short-circuit on first false condition
    }
    
    return true;
  }
  
  /**
   * Evaluate a single condition
   */
  evaluateCondition(condition, context) {
    const { type } = condition;
    
    // Handle unknown condition type
    if (!this.conditionTypes[type]) {
      console.warn(`Unknown condition type: ${type}`);
      return false;
    }
    
    // Call the appropriate condition evaluator
    return this.conditionTypes[type](condition, context);
  }
  
  /**
   * Apply an operator to compare values
   */
  applyOperator(operator, actualValue, expectedValue, additionalValue = null) {
    const operatorFn = this.operators[operator];
    
    if (!operatorFn) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }
    
    // Special case for 'between' operator which needs two values
    if (operator === 'between' && additionalValue !== null) {
      return operatorFn(actualValue, expectedValue, additionalValue);
    }
    
    return operatorFn(actualValue, expectedValue);
  }
  
  /**
   * Evaluate daily P&L condition
   */
  evaluateDailyPnL(condition, context) {
    const { operator, value, unit = 'percentage' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.dailyPerformance) return false;
    
    let pnl;
    
    if (unit === 'percentage') {
      // Calculate P&L as percentage of account balance
      pnl = (accountData.dailyPerformance.profitLoss / accountData.balance) * 100;
    } else {
      // Use absolute value
      pnl = accountData.dailyPerformance.profitLoss;
    }
    
    return this.applyOperator(operator, pnl, value);
  }
  
  /**
   * Evaluate daily loss condition (specific case of dailyPnL for losses)
   */
  evaluateDailyLoss(condition, context) {
    const { operator, value, unit = 'percentage' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.dailyPerformance) return false;
    
    // Only consider negative P&L (losses)
    if (accountData.dailyPerformance.profitLoss >= 0) return false;
    
    let loss;
    
    if (unit === 'percentage') {
      // Calculate loss as percentage of account balance (positive value)
      loss = Math.abs((accountData.dailyPerformance.profitLoss / accountData.balance) * 100);
    } else {
      // Use absolute value (positive)
      loss = Math.abs(accountData.dailyPerformance.profitLoss);
    }
    
    return this.applyOperator(operator, loss, value);
  }
  
  /**
   * Evaluate weekly P&L condition
   */
  evaluateWeeklyPnL(condition, context) {
    const { operator, value, unit = 'percentage' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.weeklyPerformance) return false;
    
    let pnl;
    
    if (unit === 'percentage') {
      // Calculate P&L as percentage of account balance
      pnl = (accountData.weeklyPerformance.profitLoss / accountData.balance) * 100;
    } else {
      // Use absolute value
      pnl = accountData.weeklyPerformance.profitLoss;
    }
    
    return this.applyOperator(operator, pnl, value);
  }
  
  /**
   * Evaluate drawdown condition
   */
  evaluateDrawdown(condition, context) {
    const { operator, value } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.currentDrawdown) return false;
    
    // Drawdown is expressed as a positive percentage
    const drawdown = accountData.currentDrawdown * 100;
    
    return this.applyOperator(operator, drawdown, value);
  }
  
  /**
   * Evaluate account balance condition
   */
  evaluateBalance(condition, context) {
    const { operator, value } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.balance) return false;
    
    return this.applyOperator(operator, accountData.balance, value);
  }
  
  /**
   * Evaluate win streak condition
   */
  evaluateWinStreak(condition, context) {
    const { operator, value } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.tradingStats) return false;
    
    const winStreak = accountData.tradingStats.currentWinStreak || 0;
    
    return this.applyOperator(operator, winStreak, value);
  }
  
  /**
   * Evaluate loss streak condition
   */
  evaluateLossStreak(condition, context) {
    const { operator, value } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.tradingStats) return false;
    
    const lossStreak = accountData.tradingStats.currentLossStreak || 0;
    
    return this.applyOperator(operator, lossStreak, value);
  }
  
  /**
   * Evaluate win rate condition
   */
  evaluateWinRate(condition, context) {
    const { operator, value, period = 'all' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.tradingStats) return false;
    
    let winRate;
    
    switch (period) {
      case 'daily':
        winRate = accountData.tradingStats.dailyWinRate || 0;
        break;
      case 'weekly':
        winRate = accountData.tradingStats.weeklyWinRate || 0;
        break;
      case 'monthly':
        winRate = accountData.tradingStats.monthlyWinRate || 0;
        break;
      case 'all':
      default:
        winRate = accountData.tradingStats.overallWinRate || 0;
        break;
    }
    
    // Convert to percentage
    winRate *= 100;
    
    return this.applyOperator(operator, winRate, value);
  }
  
  /**
   * Evaluate trade volume condition
   */
  evaluateTradeVolume(condition, context) {
    const { operator, value, period = 'daily' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.tradingStats) return false;
    
    let volume;
    
    switch (period) {
      case 'daily':
        volume = accountData.tradingStats.dailyTradeCount || 0;
        break;
      case 'weekly':
        volume = accountData.tradingStats.weeklyTradeCount || 0;
        break;
      case 'monthly':
        volume = accountData.tradingStats.monthlyTradeCount || 0;
        break;
      case 'all':
        volume = accountData.tradingStats.totalTradeCount || 0;
        break;
    }
    
    return this.applyOperator(operator, volume, value);
  }
  
  /**
   * Evaluate market volatility condition
   */
  evaluateMarketVolatility(condition, context) {
    const { operator, value, pair, timeframe = '1h' } = condition;
    const { marketData } = context;
    
    if (!marketData || !marketData.volatility) return false;
    
    // Find volatility for the specified pair and timeframe
    const pairVolatility = marketData.volatility[pair];
    
    if (!pairVolatility) return false;
    
    const volatility = pairVolatility[timeframe] || 0;
    
    // Volatility is expressed as a percentage
    return this.applyOperator(operator, volatility, value);
  }
  
  /**
   * Evaluate price change condition
   */
  evaluatePriceChange(condition, context) {
    const { operator, value, pair, timeframe = '1h' } = condition;
    const { marketData } = context;
    
    if (!marketData || !marketData.priceChanges) return false;
    
    // Find price change for the specified pair and timeframe
    const pairChanges = marketData.priceChanges[pair];
    
    if (!pairChanges) return false;
    
    const priceChange = pairChanges[timeframe] || 0;
    
    // Price change is expressed as a percentage
    return this.applyOperator(operator, priceChange, value);
  }
  
  /**
   * Evaluate trend direction condition
   */
  evaluateTrendDirection(condition, context) {
    const { operator, value, pair, timeframe = '1h' } = condition;
    const { marketData } = context;
    
    if (!marketData || !marketData.trends) return false;
    
    // Find trend for the specified pair and timeframe
    const pairTrends = marketData.trends[pair];
    
    if (!pairTrends) return false;
    
    const trend = pairTrends[timeframe] || 'neutral';
    
    // Value should be one of: 'up', 'down', 'neutral'
    return this.applyOperator(operator, trend, value);
  }
  
  /**
   * Evaluate market correlation condition
   */
  evaluateMarketCorrelation(condition, context) {
    const { operator, value, pair1, pair2, timeframe = '1d' } = condition;
    const { marketData } = context;
    
    if (!marketData || !marketData.correlations) return false;
    
    // Find correlation between the specified pairs
    const correlations = marketData.correlations[timeframe];
    
    if (!correlations) return false;
    
    // Check if correlation exists for the pair
    const pairKey = `${pair1}_${pair2}`;
    const reversePairKey = `${pair2}_${pair1}`;
    
    let correlation = correlations[pairKey] || correlations[reversePairKey] || null;
    
    if (correlation === null) return false;
    
    // Correlation is between -1 and 1
    return this.applyOperator(operator, correlation, value);
  }
  
  /**
   * Evaluate position count condition
   */
  evaluatePositionCount(condition, context) {
    const { operator, value, pairFilter } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.positions) return false;
    
    let positions = accountData.positions;
    
    // Apply pair filter if specified
    if (pairFilter) {
      positions = positions.filter(pos => pos.pair === pairFilter);
    }
    
    return this.applyOperator(operator, positions.length, value);
  }
  
  /**
   * Evaluate position size condition
   */
  evaluatePositionSize(condition, context) {
    const { operator, value, pair, unit = 'percentage' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.positions) return false;
    
    // Find position for the specified pair
    const position = accountData.positions.find(pos => pos.pair === pair);
    
    if (!position) return false;
    
    let size;
    
    if (unit === 'percentage') {
      // Calculate position size as percentage of account balance
      size = (position.positionValue / accountData.balance) * 100;
    } else {
      // Use absolute value
      size = position.positionValue;
    }
    
    return this.applyOperator(operator, size, value);
  }
  
  /**
   * Evaluate position age condition
   */
  evaluatePositionAge(condition, context) {
    const { operator, value, pair, unit = 'hours' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.positions) return false;
    
    // Find position for the specified pair
    const position = accountData.positions.find(pos => pos.pair === pair);
    
    if (!position || !position.openTime) return false;
    
    const now = new Date();
    const openTime = new Date(position.openTime);
    const ageMs = now - openTime;
    
    let age;
    
    switch (unit) {
      case 'minutes':
        age = ageMs / (1000 * 60);
        break;
      case 'hours':
        age = ageMs / (1000 * 60 * 60);
        break;
      case 'days':
        age = ageMs / (1000 * 60 * 60 * 24);
        break;
      default:
        age = ageMs; // milliseconds
        break;
    }
    
    return this.applyOperator(operator, age, value);
  }
  
  /**
   * Evaluate position P&L condition
   */
  evaluatePositionPnL(condition, context) {
    const { operator, value, pair, unit = 'percentage' } = condition;
    const { accountData } = context;
    
    if (!accountData || !accountData.positions) return false;
    
    // Find position for the specified pair
    const position = accountData.positions.find(pos => pos.pair === pair);
    
    if (!position) return false;
    
    let pnl;
    
    if (unit === 'percentage') {
      // P&L as percentage of position size
      pnl = (position.unrealizedPnL / position.positionValue) * 100;
    } else {
      // Absolute P&L
      pnl = position.unrealizedPnL;
    }
    
    return this.applyOperator(operator, pnl, value);
  }
  
  /**
   * Evaluate time of day condition
   */
  evaluateTimeOfDay(condition, context) {
    const { operator, value, valueEnd } = condition;
    
    // Get current time in HH:MM format
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // If using 'between' operator, we need both start and end time
    if (operator === 'between') {
      if (!valueEnd) return false;
      return this.applyOperator(operator, currentTime, value, valueEnd);
    }
    
    return this.applyOperator(operator, currentTime, value);
  }
  
  /**
   * Evaluate day of week condition
   */
  evaluateDayOfWeek(condition, context) {
    const { operator, value } = condition;
    
    // Get current day of week (0 = Sunday, 6 = Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    return this.applyOperator(operator, dayOfWeek, value);
  }
  
  /**
   * Evaluate AND condition (all sub-conditions must be true)
   */
  evaluateAnd(condition, context) {
    const { conditions } = condition;
    
    if (!Array.isArray(conditions) || conditions.length === 0) return false;
    
    for (const subCondition of conditions) {
      if (!this.evaluateCondition(subCondition, context)) {
        return false; // Short-circuit on first false condition
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate OR condition (at least one sub-condition must be true)
   */
  evaluateOr(condition, context) {
    const { conditions } = condition;
    
    if (!Array.isArray(conditions) || conditions.length === 0) return false;
    
    for (const subCondition of conditions) {
      if (this.evaluateCondition(subCondition, context)) {
        return true; // Short-circuit on first true condition
      }
    }
    
    return false;
  }
  
  /**
   * Evaluate NOT condition (inverts result of sub-condition)
   */
  evaluateNot(condition, context) {
    const { condition: subCondition } = condition;
    
    if (!subCondition) return false;
    
    return !this.evaluateCondition(subCondition, context);
  }
}

// Create singleton instance
window.ConditionEvaluator = new ConditionEvaluator();
