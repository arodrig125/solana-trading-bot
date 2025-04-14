/**
 * SolarBot Risk Automation Action Executor
 * Executes different types of actions when automation rules are triggered
 */

class ActionExecutor {
  // Singleton pattern
  static instance = null;
  
  constructor() {
    if (ActionExecutor.instance) {
      return ActionExecutor.instance;
    }
    
    ActionExecutor.instance = this;
    
    this.api = window.solarbotApi;
    this.riskCore = new RiskManagementCore();
    
    // Available action types and their execution functions
    this.actionTypes = {
      // Position sizing actions
      'adjustPositionSize': this.executeAdjustPositionSize.bind(this),
      'setFixedPositionSize': this.executeSetFixedPositionSize.bind(this),
      'applyVolatilityBasedSizing': this.executeApplyVolatilityBasedSizing.bind(this),
      
      // Risk parameter actions
      'adjustRiskPercentage': this.executeAdjustRiskPercentage.bind(this),
      'adjustStopLossDistance': this.executeAdjustStopLossDistance.bind(this),
      'adjustTakeProfitRatio': this.executeAdjustTakeProfitRatio.bind(this),
      'enableTrailingStop': this.executeEnableTrailingStop.bind(this),
      
      // Trading mode actions
      'pauseTrading': this.executePauseTrading.bind(this),
      'resumeTrading': this.executeResumeTrading.bind(this),
      'switchToDefensiveMode': this.executeSwitchToDefensiveMode.bind(this),
      'switchToAggressiveMode': this.executeSwitchToAggressiveMode.bind(this),
      
      // Portfolio actions
      'rebalancePortfolio': this.executeRebalancePortfolio.bind(this),
      'reduceExposure': this.executeReduceExposure.bind(this),
      'increaseExposure': this.executeIncreaseExposure.bind(this),
      'closeSpecificPositions': this.executeCloseSpecificPositions.bind(this),
      
      // Notification actions
      'sendAlert': this.executeSendAlert.bind(this),
      'sendEmail': this.executeSendEmail.bind(this),
      'sendTelegramMessage': this.executeSendTelegramMessage.bind(this),
      
      // Compound actions
      'executeMultipleActions': this.executeMultipleActions.bind(this)
    };
  }
  
  /**
   * Execute a list of actions
   * @param {Array} actions - List of action objects
   * @param {Object} context - Execution context with market and account data
   * @returns {Object} Result of execution
   */
  async executeActions(actions, context) {
    if (!actions || actions.length === 0) {
      return { success: false, error: 'No actions provided' };
    }
    
    const results = [];
    let allSuccessful = true;
    
    // Execute each action in sequence
    for (const action of actions) {
      try {
        const result = await this.executeAction(action, context);
        results.push(result);
        
        if (!result.success) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error('Action execution error:', error);
        results.push({
          actionType: action.type,
          success: false,
          error: error.message
        });
        allSuccessful = false;
      }
    }
    
    return {
      success: allSuccessful,
      results: results
    };
  }
  
