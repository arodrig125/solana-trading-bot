/**
 * SolarBot Backtesting UI
 * Interface for configuring and running backtests
 */

class BacktestingUI {
  constructor() {
    this.core = new BacktestingCore();
    this.selectedStrategy = null;
    this.selectedPairs = [];
    this.selectedExchanges = [];
    this.strategyParameters = {};
    this.availablePairs = [];
    this.availableExchanges = [];
    this.strategyTemplates = [];
    this.savedBacktests = [];
    this.currentResults = null;
    
    // DOM elements
    this.containers = {
      configPanel: document.getElementById('backtest-config'),
      strategySelector: document.getElementById('strategy-selector'),
      parameterPanel: document.getElementById('strategy-parameters'),
      dateRangeSelector: document.getElementById('date-range-selector'),
      pairsSelector: document.getElementById('pairs-selector'),
      exchangesSelector: document.getElementById('exchanges-selector'),
      runButton: document.getElementById('run-backtest-btn'),
      resultsPanel: document.getElementById('backtest-results'),
      chartsPanel: document.getElementById('backtest-charts'),
      tradesList: document.getElementById('backtest-trades'),
      metricsPanel: document.getElementById('backtest-metrics'),
      comparisonPanel: document.getElementById('backtest-comparison'),
      savedBacktestsPanel: document.getElementById('saved-backtests')
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the backtesting UI
   */
  async initialize() {
    try {
      // Show loading state
      this.showLoading('Loading backtesting module...');
      
      // Load available data in parallel
      const [
        pairs,
        exchanges,
        templates,
        savedTests
      ] = await Promise.all([
        this.core.loadAvailablePairs(),
        this.core.loadAvailableExchanges(),
        this.core.loadStrategyTemplates(),
        this.core.loadSavedBacktests()
      ]);
      
      // Store data
      this.availablePairs = pairs;
      this.availableExchanges = exchanges;
      this.strategyTemplates = templates;
      this.savedBacktests = savedTests;
      
      // Render UI components
      this.renderStrategySelector();
      this.renderDateRangeSelector();
      this.renderPairsSelector();
      this.renderExchangesSelector();
      this.renderSavedBacktests();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Hide loading
      this.hideLoading();
    } catch (error) {
      console.error('Failed to initialize backtesting UI:', error);
      this.showError('Failed to load backtesting module. Please try again later.');
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Strategy selector
    if (this.containers.strategySelector) {
      this.containers.strategySelector.addEventListener('change', (e) => {
        const strategyId = e.target.value;
        this.selectStrategy(strategyId);
      });
    }
    
    // Date range inputs
    const startDateInput = document.getElementById('backtest-start-date');
    const endDateInput = document.getElementById('backtest-end-date');
    
    if (startDateInput && endDateInput) {
      startDateInput.addEventListener('change', () => {
        this.core.settings.startDate = new Date(startDateInput.value).toISOString();
      });
      
      endDateInput.addEventListener('change', () => {
        this.core.settings.endDate = new Date(endDateInput.value).toISOString();
      });
    }
    
    // Timeframe selector
    const timeframeSelect = document.getElementById('backtest-timeframe');
    if (timeframeSelect) {
      timeframeSelect.addEventListener('change', (e) => {
        this.core.settings.timeframe = e.target.value;
      });
    }
    
    // Initial capital input
    const capitalInput = document.getElementById('backtest-capital');
    if (capitalInput) {
      capitalInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value > 0) {
          this.core.settings.initialCapital = value;
        }
      });
    }
    
    // Fee input
    const feeInput = document.getElementById('backtest-fee');
    if (feeInput) {
      feeInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0) {
          this.core.settings.fee = value;
        }
      });
    }
    
    // Slippage input
    const slippageInput = document.getElementById('backtest-slippage');
    if (slippageInput) {
      slippageInput.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0) {
          this.core.settings.slippage = value;
        }
      });
    }
    
    // Run backtest button
    if (this.containers.runButton) {
      this.containers.runButton.addEventListener('click', () => {
        this.runBacktest();
      });
    }
    
    // Save results button
    const saveResultsBtn = document.getElementById('save-backtest-btn');
    if (saveResultsBtn) {
      saveResultsBtn.addEventListener('click', () => {
        this.saveResults();
      });
    }
    
    // Compare button
    const compareBtn = document.getElementById('compare-backtest-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        this.compareResults();
      });
    }
  }
  
  /**
   * Render strategy selector
   */
  renderStrategySelector() {
    const container = this.containers.strategySelector;
    if (!container) return;
    
    let html = '<option value="">Select a strategy</option>';
    
    this.strategyTemplates.forEach(template => {
      html += `<option value="${template.id}">${template.name}</option>`;
    });
    
    container.innerHTML = html;
  }
  
  /**
   * Render date range selector
   */
  renderDateRangeSelector() {
    const container = this.containers.dateRangeSelector;
    if (!container) return;
    
    // Get default dates
    const startDate = new Date(this.core.settings.startDate);
    const endDate = new Date(this.core.settings.endDate);
    
    // Format as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const html = `
      <div class="date-range-inputs">
        <div class="form-group">
          <label for="backtest-start-date">Start Date</label>
          <input type="date" id="backtest-start-date" value="${formatDate(startDate)}" max="${formatDate(endDate)}">
        </div>
        <div class="form-group">
          <label for="backtest-end-date">End Date</label>
          <input type="date" id="backtest-end-date" value="${formatDate(endDate)}" min="${formatDate(startDate)}">
        </div>
      </div>
      <div class="form-group">
        <label for="backtest-timeframe">Timeframe</label>
        <select id="backtest-timeframe">
          ${this.core.timeframes.map(tf => 
            `<option value="${tf.value}" ${tf.value === this.core.settings.timeframe ? 'selected' : ''}>${tf.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="backtest-financials">
        <div class="form-group">
          <label for="backtest-capital">Initial Capital (USD)</label>
          <input type="number" id="backtest-capital" value="${this.core.settings.initialCapital}" min="1" step="1">
        </div>
        <div class="form-group">
          <label for="backtest-fee">Fee (%)</label>
          <input type="number" id="backtest-fee" value="${this.core.settings.fee}" min="0" step="0.01" max="100">
        </div>
        <div class="form-group">
          <label for="backtest-slippage">Slippage (%)</label>
          <input type="number" id="backtest-slippage" value="${this.core.settings.slippage}" min="0" step="0.01" max="100">
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  /**
   * Render trading pairs selector
   */
  renderPairsSelector() {
    const container = this.containers.pairsSelector;
    if (!container) return;
    
    let html = `
      <div class="pairs-search">
        <input type="text" id="pairs-search" placeholder="Search trading pairs...">
      </div>
      <div class="pairs-list">
    `;
    
    this.availablePairs.forEach(pair => {
      const isSelected = this.selectedPairs.includes(pair.symbol);
      
      html += `
        <div class="pair-item ${isSelected ? 'selected' : ''}" data-pair="${pair.symbol}">
          <div class="pair-checkbox">
            <input type="checkbox" id="pair-${pair.symbol}" ${isSelected ? 'checked' : ''}>
          </div>
          <div class="pair-info">
            <div class="pair-name">${pair.symbol}</div>
            <div class="pair-exchange">${pair.exchanges.join(', ')}</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Add event listeners for pair selection
    const pairItems = container.querySelectorAll('.pair-item');
    pairItems.forEach(item => {
      item.addEventListener('click', () => {
        const pairSymbol = item.dataset.pair;
        const checkbox = item.querySelector('input[type="checkbox"]');
        
        // Toggle selection
        checkbox.checked = !checkbox.checked;
        item.classList.toggle('selected');
        
        // Update selected pairs
        if (checkbox.checked) {
          if (!this.selectedPairs.includes(pairSymbol)) {
            this.selectedPairs.push(pairSymbol);
          }
        } else {
          this.selectedPairs = this.selectedPairs.filter(pair => pair !== pairSymbol);
        }
        
        // Update core settings
        this.core.settings.pairs = this.selectedPairs;
      });
    });
    
    // Add search functionality
    const searchInput = container.querySelector('#pairs-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        pairItems.forEach(item => {
          const pairName = item.querySelector('.pair-name').textContent.toLowerCase();
          const pairExchanges = item.querySelector('.pair-exchange').textContent.toLowerCase();
          
          if (pairName.includes(query) || pairExchanges.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
  }
  
  /**
   * Render exchanges selector
   */
  renderExchangesSelector() {
    const container = this.containers.exchangesSelector;
    if (!container) return;
    
    let html = '<div class="exchanges-list">';
    
    this.availableExchanges.forEach(exchange => {
      const isSelected = this.selectedExchanges.includes(exchange.id);
      
      html += `
        <div class="exchange-item ${isSelected ? 'selected' : ''}" data-exchange="${exchange.id}">
          <div class="exchange-checkbox">
            <input type="checkbox" id="exchange-${exchange.id}" ${isSelected ? 'checked' : ''}>
          </div>
          <div class="exchange-info">
            <div class="exchange-name">${exchange.name}</div>
            <div class="exchange-pairs">${exchange.pairCount} pairs available</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Add event listeners for exchange selection
    const exchangeItems = container.querySelectorAll('.exchange-item');
    exchangeItems.forEach(item => {
      item.addEventListener('click', () => {
        const exchangeId = item.dataset.exchange;
        const checkbox = item.querySelector('input[type="checkbox"]');
        
        // Toggle selection
        checkbox.checked = !checkbox.checked;
        item.classList.toggle('selected');
        
        // Update selected exchanges
        if (checkbox.checked) {
          if (!this.selectedExchanges.includes(exchangeId)) {
            this.selectedExchanges.push(exchangeId);
          }
        } else {
          this.selectedExchanges = this.selectedExchanges.filter(ex => ex !== exchangeId);
        }
        
        // Update core settings
        this.core.settings.exchanges = this.selectedExchanges;
      });
    });
  }
  
  /**
   * Render saved backtests
   */
  renderSavedBacktests() {
    const container = this.containers.savedBacktestsPanel;
    if (!container) return;
    
    if (this.savedBacktests.length === 0) {
      container.innerHTML = '<div class="empty-state">No saved backtests</div>';
      return;
    }
    
    let html = '<div class="saved-backtests-list">';
    
    this.savedBacktests.forEach(test => {
      const date = new Date(test.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      html += `
        <div class="saved-backtest-item" data-test-id="${test.id}">
          <div class="backtest-item-header">
            <div class="backtest-name">${test.name}</div>
            <div class="backtest-date">${formattedDate}</div>
          </div>
          <div class="backtest-strategy">${test.strategy.name}</div>
          <div class="backtest-metrics">
            <div class="metric">Return: ${test.results.metrics.totalReturn.toFixed(2)}%</div>
            <div class="metric">Sharpe: ${test.results.metrics.sharpeRatio.toFixed(2)}</div>
            <div class="metric">Trades: ${test.results.trades.length}</div>
          </div>
          <div class="backtest-actions">
            <button class="btn btn-sm load-backtest-btn" data-test-id="${test.id}">Load</button>
            <button class="btn btn-sm compare-backtest-btn" data-test-id="${test.id}">Compare</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Add event listeners
    const loadButtons = container.querySelectorAll('.load-backtest-btn');
    loadButtons.forEach(button => {
      button.addEventListener('click', () => {
        const testId = button.dataset.testId;
        this.loadSavedBacktest(testId);
      });
    });
    
    const compareButtons = container.querySelectorAll('.compare-backtest-btn');
    compareButtons.forEach(button => {
      button.addEventListener('click', () => {
        const testId = button.dataset.testId;
        this.addToComparison(testId);
      });
    });
  }
  
  /**
   * Additional methods to implement:
   * - selectStrategy(strategyId)
   * - renderStrategyParameters(strategy)
   * - updateParameterValue(parameterId, value)
   * - runBacktest()
   * - renderResults(results)
   * - saveResults()
   * - loadSavedBacktest(testId)
   * - addToComparison(testId)
   * - compareResults()
   * - renderComparisonChart(tests)
   */
  
  /**
   * Show loading message
   */
  showLoading(message) {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('backtest-loading-overlay');
    
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'backtest-loading-overlay';
      loadingOverlay.className = 'loading-overlay';
      document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p>${message || 'Loading...'}</p>
      </div>
    `;
    
    loadingOverlay.style.display = 'flex';
  }
  
  /**
   * Hide loading message
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('backtest-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show error message
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
    
    // Add to container or body
    const container = document.querySelector('.notifications-container') || document.body;
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
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 8000);
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('backtesting-module')) {
    window.backtestingUI = new BacktestingUI();
  }
});
