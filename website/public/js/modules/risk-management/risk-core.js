/**
 * SolarBot Risk Management Core
 * Foundation for risk management and position sizing
 */

class RiskManagementCore {
  constructor() {
    this.api = window.solarbotApi;
    this.accountData = null;
    this.preferences = {
      defaultRiskPerTrade: 1.0, // 1% of account balance as default risk
      maxPositionSize: 20,      // Maximum position size as percentage of account
      stopLossDefault: 5,       // Default stop loss percentage
      takeProfit: 10,           // Default take profit percentage
      maxDailyRisk: 5,          // Maximum daily risk as percentage of account
      maxWeeklyRisk: 15,        // Maximum weekly risk as percentage of account
      pairRiskMultipliers: {},  // Custom risk multipliers for specific pairs
      activeRiskProfile: 'moderate' // Default risk profile
    };
    
    // Risk profiles
    this.riskProfiles = {
      conservative: {
        defaultRiskPerTrade: 0.5,
        maxPositionSize: 10,
        stopLossDefault: 3,
        takeProfit: 6,
        maxDailyRisk: 2,
        maxWeeklyRisk: 5
      },
      moderate: {
        defaultRiskPerTrade: 1.0,
        maxPositionSize: 20,
        stopLossDefault: 5,
        takeProfit: 10,
        maxDailyRisk: 5,
        maxWeeklyRisk: 15
      },
      aggressive: {
        defaultRiskPerTrade: 2.0,
        maxPositionSize: 30,
        stopLossDefault: 8,
        takeProfit: 16,
        maxDailyRisk: 10,
        maxWeeklyRisk: 25
      }
    };
  }
  
