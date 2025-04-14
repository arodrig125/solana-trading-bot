/**
 * SolarBot Position Sizing Calculator
 * UI component for calculating optimal position sizes based on risk parameters
 */

class PositionSizingCalculator {
  constructor() {
    this.riskCore = new RiskManagementCore();
    this.initialized = false;
    
    // DOM elements
    this.container = document.getElementById('position-sizing-calculator');
    
    // Current state
    this.calculationResult = null;
    
    // Initialize the calculator
    this.initialize();
  }
  
  /**
   * Initialize the position sizing calculator
   */
  async initialize() {
    try {
      if (!this.container) {
        console.error('Position sizing calculator container not found');
        return;
      }
      
      // Initialize risk management core
      await this.riskCore.initialize();
      
      // Render the calculator UI
      this.renderCalculator();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize position sizing calculator:', error);
      this.showError('Failed to initialize calculator. Please try again later.');
    }
  }
  
  /**
   * Render the calculator UI
   */
  renderCalculator() {
    const accountBalance = this.riskCore.accountData?.balance || 0;
    const { defaultRiskPerTrade, stopLossDefault, takeProfit } = this.riskCore.preferences;
    
    const html = `
      <div class="calculator-container">
        <div class="calculator-header">
          <h3>Position Size Calculator</h3>
          <div class="account-balance">
            <span>Account Balance:</span>
            <strong>$${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <button id="refresh-balance" class="btn btn-sm"><i class="fas fa-sync-alt"></i></button>
          </div>
        </div>
        
        <div class="calculator-body">
          <form id="position-size-form">
            <div class="form-row">
              <div class="form-group">
                <label for="trading-pair">Trading Pair</label>
                <input type="text" id="trading-pair" placeholder="e.g. SOL/USDT" required>
              </div>
              
              <div class="form-group">
                <label for="position-type">Position Type</label>
                <select id="position-type" required>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="entry-price">Entry Price</label>
                <input type="number" id="entry-price" placeholder="0.00" min="0" step="any" required>
              </div>
              
              <div class="form-group">
                <label for="risk-percent">Risk (%)</label>
                <input type="number" id="risk-percent" value="${defaultRiskPerTrade}" min="0.1" max="10" step="0.1" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="stop-loss-percent">Stop Loss (%)</label>
                <input type="number" id="stop-loss-percent" value="${stopLossDefault}" min="0.1" max="20" step="0.1">
              </div>
              
              <div class="form-group">
                <label for="stop-loss-price">Stop Loss Price</label>
                <input type="number" id="stop-loss-price" placeholder="0.00" min="0" step="any">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="take-profit-percent">Take Profit (%)</label>
                <input type="number" id="take-profit-percent" value="${takeProfit}" min="0.1" step="0.1">
              </div>
              
              <div class="form-group">
                <label for="take-profit-price">Take Profit Price</label>
                <input type="number" id="take-profit-price" placeholder="0.00" min="0" step="any">
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Calculate</button>
              <button type="button" id="reset-calculator" class="btn">Reset</button>
            </div>
          </form>
          
          <div id="calculation-result" class="calculation-result">
            <!-- Results will be displayed here -->
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  /**
   * Set up event listeners for the calculator
   */
  setupEventListeners() {
    // Form submission
    const form = document.getElementById('position-size-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculatePositionSize();
      });
    }
    
    // Reset button
    const resetButton = document.getElementById('reset-calculator');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetCalculator();
      });
    }
    
    // Refresh balance button
    const refreshButton = document.getElementById('refresh-balance');
    if (refreshButton) {
      refreshButton.addEventListener('click', async () => {
        await this.refreshAccountData();
      });
    }
    
    // Entry price change
    const entryPriceInput = document.getElementById('entry-price');
    if (entryPriceInput) {
      entryPriceInput.addEventListener('input', () => {
        this.updateStopAndTargetPrices();
      });
    }
    
    // Position type change
    const positionTypeSelect = document.getElementById('position-type');
    if (positionTypeSelect) {
      positionTypeSelect.addEventListener('change', () => {
        this.updateStopAndTargetPrices();
      });
    }
    
    // Stop loss percentage change
    const stopLossPercentInput = document.getElementById('stop-loss-percent');
    if (stopLossPercentInput) {
      stopLossPercentInput.addEventListener('input', () => {
        this.updateStopLossPrice();
      });
    }
    
    // Stop loss price change
    const stopLossPriceInput = document.getElementById('stop-loss-price');
    if (stopLossPriceInput) {
      stopLossPriceInput.addEventListener('input', () => {
        this.updateStopLossPercent();
      });
    }
    
    // Take profit percentage change
    const takeProfitPercentInput = document.getElementById('take-profit-percent');
    if (takeProfitPercentInput) {
      takeProfitPercentInput.addEventListener('input', () => {
        this.updateTakeProfitPrice();
      });
    }
    
    // Take profit price change
    const takeProfitPriceInput = document.getElementById('take-profit-price');
    if (takeProfitPriceInput) {
      takeProfitPriceInput.addEventListener('input', () => {
        this.updateTakeProfitPercent();
      });
    }
  }
  
  /**
   * Calculate position size based on form inputs
   */
  calculatePositionSize() {
    try {
      // Get form values
      const pair = document.getElementById('trading-pair').value;
      const positionType = document.getElementById('position-type').value;
      const entryPrice = parseFloat(document.getElementById('entry-price').value);
      const riskPercent = parseFloat(document.getElementById('risk-percent').value);
      const stopLossPrice = parseFloat(document.getElementById('stop-loss-price').value);
      const takeProfitPrice = parseFloat(document.getElementById('take-profit-price').value);
      
      // Validate inputs
      if (!pair || !entryPrice || !stopLossPrice) {
        this.showError('Please fill in all required fields');
        return;
      }
      
      // Check if stop loss is valid based on position type
      if ((positionType === 'long' && stopLossPrice >= entryPrice) || 
          (positionType === 'short' && stopLossPrice <= entryPrice)) {
        this.showError(`Invalid stop loss price for a ${positionType} position`);
        return;
      }
      
      // Evaluate the trade
      const tradeEvaluation = this.riskCore.evaluateTrade({
        pair,
        entryPrice,
        stopLossPrice,
        positionType,
        riskPercentage: riskPercent
      });
      
      // Store calculation result
      this.calculationResult = tradeEvaluation;
      
      // Display result
      this.displayCalculationResult(tradeEvaluation);
      
    } catch (error) {
      console.error('Position size calculation failed:', error);
      this.showError('Calculation failed: ' + error.message);
    }
  }
  
  /**
   * Display the calculation result
   */
  displayCalculationResult(result) {
    const resultContainer = document.getElementById('calculation-result');
    if (!resultContainer) return;
    
    if (!result.success) {
      resultContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>${result.error}</span>
        </div>
      `;
      return;
    }
    
