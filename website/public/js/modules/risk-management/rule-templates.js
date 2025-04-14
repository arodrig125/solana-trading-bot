/**
 * SolarBot Risk Automation Rule Templates
 * Pre-configured automation rules for common risk management scenarios
 */

class RuleTemplates {
  // Singleton pattern
  static instance = null;
  
  constructor() {
    if (RuleTemplates.instance) {
      return RuleTemplates.instance;
    }
    
    RuleTemplates.instance = this;
    
    // Available rule templates
    this.templates = {
      'daily-loss-protection': this.getDailyLossProtectionTemplate(),
      'volatility-adjustment': this.getVolatilityAdjustmentTemplate(),
      'winning-streak': this.getWinningStreakTemplate(),
      'drawdown-defense': this.getDrawdownDefenseTemplate()
    };
  }
  
  /**
   * Get a rule template by ID
   * @param {string} templateId - The ID of the template to get
   * @returns {Object} The rule template object
   */
  getTemplate(templateId) {
    if (!this.templates[templateId]) {
      console.error(`Template with ID ${templateId} not found`);
      return null;
    }
    
    // Clone the template to prevent modifications to original
    return JSON.parse(JSON.stringify(this.templates[templateId]));
  }
  
  /**
   * Daily Loss Protection Template
   * Reduces position size when daily losses exceed threshold
   */
  getDailyLossProtectionTemplate() {
    return {
      name: 'Daily Loss Protection',
      description: 'Automatically reduces position size when daily losses exceed threshold',
      active: true,
      priority: 1, // High priority
      conditions: [
        {
          type: 'dailyLoss',
          parameter: 'percentage',
          operator: 'greaterThan',
          value: 2.5
        }
      ],
      actions: [
        {
          type: 'adjustPositionSize',
          parameter: 'percentage',
          value: -50, // Reduce by 50%
          pairs: 'all'
        },
        {
          type: 'sendAlert',
          message: 'Daily loss threshold exceeded. Position sizes reduced by 50%.',
          type: 'warning'
        }
      ],
      executionLimit: {
        type: 'daily',
        limit: 1
      }
    };
  }
  
  /**
   * Volatility Adjustment Template
   * Adjusts position sizes based on market volatility
   */
  getVolatilityAdjustmentTemplate() {
    return {
      name: 'Volatility Adjustment',
      description: 'Adjusts position sizes based on market volatility',
      active: true,
      priority: 2, // Medium priority
      conditions: [
        {
          type: 'or',
          conditions: [
            {
              type: 'marketVolatility',
              operator: 'greaterThan',
              value: 3.0, // 3% volatility
              pair: 'SOL/USD',
              timeframe: '1h'
            },
            {
              type: 'marketVolatility',
              operator: 'lessThan',
              value: 0.8, // 0.8% volatility
              pair: 'SOL/USD',
              timeframe: '1h'
            }
          ]
        }
      ],
      actions: [
        {
          type: 'applyVolatilityBasedSizing',
          volatilityMultiplier: 0.7, // Inverse relation: higher volatility = smaller positions
          pairs: 'all'
        },
        {
          type: 'sendAlert',
          message: 'Position sizing adjusted based on current market volatility.',
          type: 'info'
        }
      ],
      executionLimit: {
        type: 'hourly',
        limit: 2
      }
    };
  }
  
  /**
   * Winning Streak Template
   * Gradually increases position size during winning streaks
   */
  getWinningStreakTemplate() {
    return {
      name: 'Winning Streak Optimizer',
      description: 'Gradually increases position size during winning streaks',
      active: true,
      priority: 3, // Low priority
      conditions: [
        {
          type: 'winStreak',
          operator: 'greaterThanOrEqual',
          value: 3 // Three or more consecutive wins
        }
      ],
      actions: [
        {
          type: 'adjustPositionSize',
          parameter: 'percentage',
          value: 20, // Increase by 20%
          pairs: 'all'
        },
        {
          type: 'sendAlert',
          message: 'Winning streak detected! Position sizes increased by 20%.',
          type: 'success'
        }
      ],
      executionLimit: {
        type: 'total',
        limit: 3 // Maximum 3 increases in a row
      }
    };
  }
  