  /**
   * Initialize risk management with user account data and preferences
   */
  async initialize() {
    try {
      // Load account data
      await this.loadAccountData();
      
      // Load user preferences
      await this.loadUserPreferences();
      
      return {
        success: true,
        accountData: this.accountData,
        preferences: this.preferences
      };
    } catch (error) {
      console.error('Failed to initialize risk management:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Load account data including balance, open positions, and trading history
   */
  async loadAccountData() {
    try {
      const response = await this.api.request('/account/data');
      this.accountData = response.data;
      return this.accountData;
    } catch (error) {
      console.error('Failed to load account data:', error);
      throw error;
    }
  }
  
  /**
   * Load user risk management preferences
   */
  async loadUserPreferences() {
    try {
      const response = await this.api.request('/risk-management/preferences');
      
      if (response.preferences) {
        // Merge saved preferences with defaults
        this.preferences = {
          ...this.preferences,
          ...response.preferences
        };
        
        // Apply active risk profile
        this.applyRiskProfile(this.preferences.activeRiskProfile);
      }
      
      return this.preferences;
    } catch (error) {
      console.error('Failed to load risk preferences:', error);
      // Continue with default preferences if load fails
      console.log('Using default risk preferences');
      return this.preferences;
    }
  }
  
  /**
   * Save user risk management preferences
   */
  async saveUserPreferences() {
    try {
      const response = await this.api.request('/risk-management/preferences', {
        method: 'POST',
        body: JSON.stringify({
          preferences: this.preferences
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to save risk preferences:', error);
      throw error;
    }
  }
  
  /**
   * Apply a predefined risk profile
   * @param {string} profileName - Name of the risk profile to apply
   */
  applyRiskProfile(profileName) {
    if (!this.riskProfiles[profileName]) {
      console.warn(`Risk profile ${profileName} not found. Using current settings.`);
      return false;
    }
    
    const profile = this.riskProfiles[profileName];
    
    // Update preferences with profile values
    Object.keys(profile).forEach(key => {
      this.preferences[key] = profile[key];
    });
    
    // Set active profile name
    this.preferences.activeRiskProfile = profileName;
    
    return true;
  }
  
  /**
   * Calculate position size based on account balance, risk percentage, and stop loss
   * 
   * @param {Object} params - Position sizing parameters
   * @param {string} params.pair - Trading pair e.g. 'SOL/USDT'
   * @param {number} params.entryPrice - Entry price for the trade
   * @param {number} params.stopLossPrice - Stop loss price for the trade
   * @param {number} params.riskPercentage - Percentage of account to risk (optional)
   * @param {number} params.accountBalance - Account balance to use (optional)
   * @returns {Object} Position sizing details
   */
  calculatePositionSize(params) {
    const {
      pair,
      entryPrice,
      stopLossPrice,
      riskPercentage = this.preferences.defaultRiskPerTrade,
      accountBalance = this.accountData?.balance || 0
    } = params;
    
    // Validate inputs
    if (!entryPrice || !stopLossPrice || !accountBalance) {
      throw new Error('Invalid parameters for position sizing calculation');
    }
    
    // Determine if this is a long or short position
    const isLong = entryPrice > stopLossPrice;
    
    // Calculate risk per trade in currency
    const riskAmount = (accountBalance * riskPercentage) / 100;
    
    // Calculate position size based on risk and stop distance
    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    const stopDistancePercentage = (stopDistance / entryPrice) * 100;
    
    // Apply pair-specific risk multiplier if exists
    const riskMultiplier = this.preferences.pairRiskMultipliers[pair] || 1.0;
    const adjustedRiskAmount = riskAmount * riskMultiplier;
    
    // Position size calculation
    let positionSize = adjustedRiskAmount / stopDistancePercentage * 100;
    
    // Check if position size exceeds maximum allowed
    const maxPositionAmount = (accountBalance * this.preferences.maxPositionSize) / 100;
    if (positionSize > maxPositionAmount) {
      positionSize = maxPositionAmount;
    }
    
    // Calculate position size in base currency (e.g., SOL quantity)
    const baseQuantity = positionSize / entryPrice;
    
    // Calculate actual risk percentage with the adjusted position size
    const actualRiskPercentage = (positionSize * stopDistancePercentage / 100) / accountBalance * 100;
    
    return {
      pair,
      positionType: isLong ? 'long' : 'short',
      accountBalance,
      riskPercentage,
      riskAmount,
      adjustedRiskAmount,
      riskMultiplier,
      stopDistancePercentage,
      positionSize,
      baseQuantity,
      actualRiskPercentage,
      entryPrice,
      stopLossPrice,
      maxPositionSize: maxPositionAmount
    };
  }
  
  /**
   * Calculate stop loss price based on entry price, position type, and risk percentage
   * 
   * @param {Object} params - Stop loss parameters
   * @param {string} params.pair - Trading pair
   * @param {number} params.entryPrice - Entry price
   * @param {string} params.positionType - 'long' or 'short'
   * @param {number} params.stopLossPercentage - Stop loss as percentage from entry (optional)
   * @returns {number} Stop loss price
   */
  calculateStopLossPrice(params) {
    const {
      pair,
      entryPrice,
      positionType,
      stopLossPercentage = this.preferences.stopLossDefault
    } = params;
    
    // Validate inputs
    if (!entryPrice || !positionType) {
      throw new Error('Invalid parameters for stop loss calculation');
    }
    
    // Apply pair-specific risk multiplier if exists
    const riskMultiplier = this.preferences.pairRiskMultipliers[pair] || 1.0;
    const adjustedStopPercentage = stopLossPercentage * riskMultiplier;
    
    // Calculate stop loss price based on position type
    if (positionType === 'long') {
      return entryPrice * (1 - adjustedStopPercentage / 100);
    } else {
      return entryPrice * (1 + adjustedStopPercentage / 100);
    }
  }
  
  /**
   * Calculate take profit price based on entry price, position type, and profit target
   * 
   * @param {Object} params - Take profit parameters
   * @param {number} params.entryPrice - Entry price
   * @param {string} params.positionType - 'long' or 'short'
   * @param {number} params.takeProfitPercentage - Take profit as percentage from entry (optional)
   * @returns {number} Take profit price
   */
  calculateTakeProfitPrice(params) {
    const {
      entryPrice,
      positionType,
      takeProfitPercentage = this.preferences.takeProfit
    } = params;
    
    // Validate inputs
    if (!entryPrice || !positionType) {
      throw new Error('Invalid parameters for take profit calculation');
    }
    
    // Calculate take profit price based on position type
    if (positionType === 'long') {
      return entryPrice * (1 + takeProfitPercentage / 100);
    } else {
      return entryPrice * (1 - takeProfitPercentage / 100);
    }
  }
  
  /**
   * Check if a new trade would exceed daily risk limits
   * 
   * @param {Object} params - Risk check parameters
   * @param {number} params.riskAmount - Amount at risk in the new trade
   * @returns {Object} Risk check result
   */
  checkDailyRiskLimit(params) {
    const { riskAmount } = params;
    
    // Get current date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Sum up risk from trades today
    const todayTrades = this.accountData?.tradingHistory?.filter(trade => 
      trade.timestamp.startsWith(today)
    ) || [];
    
    const dailyRiskUsed = todayTrades.reduce((total, trade) => {
      return total + (trade.riskAmount || 0);
    }, 0);
    
    // Calculate total with new trade
    const totalRiskAmount = dailyRiskUsed + riskAmount;
    
    // Check against daily limit
    const dailyRiskLimit = (this.accountData?.balance || 0) * (this.preferences.maxDailyRisk / 100);
    const withinLimit = totalRiskAmount <= dailyRiskLimit;
    
    return {
      withinLimit,
      dailyRiskUsed,
      totalRiskAmount,
      dailyRiskLimit,
      remainingRisk: dailyRiskLimit - totalRiskAmount
    };
  }
  
  /**
   * Evaluate a trade against risk management rules
   * 
   * @param {Object} tradeParams - Trade parameters
   * @returns {Object} Trade evaluation results
   */
  evaluateTrade(tradeParams) {
    try {
      const {
        pair,
        entryPrice,
        stopLossPrice,
        positionType,
        riskPercentage = this.preferences.defaultRiskPerTrade
      } = tradeParams;
      
      // Calculate position size
      const positionSizing = this.calculatePositionSize({
        pair,
        entryPrice,
        stopLossPrice,
        riskPercentage
      });
      
      // Calculate take profit
      const takeProfitPrice = this.calculateTakeProfitPrice({
        entryPrice,
        positionType
      });
      
      // Check daily risk limit
      const riskLimitCheck = this.checkDailyRiskLimit({
        riskAmount: positionSizing.adjustedRiskAmount
      });
      
      // Calculate risk-reward ratio
      const stopDistance = Math.abs(entryPrice - stopLossPrice);
      const targetDistance = Math.abs(entryPrice - takeProfitPrice);
      const riskRewardRatio = targetDistance / stopDistance;
      
      return {
        success: true,
        positionSizing,
        takeProfitPrice,
        riskLimitCheck,
        riskRewardRatio,
        recommendation: {
          proceed: riskLimitCheck.withinLimit && riskRewardRatio >= 1.5,
          reason: !riskLimitCheck.withinLimit 
            ? 'Daily risk limit would be exceeded' 
            : riskRewardRatio < 1.5 
              ? 'Risk-reward ratio is below recommended minimum (1.5)' 
              : 'Trade meets risk management criteria'
        }
      };
    } catch (error) {
      console.error('Trade evaluation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Make available globally
window.RiskManagementCore = RiskManagementCore;
