/**
 * Condition Evaluator for Risk Automation System
 * Evaluates rule conditions against account and market data
 */

const conditionEvaluator = {
  evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) return false;
    
    // By default, conditions are combined with logical AND
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, context);
      if (!result) return false;
    }
    
    return true;
  },
  
  evaluateCondition(condition, context) {
    // Handle compound conditions
    const { type } = condition;
    
    if (type === 'and') {
      return this.evaluateAnd(condition, context);
    } else if (type === 'or') {
      return this.evaluateOr(condition, context);
    } else if (type === 'not') {
      return this.evaluateNot(condition, context);
    }
    
    // Handle specific condition types
    const handler = this.conditionHandlers[type];
    if (!handler) {
      console.warn(`Unknown condition type: ${type}`);
      return false;
    }
    
    return handler(condition, context);
  },
  
  // Define handlers for each condition type
  conditionHandlers: {
    dailyPnL(condition, context) {
      const { operator, value, unit = 'percentage' } = condition;
      const { accountData } = context;
      
      if (!accountData || !accountData.dailyPerformance) return false;
      
      let pnl;
      if (unit === 'percentage') {
        pnl = (accountData.dailyPerformance.profitLoss / accountData.balance) * 100;
      } else {
        pnl = accountData.dailyPerformance.profitLoss;
      }
      
      return conditionEvaluator.applyOperator(operator, pnl, value);
    },
    
    dailyLoss(condition, context) {
      const { operator, value, unit = 'percentage' } = condition;
      const { accountData } = context;
      
      if (!accountData || !accountData.dailyPerformance) return false;
      
      // Only consider negative P&L (losses)
      if (accountData.dailyPerformance.profitLoss >= 0) return false;
      
      let loss;
      if (unit === 'percentage') {
        loss = Math.abs((accountData.dailyPerformance.profitLoss / accountData.balance) * 100);
      } else {
        loss = Math.abs(accountData.dailyPerformance.profitLoss);
      }
      
      return conditionEvaluator.applyOperator(operator, loss, value);
    },
    
    drawdown(condition, context) {
      const { operator, value } = condition;
      const { accountData } = context;
      
      if (!accountData || !accountData.currentDrawdown) return false;
      
      // Drawdown is expressed as a positive percentage
      const drawdown = accountData.currentDrawdown * 100;
      
      return conditionEvaluator.applyOperator(operator, drawdown, value);
    },
    
    balance(condition, context) {
      const { operator, value } = condition;
      const { accountData } = context;
      
      if (!accountData || !accountData.balance) return false;
      
      return conditionEvaluator.applyOperator(operator, accountData.balance, value);
    },
    
    marketVolatility(condition, context) {
      const { operator, value, pair, timeframe = '1h' } = condition;
      const { marketData } = context;
      
      if (!marketData || !marketData.volatility) return false;
      
      // Find volatility for the specified pair and timeframe
      const pairVolatility = marketData.volatility[pair];
      
      if (!pairVolatility) return false;
      
      const volatility = pairVolatility[timeframe] || 0;
      
      // Volatility is expressed as a percentage
      return conditionEvaluator.applyOperator(operator, volatility, value);
    }
  },
  
  // Helper method to evaluate operators
  applyOperator(operator, actualValue, expectedValue, additionalValue = null) {
    switch (operator) {
      case 'equals': return actualValue === expectedValue;
      case 'notEquals': return actualValue !== expectedValue;
      case 'greaterThan': return actualValue > expectedValue;
      case 'greaterThanOrEqual': return actualValue >= expectedValue;
      case 'lessThan': return actualValue < expectedValue;
      case 'lessThanOrEqual': return actualValue <= expectedValue;
      case 'between': return actualValue >= expectedValue && actualValue <= additionalValue;
      default: return false;
    }
  },
  
  // Implementation for compound conditions
  evaluateAnd(condition, context) {
    const { conditions } = condition;
    if (!conditions || conditions.length === 0) return false;
    
    for (const subCondition of conditions) {
      if (!this.evaluateCondition(subCondition, context)) {
        return false;
      }
    }
    
    return true;
  },
  
  evaluateOr(condition, context) {
    const { conditions } = condition;
    if (!conditions || conditions.length === 0) return false;
    
    for (const subCondition of conditions) {
      if (this.evaluateCondition(subCondition, context)) {
        return true;
      }
    }
    
    return false;
  },
  
  evaluateNot(condition, context) {
    const { condition: subCondition } = condition;
    if (!subCondition) return false;
    
    return !this.evaluateCondition(subCondition, context);
  }
};

module.exports = conditionEvaluator;