  /**
   * Drawdown Defense Template
   * Reduces risk exposure during significant drawdowns
   */
  getDrawdownDefenseTemplate() {
    return {
      name: 'Drawdown Defense',
      description: 'Reduces risk exposure during significant drawdowns',
      active: true,
      priority: 1, // High priority
      conditions: [
        {
          type: 'drawdown',
          operator: 'greaterThan',
          value: 15 // 15% drawdown
        }
      ],
      actions: [
        {
          type: 'switchToDefensiveMode',
        },
        {
          type: 'reduceExposure',
          percentage: 40, // Reduce exposure by 40%
          pairs: 'all'
        },
        {
          type: 'sendEmail',
          subject: 'SolarBot Drawdown Alert',
          message: 'Your account has entered protective mode due to a significant drawdown. Risk exposure has been reduced and defensive trading mode enabled.'
        }
      ],
      executionLimit: {
        type: 'daily',
        limit: 1
      }
    };
  }
  
  /**
   * Apply a template to create a new rule
   * @param {string} templateId - The ID of the template to apply
   * @returns {Object} The created rule or null if template not found
   */
  applyTemplate(templateId) {
    const template = this.getTemplate(templateId);
    
    if (!template) return null;
    
    // Generate a unique ID for the new rule
    const ruleId = 'rule_' + Date.now();
    
    // Create a new rule from the template
    const rule = {
      ...template,
      id: ruleId,
      createdAt: new Date().toISOString(),
      lastTriggered: null
    };
    
    // Add the rule via the automation core
    if (window.AutomationCore) {
      const automationCore = new AutomationCore();
      
      // Add the rule (will handle saving to server)
      return automationCore.addRule(rule);
    }
    
    return { success: false, error: 'Automation core not available' };
  }
}

// Create singleton instance
window.RuleTemplates = new RuleTemplates();

/**
 * Initialize template functionality when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Handle template card clicks
  const templateCards = document.querySelectorAll('.template-card');
  
  templateCards.forEach(card => {
    const templateId = card.dataset.template;
    const useTemplateBtn = card.querySelector('.use-template-btn');
    
    if (useTemplateBtn) {
      useTemplateBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Apply the template
        if (window.RuleTemplates) {
          window.RuleTemplates.applyTemplate(templateId)
            .then(result => {
              if (result && result.success) {
                // Show success message
                const alertEvent = new CustomEvent('solarbot-alert', {
                  detail: {
                    message: `${result.rule.name} rule created successfully!`,
                    type: 'success',
                    duration: 3000
                  }
                });
                
                window.dispatchEvent(alertEvent);
                
                // Refresh the rules list if available
                if (window.RuleBuilder && typeof window.RuleBuilder.loadRules === 'function') {
                  window.RuleBuilder.loadRules();
                }
              } else {
                // Show error message
                const alertEvent = new CustomEvent('solarbot-alert', {
                  detail: {
                    message: `Failed to create rule: ${result ? result.error : 'Unknown error'}`,
                    type: 'error',
                    duration: 5000
                  }
                });
                
                window.dispatchEvent(alertEvent);
              }
            })
            .catch(error => {
              console.error('Error applying template:', error);
              
              // Show error message
              const alertEvent = new CustomEvent('solarbot-alert', {
                detail: {
                  message: `Error creating rule: ${error.message || 'Unknown error'}`,
                  type: 'error',
                  duration: 5000
                }
              });
              
              window.dispatchEvent(alertEvent);
            });
        }
      });
    }
    
    // Also handle click on the entire card
    card.addEventListener('click', () => {
      // Open rule modal with template data pre-filled
      if (window.RuleBuilder && typeof window.RuleBuilder.createRuleFromTemplate === 'function') {
        window.RuleBuilder.createRuleFromTemplate(templateId);
      }
    });
  });
});