    const { positionSizing, takeProfitPrice, riskLimitCheck, riskRewardRatio, recommendation } = result;
    const { positionSize, baseQuantity, actualRiskPercentage, riskAmount, stopDistancePercentage } = positionSizing;
    
    // Format numbers for display
    const formatCurrency = (value) => {
      return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    const formatPercent = (value) => {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };
    
    const formatNumber = (value) => {
      return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
    };
    
    // Get symbols from pair (e.g., 'SOL' from 'SOL/USDT')
    const baseSymbol = positionSizing.pair.split('/')[0];
    
    // Build HTML
    const html = `
      <div class="result-header">
        <h4>Position Sizing Result</h4>
        <span class="position-type ${positionSizing.positionType}">${positionSizing.positionType.toUpperCase()}</span>
      </div>
      
      <div class="result-main">
        <div class="result-item">
          <span class="item-label">Position Size:</span>
          <span class="item-value highlight">${formatCurrency(positionSize)}</span>
        </div>
        
        <div class="result-item">
          <span class="item-label">Quantity (${baseSymbol}):</span>
          <span class="item-value">${formatNumber(baseQuantity)}</span>
        </div>
        
        <div class="result-item">
          <span class="item-label">Risk Amount:</span>
          <span class="item-value">${formatCurrency(riskAmount)} (${formatPercent(actualRiskPercentage)})</span>
        </div>
        
        <div class="result-item">
          <span class="item-label">Stop Distance:</span>
          <span class="item-value">${formatPercent(stopDistancePercentage)}</span>
        </div>
        
        <div class="result-item">
          <span class="item-label">Risk/Reward Ratio:</span>
          <span class="item-value ${riskRewardRatio >= 1.5 ? 'positive' : 'negative'}">1:${riskRewardRatio.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="result-limits">
        <div class="limit-item ${riskLimitCheck.withinLimit ? 'positive' : 'negative'}">
          <span class="limit-label">Daily Risk Limit:</span>
          <span class="limit-value">
            ${formatCurrency(riskLimitCheck.totalRiskAmount)} / ${formatCurrency(riskLimitCheck.dailyRiskLimit)}
            (${formatPercent(riskLimitCheck.totalRiskAmount / positionSizing.accountBalance * 100)})
          </span>
        </div>
      </div>
      
      <div class="result-recommendation ${recommendation.proceed ? 'positive' : 'negative'}">
        <div class="recommendation-icon">
          <i class="fas ${recommendation.proceed ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        </div>
        <div class="recommendation-details">
          <div class="recommendation-title">${recommendation.proceed ? 'Trade Recommended' : 'Trade Not Recommended'}</div>
          <div class="recommendation-reason">${recommendation.reason}</div>
        </div>
      </div>
      
      <div class="result-actions">
        <button id="save-calculation" class="btn btn-sm">Save</button>
        <button id="share-calculation" class="btn btn-sm">Share</button>
        <button id="apply-to-trade" class="btn btn-primary btn-sm">Apply to Trade</button>
      </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.classList.add('active');
    
    // Add event listeners for result actions
    const saveButton = document.getElementById('save-calculation');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveCalculation();
      });
    }
    
    const shareButton = document.getElementById('share-calculation');
    if (shareButton) {
      shareButton.addEventListener('click', () => {
        this.shareCalculation();
      });
    }
    
    const applyButton = document.getElementById('apply-to-trade');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.applyToTrade();
      });
    }
  }
  
  /**
   * Update stop loss and take profit prices based on entry price and percentages
   */
  updateStopAndTargetPrices() {
    this.updateStopLossPrice();
    this.updateTakeProfitPrice();
  }
  
  /**
   * Update stop loss price based on entry price, position type and stop loss percentage
   */
  updateStopLossPrice() {
    const entryPriceInput = document.getElementById('entry-price');
    const positionTypeSelect = document.getElementById('position-type');
    const stopLossPercentInput = document.getElementById('stop-loss-percent');
    const stopLossPriceInput = document.getElementById('stop-loss-price');
    
    if (!entryPriceInput || !positionTypeSelect || !stopLossPercentInput || !stopLossPriceInput) return;
    
    const entryPrice = parseFloat(entryPriceInput.value);
    const positionType = positionTypeSelect.value;
    const stopLossPercent = parseFloat(stopLossPercentInput.value);
    
    if (isNaN(entryPrice) || isNaN(stopLossPercent)) return;
    
    try {
      const stopLossPrice = this.riskCore.calculateStopLossPrice({
        entryPrice,
        positionType,
        stopLossPercentage: stopLossPercent
      });
      
      stopLossPriceInput.value = stopLossPrice.toFixed(8);
    } catch (error) {
      console.error('Error updating stop loss price:', error);
    }
  }
  
  /**
   * Update stop loss percentage based on entry price, position type and stop loss price
   */
  updateStopLossPercent() {
    const entryPriceInput = document.getElementById('entry-price');
    const positionTypeSelect = document.getElementById('position-type');
    const stopLossPercentInput = document.getElementById('stop-loss-percent');
    const stopLossPriceInput = document.getElementById('stop-loss-price');
    
    if (!entryPriceInput || !positionTypeSelect || !stopLossPercentInput || !stopLossPriceInput) return;
    
    const entryPrice = parseFloat(entryPriceInput.value);
    const positionType = positionTypeSelect.value;
    const stopLossPrice = parseFloat(stopLossPriceInput.value);
    
    if (isNaN(entryPrice) || isNaN(stopLossPrice)) return;
    
    try {
      // Calculate percentage difference between entry and stop
      let stopLossPercent = Math.abs((entryPrice - stopLossPrice) / entryPrice * 100);
      
      // Validate direction based on position type
      if ((positionType === 'long' && stopLossPrice > entryPrice) ||
          (positionType === 'short' && stopLossPrice < entryPrice)) {
        // Invalid direction for stop loss
        // Don't update the percentage in this case
        return;
      }
      
      stopLossPercentInput.value = stopLossPercent.toFixed(2);
    } catch (error) {
      console.error('Error updating stop loss percentage:', error);
    }
  }
  
  /**
   * Update take profit price based on entry price, position type and take profit percentage
   */
  updateTakeProfitPrice() {
    const entryPriceInput = document.getElementById('entry-price');
    const positionTypeSelect = document.getElementById('position-type');
    const takeProfitPercentInput = document.getElementById('take-profit-percent');
    const takeProfitPriceInput = document.getElementById('take-profit-price');
    
    if (!entryPriceInput || !positionTypeSelect || !takeProfitPercentInput || !takeProfitPriceInput) return;
    
    const entryPrice = parseFloat(entryPriceInput.value);
    const positionType = positionTypeSelect.value;
    const takeProfitPercent = parseFloat(takeProfitPercentInput.value);
    
    if (isNaN(entryPrice) || isNaN(takeProfitPercent)) return;
    
    try {
      const takeProfitPrice = this.riskCore.calculateTakeProfitPrice({
        entryPrice,
        positionType,
        takeProfitPercentage: takeProfitPercent
      });
      
      takeProfitPriceInput.value = takeProfitPrice.toFixed(8);
    } catch (error) {
      console.error('Error updating take profit price:', error);
    }
  }
  
  /**
   * Update take profit percentage based on entry price, position type and take profit price
   */
  updateTakeProfitPercent() {
    const entryPriceInput = document.getElementById('entry-price');
    const positionTypeSelect = document.getElementById('position-type');
    const takeProfitPercentInput = document.getElementById('take-profit-percent');
    const takeProfitPriceInput = document.getElementById('take-profit-price');
    
    if (!entryPriceInput || !positionTypeSelect || !takeProfitPercentInput || !takeProfitPriceInput) return;
    
    const entryPrice = parseFloat(entryPriceInput.value);
    const positionType = positionTypeSelect.value;
    const takeProfitPrice = parseFloat(takeProfitPriceInput.value);
    
    if (isNaN(entryPrice) || isNaN(takeProfitPrice)) return;
    
    try {
      // Calculate percentage difference between entry and target
      let takeProfitPercent = Math.abs((takeProfitPrice - entryPrice) / entryPrice * 100);
      
      // Validate direction based on position type
      if ((positionType === 'long' && takeProfitPrice < entryPrice) ||
          (positionType === 'short' && takeProfitPrice > entryPrice)) {
        // Invalid direction for take profit
        // Don't update the percentage in this case
        return;
      }
      
      takeProfitPercentInput.value = takeProfitPercent.toFixed(2);
    } catch (error) {
      console.error('Error updating take profit percentage:', error);
    }
  }
  
  /**
   * Reset the calculator form
   */
  resetCalculator() {
    const form = document.getElementById('position-size-form');
    if (form) {
      form.reset();
      
      // Reset result display
      const resultContainer = document.getElementById('calculation-result');
      if (resultContainer) {
        resultContainer.innerHTML = '';
        resultContainer.classList.remove('active');
      }
      
      // Reset calculation result
      this.calculationResult = null;
    }
  }
  
  /**
   * Refresh account data
   */
  async refreshAccountData() {
    try {
      // Show loading state
      const balanceElement = this.container.querySelector('.account-balance strong');
      if (balanceElement) {
        balanceElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }
      
      // Reload account data
      await this.riskCore.loadAccountData();
      
      // Update displayed balance
      if (balanceElement) {
        const accountBalance = this.riskCore.accountData?.balance || 0;
        balanceElement.textContent = '$' + accountBalance.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      }
      
      this.showMessage('Account balance updated successfully');
    } catch (error) {
      console.error('Failed to refresh account data:', error);
      this.showError('Failed to update account balance');
    }
  }
  
  /**
   * Save the current calculation
   */
  saveCalculation() {
    if (!this.calculationResult) return;
    
    // Here we could save the calculation to local storage or to the API
    // For now, just show a success message
    this.showMessage('Calculation saved successfully');
  }
  
  /**
   * Share the current calculation
   */
  shareCalculation() {
    if (!this.calculationResult) return;
    
    // Here we could implement sharing functionality
    // For now, just show a message
    this.showMessage('Sharing feature coming soon');
  }
  
  /**
   * Apply the calculation to a trade
   */
  applyToTrade() {
    if (!this.calculationResult) return;
    
    // Here we could redirect to the trading interface with the calculated values
    // For now, just show a message
    this.showMessage('Trade parameters applied successfully');
    
    // Emit an event that other components can listen for
    const event = new CustomEvent('positionSizeCalculated', {
      detail: this.calculationResult
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Show an error message
   */
  showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    this.showNotification(notification);
  }
  
  /**
   * Show a success message
   */
  showMessage(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    this.showNotification(notification);
  }
  
  /**
   * Show a notification
   */
  showNotification(notification) {
    // Add to container or body
    let container = document.querySelector('.notifications-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('position-sizing-calculator')) {
    window.positionSizingCalculator = new PositionSizingCalculator();
  }
});