  /**
   * Execute a single action
   */
  async executeAction(action, context) {
    const { type } = action;
    
    // Handle unknown action type
    if (!this.actionTypes[type]) {
      console.warn(`Unknown action type: ${type}`);
      return {
        actionType: type,
        success: false,
        error: `Unknown action type: ${type}`
      };
    }
    
    try {
      // Call the appropriate action executor
      const result = await this.actionTypes[type](action, context);
      
      return {
        actionType: type,
        success: true,
        ...result
      };
    } catch (error) {
      console.error(`Error executing ${type} action:`, error);
      return {
        actionType: type,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Adjust position size by a percentage
   */
  async executeAdjustPositionSize(action, context) {
    const { parameter, value, pairs } = action;
    
    // Validate parameters
    if (parameter !== 'percentage' || typeof value !== 'number') {
      throw new Error('Invalid parameters for adjustPositionSize');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to adjust position sizing
    const response = await this.api.request('/risk/position-size', {
      method: 'POST',
      body: JSON.stringify({
        action: 'adjust',
        parameter: 'percentage',
        value: value,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      const adjustmentFactor = 1 + (value / 100);
      
      // Update risk core's position sizing parameters
      if (this.riskCore.positionSizingSettings) {
        this.riskCore.positionSizingSettings.defaultSize *= adjustmentFactor;
      }
    }
    
    return response;
  }
  
  /**
   * Set a fixed position size
   */
  async executeSetFixedPositionSize(action, context) {
    const { value, unit, pairs } = action;
    
    // Validate parameters
    if (typeof value !== 'number') {
      throw new Error('Invalid parameters for setFixedPositionSize');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to set fixed position sizing
    const response = await this.api.request('/risk/position-size', {
      method: 'POST',
      body: JSON.stringify({
        action: 'set',
        unit: unit || 'percentage', // 'percentage' or 'absolute'
        value: value,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      // Update risk core's position sizing parameters
      if (this.riskCore.positionSizingSettings) {
        if (unit === 'absolute') {
          this.riskCore.positionSizingSettings.fixedSize = value;
          this.riskCore.positionSizingSettings.useDynamicSizing = false;
        } else {
          this.riskCore.positionSizingSettings.defaultSize = value;
          this.riskCore.positionSizingSettings.useDynamicSizing = true;
        }
      }
    }
    
    return response;
  }
  
  /**
   * Apply volatility-based position sizing
   */
  async executeApplyVolatilityBasedSizing(action, context) {
    const { volatilityMultiplier, pairs } = action;
    
    // Validate parameters
    if (typeof volatilityMultiplier !== 'number') {
      throw new Error('Invalid parameters for applyVolatilityBasedSizing');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to apply volatility-based sizing
    const response = await this.api.request('/risk/position-size', {
      method: 'POST',
      body: JSON.stringify({
        action: 'volatility-based',
        volatilityMultiplier: volatilityMultiplier,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      // Update risk core's position sizing parameters
      if (this.riskCore.positionSizingSettings) {
        this.riskCore.positionSizingSettings.useVolatilityAdjustment = true;
        this.riskCore.positionSizingSettings.volatilityMultiplier = volatilityMultiplier;
      }
    }
    
    return response;
  }
  
  /**
   * Adjust risk percentage
   */
  async executeAdjustRiskPercentage(action, context) {
    const { parameter, value } = action;
    
    // Validate parameters
    if (parameter !== 'absolute' && parameter !== 'relative') {
      throw new Error('Invalid parameter for adjustRiskPercentage');
    }
    
    if (typeof value !== 'number') {
      throw new Error('Invalid value for adjustRiskPercentage');
    }
    
    let newValue;
    if (parameter === 'absolute') {
      newValue = value;
    } else { // relative adjustment
      const currentRisk = this.riskCore.riskSettings?.riskPercentage || 1;
      newValue = currentRisk * (1 + value / 100);
    }
    
    // Send request to adjust risk percentage
    const response = await this.api.request('/risk/parameters', {
      method: 'POST',
      body: JSON.stringify({
        action: 'set',
        parameter: 'riskPercentage',
        value: newValue
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.riskSettings) {
        this.riskCore.riskSettings.riskPercentage = newValue;
      }
    }
    
    return response;
  }
  
  /**
   * Adjust stop-loss distance
   */
  async executeAdjustStopLossDistance(action, context) {
    const { parameter, value, pairs } = action;
    
    // Validate parameters
    if (parameter !== 'percentage' || typeof value !== 'number') {
      throw new Error('Invalid parameters for adjustStopLossDistance');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to adjust stop-loss distance
    const response = await this.api.request('/risk/stop-loss', {
      method: 'POST',
      body: JSON.stringify({
        action: 'adjust-distance',
        percentage: value,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.stopLossSettings) {
        this.riskCore.stopLossSettings.defaultDistance = 
          this.riskCore.stopLossSettings.defaultDistance * (1 + value / 100);
      }
    }
    
    return response;
  }
  
  /**
   * Adjust take-profit ratio
   */
  async executeAdjustTakeProfitRatio(action, context) {
    const { parameter, value, pairs } = action;
    
    // Validate parameters
    if (parameter !== 'absolute' && parameter !== 'relative') {
      throw new Error('Invalid parameter for adjustTakeProfitRatio');
    }
    
    if (typeof value !== 'number') {
      throw new Error('Invalid value for adjustTakeProfitRatio');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    let newValue;
    if (parameter === 'absolute') {
      newValue = value;
    } else { // relative adjustment
      const currentRatio = this.riskCore.takeProfitSettings?.riskRewardRatio || 2;
      newValue = currentRatio * (1 + value / 100);
    }
    
    // Send request to adjust take-profit ratio
    const response = await this.api.request('/risk/take-profit', {
      method: 'POST',
      body: JSON.stringify({
        action: 'set-ratio',
        ratio: newValue,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.takeProfitSettings) {
        this.riskCore.takeProfitSettings.riskRewardRatio = newValue;
      }
    }
    
    return response;
  }
  
  /**
   * Enable trailing stop
   */
  async executeEnableTrailingStop(action, context) {
    const { activationPercentage, trailPercentage, pairs } = action;
    
    // Validate parameters
    if (typeof activationPercentage !== 'number' || typeof trailPercentage !== 'number') {
      throw new Error('Invalid parameters for enableTrailingStop');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to enable trailing stop
    const response = await this.api.request('/risk/trailing-stop', {
      method: 'POST',
      body: JSON.stringify({
        action: 'enable',
        activationPercentage: activationPercentage,
        trailPercentage: trailPercentage,
        pairs: targetPairs
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.stopLossSettings) {
        this.riskCore.stopLossSettings.useTrailingStop = true;
        this.riskCore.stopLossSettings.trailingActivation = activationPercentage;
        this.riskCore.stopLossSettings.trailingDistance = trailPercentage;
      }
    }
    
    return response;
  }
  
  /**
   * Pause trading
   */
  async executePauseTrading(action, context) {
    const { duration, reason } = action;
    
    // Send request to pause trading
    const response = await this.api.request('/trading/control', {
      method: 'POST',
      body: JSON.stringify({
        action: 'pause',
        duration: duration || null, // null means indefinite
        reason: reason || 'Risk automation rule triggered'
      })
    });
    
    return response;
  }
  
  /**
   * Resume trading
   */
  async executeResumeTrading(action, context) {
    // Send request to resume trading
    const response = await this.api.request('/trading/control', {
      method: 'POST',
      body: JSON.stringify({
        action: 'resume'
      })
    });
    
    return response;
  }
  
  /**
   * Switch to defensive trading mode
   */
  async executeSwitchToDefensiveMode(action, context) {
    // Send request to switch to defensive mode
    const response = await this.api.request('/trading/mode', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'defensive'
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.riskSettings) {
        this.riskCore.riskSettings.riskProfile = 'conservative';
        this.riskCore.updateRiskParameters('conservative');
      }
    }
    
    return response;
  }
  
  /**
   * Switch to aggressive trading mode
   */
  async executeSwitchToAggressiveMode(action, context) {
    // Send request to switch to aggressive mode
    const response = await this.api.request('/trading/mode', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'aggressive'
      })
    });
    
    // Update local risk parameters
    if (response.success) {
      if (this.riskCore.riskSettings) {
        this.riskCore.riskSettings.riskProfile = 'aggressive';
        this.riskCore.updateRiskParameters('aggressive');
      }
    }
    
    return response;
  }
  
  /**
   * Rebalance portfolio to target allocations
   */
  async executeRebalancePortfolio(action, context) {
    const { targetAllocations } = action;
    
    // Send request to rebalance portfolio
    const response = await this.api.request('/portfolio/rebalance', {
      method: 'POST',
      body: JSON.stringify({
        targetAllocations: targetAllocations || null // null means use default allocations
      })
    });
    
    return response;
  }
  
  /**
   * Reduce exposure across the portfolio
   */
  async executeReduceExposure(action, context) {
    const { percentage, pairs } = action;
    
    // Validate parameters
    if (typeof percentage !== 'number') {
      throw new Error('Invalid percentage for reduceExposure');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to reduce exposure
    const response = await this.api.request('/portfolio/exposure', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reduce',
        percentage: percentage,
        pairs: targetPairs
      })
    });
    
    return response;
  }
  
  /**
   * Increase exposure across the portfolio
   */
  async executeIncreaseExposure(action, context) {
    const { percentage, pairs } = action;
    
    // Validate parameters
    if (typeof percentage !== 'number') {
      throw new Error('Invalid percentage for increaseExposure');
    }
    
    // Apply to all pairs if not specified
    const targetPairs = pairs || 'all';
    
    // Send request to increase exposure
    const response = await this.api.request('/portfolio/exposure', {
      method: 'POST',
      body: JSON.stringify({
        action: 'increase',
        percentage: percentage,
        pairs: targetPairs
      })
    });
    
    return response;
  }
  
  /**
   * Close specific positions
   */
  async executeCloseSpecificPositions(action, context) {
    const { pairs, olderThan, pnlBelow, pnlAbove } = action;
    
    // Validate parameters - must have at least one filter
    if (!pairs && !olderThan && pnlBelow === undefined && pnlAbove === undefined) {
      throw new Error('Must specify at least one filter for closeSpecificPositions');
    }
    
    // Send request to close positions
    const response = await this.api.request('/trading/close-positions', {
      method: 'POST',
      body: JSON.stringify({
        pairs: pairs || null,
        olderThan: olderThan || null, // in hours
        pnlBelow: pnlBelow,
        pnlAbove: pnlAbove
      })
    });
    
    return response;
  }
  
  /**
   * Send an alert to the user interface
   */
  async executeSendAlert(action, context) {
    const { message, type, duration } = action;
    
    // Validate parameters
    if (!message) {
      throw new Error('Message is required for sendAlert');
    }
    
    // Create and dispatch alert event
    const alertEvent = new CustomEvent('solarbot-alert', {
      detail: {
        message: message,
        type: type || 'info', // 'info', 'warning', 'error', 'success'
        duration: duration || 5000 // milliseconds
      }
    });
    
    window.dispatchEvent(alertEvent);
    
    return { message };
  }
  
  /**
   * Send an email notification
   */
  async executeSendEmail(action, context) {
    const { subject, message } = action;
    
    // Validate parameters
    if (!subject || !message) {
      throw new Error('Subject and message are required for sendEmail');
    }
    
    // Send request to email notification endpoint
    const response = await this.api.request('/notifications/email', {
      method: 'POST',
      body: JSON.stringify({
        subject: subject,
        message: message
      })
    });
    
    return response;
  }
  
  /**
   * Send a Telegram message
   */
  async executeSendTelegramMessage(action, context) {
    const { message } = action;
    
    // Validate parameters
    if (!message) {
      throw new Error('Message is required for sendTelegramMessage');
    }
    
    // Send request to Telegram notification endpoint
    const response = await this.api.request('/notifications/telegram', {
      method: 'POST',
      body: JSON.stringify({
        message: message
      })
    });
    
    return response;
  }
  
  /**
   * Execute multiple actions as a batch
   */
  async executeMultipleActions(action, context) {
    const { actions } = action;
    
    // Validate parameters
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Actions array is required for executeMultipleActions');
    }
    
    // Execute each sub-action
    return await this.executeActions(actions, context);
  }
}

// Create singleton instance
window.ActionExecutor = new ActionExecutor();
