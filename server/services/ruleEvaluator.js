/**
 * Rule Evaluator Service for Risk Automation System
 * Evaluates automation rules against current data
 */

const mongoose = require('mongoose');
const conditionEvaluator = require('../utils/conditionEvaluator');
const actionExecutor = require('../utils/actionExecutor');

class RuleEvaluator {
  constructor() {
    this.conditionEvaluator = conditionEvaluator;
    this.actionExecutor = actionExecutor;
  }
  
  async evaluateRulesForUser(userId, walletId) {
    try {
      // Get all active rules for the user and wallet
      const rules = await mongoose.connection.db.collection('automationRules')
        .find({ userId, walletId, active: true })
        .toArray();
      
      if (!rules || rules.length === 0) {
        return { success: true, message: 'No active rules to evaluate' };
      }
      
      // Load context data
      const accountData = await this.getAccountData(userId, walletId);
      const marketData = await this.getMarketData();
      
      const context = {
        timestamp: new Date().toISOString(),
        accountData,
        marketData,
        userId,
        walletId
      };
      
      // Track triggered rules
      const triggeredRules = [];
      
      // Evaluate each rule
      for (const rule of rules) {
        // Skip rules that have reached their execution limit
        if (this.hasReachedExecutionLimit(rule)) {
          continue;
        }
        
        // Evaluate conditions
        const isTriggered = this.conditionEvaluator.evaluateConditions(rule.conditions, context);
        
        if (isTriggered) {
          triggeredRules.push(rule);
          
          // Record trigger
          await mongoose.connection.db.collection('automationRules').updateOne(
            { id: rule.id },
            { $set: { lastTriggered: new Date().toISOString() } }
          );
          
          // Execute actions
          await this.actionExecutor.executeActions(rule.actions, context);
          
          // Record execution in history
          await this.recordExecution(rule, context);
        }
      }
      
      return {
        success: true,
        triggeredRules,
        timestamp: context.timestamp
      };
      
    } catch (error) {
      console.error('Error evaluating rules:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if a rule has reached its execution limit
   */
  async hasReachedExecutionLimit(rule) {
    if (!rule.executionLimit) return false;
    
    const { type, limit } = rule.executionLimit;
    const now = new Date();
    
    // Get execution history for this rule
    let query = { ruleId: rule.id };
    
    // Add time filter based on limit type
    if (type === 'daily') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      query.timestamp = { $gte: today.toISOString() };
    } else if (type === 'hourly') {
      const hourAgo = new Date(now);
      hourAgo.setHours(hourAgo.getHours() - 1);
      query.timestamp = { $gte: hourAgo.toISOString() };
    }
    
    // Count executions
    const count = await mongoose.connection.db.collection('ruleExecutions')
      .countDocuments(query);
    
    return count >= limit;
  }
  
  /**
   * Record rule execution in history
   */
  async recordExecution(rule, context) {
    const execution = {
      ruleId: rule.id,
      ruleName: rule.name,
      userId: context.userId,
      walletId: context.walletId,
      timestamp: new Date().toISOString(),
      contextSnapshot: {
        // Store relevant context data, but avoid storing everything
        accountBalance: context.accountData?.balance,
        dailyPnL: context.accountData?.dailyPerformance?.profitLoss
      },
      success: true
    };
    
    await mongoose.connection.db.collection('ruleExecutions').insertOne(execution);
    
    return execution;
  }
  
  /**
   * Get account data for evaluation
   */
  async getAccountData(userId, walletId) {
    // In a real implementation, you would fetch this from your database or trading system
    // For now, return mock data
    return {
      balance: 1000,
      dailyPerformance: {
        profitLoss: -25, // $25 loss today
        trades: 5
      },
      weeklyPerformance: {
        profitLoss: 50, // $50 profit this week
        trades: 15
      },
      currentDrawdown: 0.05, // 5% drawdown
      tradingStats: {
        currentWinStreak: 2,
        currentLossStreak: 0,
        overallWinRate: 0.6 // 60% win rate
      },
      positions: [
        {
          pair: 'SOL/USD',
          positionValue: 200,
          unrealizedPnL: 10,
          openTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        }
      ]
    };
  }
  
  /**
   * Get market data for evaluation
   */
  async getMarketData() {
    // In a real implementation, you would fetch this from your market data provider
    // For now, return mock data
    return {
      volatility: {
        'SOL/USD': {
          '1h': 2.5, // 2.5% hourly volatility
          '1d': 5.8  // 5.8% daily volatility
        },
        'BTC/USD': {
          '1h': 1.8,
          '1d': 4.2
        }
      },
      priceChanges: {
        'SOL/USD': {
          '1h': 1.2, // 1.2% price change in the last hour
          '1d': -2.3 // -2.3% price change in the last day
        },
        'BTC/USD': {
          '1h': 0.5,
          '1d': 1.8
        }
      },
      trends: {
        'SOL/USD': {
          '1h': 'up',
          '1d': 'down'
        },
        'BTC/USD': {
          '1h': 'neutral',
          '1d': 'up'
        }
      }
    };
  }
}

module.exports = RuleEvaluator;