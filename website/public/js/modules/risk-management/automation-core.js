/**
 * SolarBot Risk Automation Core
 * Core system for automating risk management based on rules and conditions
 */

class AutomationCore {
  constructor() {
    this.api = window.solarbotApi;
    this.riskCore = new RiskManagementCore();
    this.rules = [];
    this.activeRules = [];
    this.marketData = {};
    this.accountData = {};
    this.executionHistory = [];
    this.lastEvaluation = null;
    this.initialized = false;
    
    // Event handlers
    this.eventListeners = {
      'ruleTriggered': [],
      'actionExecuted': [],
      'evaluationCompleted': [],
      'error': []
    };
    
    // Config
    this.config = {
      evaluationInterval: 60000, // 1 minute
      maxHistoryItems: 100,
      maxExecutionsPerDay: 20,
      automaticEvaluation: true
    };
  }
  
  /**
   * Initialize the automation engine
   */
  async initialize() {
    try {
      if (this.initialized) return;
      
      // Initialize risk core if not already initialized
      if (!this.riskCore.initialized) {
        await this.riskCore.initialize();
      }
      
      // Load user rules
      await this.loadRules();
      
      // Load initial data
      await Promise.all([
        this.loadMarketData(),
        this.loadAccountData()
      ]);
      
      // Set up automatic evaluation if enabled
      if (this.config.automaticEvaluation) {
        this.startAutomaticEvaluation();
      }
      
      this.initialized = true;
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize automation engine:', error);
      this.emitEvent('error', { message: 'Initialization failed', error });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Load user-defined rules from the server
   */
  async loadRules() {
    try {
      const response = await this.api.request('/automation/rules');
      
      if (response.rules) {
        this.rules = response.rules;
        this.activeRules = this.rules.filter(rule => rule.active);
      }
      
      return this.rules;
    } catch (error) {
      console.error('Failed to load automation rules:', error);
      this.emitEvent('error', { message: 'Failed to load rules', error });
      return [];
    }
  }
  
  /**
   * Load current market data
   */
  async loadMarketData() {
    try {
      const response = await this.api.request('/market/data');
      
      if (response.data) {
        this.marketData = response.data;
      }
      
      return this.marketData;
    } catch (error) {
      console.error('Failed to load market data:', error);
      this.emitEvent('error', { message: 'Failed to load market data', error });
      return {};
    }
  }
  
  /**
   * Load account data
   */
  async loadAccountData() {
    try {
      // Use risk core's account data if available
      if (this.riskCore.accountData) {
        this.accountData = this.riskCore.accountData;
        return this.accountData;
      }
      
      const response = await this.api.request('/account/data');
      
      if (response.data) {
        this.accountData = response.data;
      }
      
      return this.accountData;
    } catch (error) {
      console.error('Failed to load account data:', error);
      this.emitEvent('error', { message: 'Failed to load account data', error });
      return {};
    }
  }
  
  /**
   * Start automatic evaluation at the configured interval
   */
  startAutomaticEvaluation() {
    // Clear existing interval if any
    if (this._evaluationInterval) {
      clearInterval(this._evaluationInterval);
    }
    
    // Set up new interval
    this._evaluationInterval = setInterval(() => {
      this.evaluateRules();
    }, this.config.evaluationInterval);
    
    console.log(`Automatic rule evaluation started (interval: ${this.config.evaluationInterval / 1000}s)`);
  }
  
  /**
   * Stop automatic evaluation
   */
  stopAutomaticEvaluation() {
    if (this._evaluationInterval) {
      clearInterval(this._evaluationInterval);
      this._evaluationInterval = null;
      console.log('Automatic rule evaluation stopped');
    }
  }
  
  /**
   * Evaluate all active rules against current conditions
   */
  async evaluateRules() {
    if (!this.initialized) {
      console.warn('Automation engine not initialized. Call initialize() first.');
      return { success: false, error: 'Not initialized' };
    }
    
    try {
      // Refresh data before evaluation
      await Promise.all([
        this.loadMarketData(),
        this.loadAccountData()
      ]);
      
      // Start evaluation
      const evaluationContext = {
        timestamp: new Date().toISOString(),
        marketData: this.marketData,
        accountData: this.accountData,
        executionHistory: this.executionHistory
      };
      
      // Track triggered rules
      const triggeredRules = [];
      
      // Evaluate each active rule
      for (const rule of this.activeRules) {
        // Skip rules that have reached their execution limit
        if (this.hasReachedExecutionLimit(rule)) {
          continue;
        }
        
        // Evaluate rule conditions
        const isTriggered = this.evaluateRuleConditions(rule, evaluationContext);
        
        if (isTriggered) {
          triggeredRules.push(rule);
          this.emitEvent('ruleTriggered', { rule, context: evaluationContext });
        }
      }
      
      // Sort triggered rules by priority (highest first)
      triggeredRules.sort((a, b) => b.priority - a.priority);
      
      // Execute actions for triggered rules
      if (triggeredRules.length > 0) {
        await this.executeActions(triggeredRules, evaluationContext);
      }
      
      // Update last evaluation
      this.lastEvaluation = {
        timestamp: evaluationContext.timestamp,
        triggeredRules: triggeredRules.map(rule => rule.id),
        totalRulesEvaluated: this.activeRules.length
      };
      
      // Emit evaluation completed event
      this.emitEvent('evaluationCompleted', {
        timestamp: evaluationContext.timestamp,
        triggeredRules,
        totalRulesEvaluated: this.activeRules.length
      });
      
      return {
        success: true,
        triggeredRules,
        timestamp: evaluationContext.timestamp
      };
    } catch (error) {
      console.error('Rule evaluation failed:', error);
      this.emitEvent('error', { message: 'Rule evaluation failed', error });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if a rule has reached its execution limit
   */
  hasReachedExecutionLimit(rule) {
    if (!rule.executionLimit) return false;
    
    const { type, limit } = rule.executionLimit;
    const now = new Date();
    
    // Filter history by rule ID
    const ruleHistory = this.executionHistory.filter(item => item.ruleId === rule.id);
    
    if (type === 'total' && ruleHistory.length >= limit) {
      return true;
    }
    
    if (type === 'daily') {
      // Count executions today
      const today = now.toISOString().split('T')[0];
      const todayExecutions = ruleHistory.filter(item => 
        item.timestamp.startsWith(today)
      ).length;
      
      return todayExecutions >= limit;
    }
    
    if (type === 'hourly') {
      // Count executions in the last hour
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const hourlyExecutions = ruleHistory.filter(item => 
        item.timestamp >= hourAgo
      ).length;
      
      return hourlyExecutions >= limit;
    }
    
    return false;
  }
  
  /**
   * Evaluate conditions for a single rule
   */
  evaluateRuleConditions(rule, context) {
    // Logic for different condition types will be handled by the ConditionEvaluator
    // This will be implemented in automation-conditions.js
    return window.ConditionEvaluator ? 
      window.ConditionEvaluator.evaluateConditions(rule.conditions, context) :
      false;
  }
  
  /**
   * Execute actions for triggered rules
   */
  async executeActions(triggeredRules, context) {
    // Actions will be executed by the ActionExecutor
    // This will be implemented in automation-actions.js
    if (!window.ActionExecutor) {
      console.warn('ActionExecutor not available. Actions will not be executed.');
      return [];
    }
    
    const executedActions = [];
    
    for (const rule of triggeredRules) {
      try {
        // Execute the rule's actions
        const result = await window.ActionExecutor.executeActions(rule.actions, context);
        
        // Record execution in history
        const executionRecord = {
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: new Date().toISOString(),
          actions: rule.actions,
          success: result.success,
          results: result.results
        };
        
        this.executionHistory.unshift(executionRecord);
        
        // Limit history size
        if (this.executionHistory.length > this.config.maxHistoryItems) {
          this.executionHistory.pop();
        }
        
        // Update rule's lastTriggered timestamp
        rule.lastTriggered = executionRecord.timestamp;
        
        // Emit event
        this.emitEvent('actionExecuted', {
          rule,
          execution: executionRecord
        });
        
        executedActions.push(executionRecord);
      } catch (error) {
        console.error(`Failed to execute actions for rule ${rule.id}:`, error);
        this.emitEvent('error', {
          message: `Failed to execute actions for rule ${rule.id}`,
          rule,
          error
        });
      }
    }
    
    return executedActions;
  }
  
  /**
   * Add a rule to the system
   */
  async addRule(rule) {
    try {
      // Validate rule structure
      if (!this.validateRule(rule)) {
        throw new Error('Invalid rule structure');
      }
      
      // Add rule ID and timestamps if not present
      if (!rule.id) {
        rule.id = 'rule_' + Date.now();
      }
      
      if (!rule.createdAt) {
        rule.createdAt = new Date().toISOString();
      }
      
      // Save to server
      const response = await this.api.request('/automation/rules', {
        method: 'POST',
        body: JSON.stringify(rule)
      });
      
      if (response.success) {
        // Add to local rules list
        this.rules.push(rule);
        
        // Add to active rules if applicable
        if (rule.active) {
          this.activeRules.push(rule);
        }
        
        return { success: true, rule };
      } else {
        throw new Error(response.message || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Failed to add rule:', error);
      this.emitEvent('error', { message: 'Failed to add rule', error });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update an existing rule
   */
  async updateRule(ruleId, updates) {
    try {
      // Find the rule
      const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
      
      if (ruleIndex === -1) {
        throw new Error(`Rule with ID ${ruleId} not found`);
      }
      
      // Create updated rule
      const updatedRule = { ...this.rules[ruleIndex], ...updates };
      
      // Validate updated rule
      if (!this.validateRule(updatedRule)) {
        throw new Error('Invalid rule structure after update');
      }
      
      // Save to server
      const response = await this.api.request(`/automation/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRule)
      });
      
      if (response.success) {
        // Update local rules list
        this.rules[ruleIndex] = updatedRule;
        
        // Update active rules list
        const activeIndex = this.activeRules.findIndex(rule => rule.id === ruleId);
        
        if (updatedRule.active) {
          if (activeIndex === -1) {
            this.activeRules.push(updatedRule);
          } else {
            this.activeRules[activeIndex] = updatedRule;
          }
        } else if (activeIndex !== -1) {
          this.activeRules.splice(activeIndex, 1);
        }
        
        return { success: true, rule: updatedRule };
      } else {
        throw new Error(response.message || 'Failed to update rule');
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
      this.emitEvent('error', { message: 'Failed to update rule', error });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete a rule
   */
  async deleteRule(ruleId) {
    try {
      // Save to server
      const response = await this.api.request(`/automation/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Remove from local rules list
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        
        // Remove from active rules list
        this.activeRules = this.activeRules.filter(rule => rule.id !== ruleId);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      this.emitEvent('error', { message: 'Failed to delete rule', error });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Validate rule structure
   */
  validateRule(rule) {
    // Basic validation
    if (!rule) return false;
    
    // Must have a name
    if (!rule.name) return false;
    
    // Must have conditions array
    if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) return false;
    
    // Must have actions array
    if (!Array.isArray(rule.actions) || rule.actions.length === 0) return false;
    
    // Validate each condition has required fields
    for (const condition of rule.conditions) {
      if (!condition.type || !condition.operator) return false;
    }
    
    // Validate each action has required fields
    for (const action of rule.actions) {
      if (!action.type) return false;
    }
    
    return true;
  }
  
  /**
   * Get execution history for a specific rule or all rules
   */
  getExecutionHistory(ruleId = null) {
    if (ruleId) {
      return this.executionHistory.filter(item => item.ruleId === ruleId);
    }
    
    return this.executionHistory;
  }
  
  /**
   * Add an event listener
   */
  addEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(callback);
      return true;
    }
    return false;
  }
  
  /**
   * Remove an event listener
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(
        cb => cb !== callback
      );
      return true;
    }
    return false;
  }
  
  /**
   * Emit an event to all registered listeners
   */
  emitEvent(eventType, data) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} event listener:`, error);
        }
      });
    }
  }
  
  /**
   * Update configuration settings
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Handle changes that require special handling
    if (this.config.automaticEvaluation !== oldConfig.automaticEvaluation) {
      if (this.config.automaticEvaluation) {
        this.startAutomaticEvaluation();
      } else {
        this.stopAutomaticEvaluation();
      }
    } else if (this.config.evaluationInterval !== oldConfig.evaluationInterval && this.config.automaticEvaluation) {
      // Restart with new interval
      this.startAutomaticEvaluation();
    }
    
    return this.config;
  }
}

// Make available globally
window.AutomationCore = AutomationCore;
