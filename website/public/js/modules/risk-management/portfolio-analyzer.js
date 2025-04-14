/**
 * SolarBot Portfolio Risk Analyzer
 * Analyzes portfolio composition, diversification, correlation and risk metrics
 */

class PortfolioAnalyzer {
  constructor() {
    this.api = window.solarbotApi;
    this.riskCore = new RiskManagementCore();
    this.initialized = false;
    
    // Portfolio data
    this.portfolioData = null;
    this.correlationMatrix = null;
    this.riskMetrics = null;
    
    // DOM elements
    this.container = document.getElementById('portfolio-analyzer');
    
    // Charts
    this.allocationChart = null;
    this.correlationHeatmap = null;
    this.riskReturnChart = null;
    this.drawdownChart = null;
    
    // Initialize the analyzer
    this.initialize();
  }
  
  /**
   * Initialize the portfolio analyzer
   */
  async initialize() {
    try {
      if (!this.container) {
        console.error('Portfolio analyzer container not found');
        return;
      }
      
      // Initialize risk management core if not already initialized
      if (!this.riskCore.initialized) {
        await this.riskCore.initialize();
      }
      
      // Load portfolio data
      await this.loadPortfolioData();
      
      // Render the analyzer UI
      this.renderAnalyzer();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize portfolio analyzer:', error);
      this.showError('Failed to initialize portfolio analyzer. Please try again later.');
    }
  }
  
  /**
   * Load portfolio data including asset allocation, historical returns, and correlations
   */
  async loadPortfolioData() {
    try {
      // Show loading state
      this.showLoading('Loading portfolio data...');
      
      // Load portfolio data from API
      const response = await this.api.request('/portfolio/data');
      this.portfolioData = response.data;
      
      // Calculate correlation matrix
      this.calculateCorrelations();
      
      // Calculate risk metrics
      this.calculateRiskMetrics();
      
      // Hide loading
      this.hideLoading();
      
      return this.portfolioData;
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      this.hideLoading();
      this.showError('Failed to load portfolio data. Please try again later.');
      throw error;
    }
  }
  
  /**
   * Calculate correlation matrix between assets
   */
  calculateCorrelations() {
    if (!this.portfolioData || !this.portfolioData.assets || !this.portfolioData.historicalReturns) {
      return;
    }
    
    const { assets, historicalReturns } = this.portfolioData;
    
    // Create empty correlation matrix
    const matrix = {};
    
    // Calculate correlation for each pair of assets
    assets.forEach(asset1 => {
      matrix[asset1.symbol] = {};
      
      assets.forEach(asset2 => {
        // For the same asset, correlation is 1
        if (asset1.symbol === asset2.symbol) {
          matrix[asset1.symbol][asset2.symbol] = 1;
          return;
        }
        
        // Get historical returns for both assets
        const returns1 = historicalReturns.filter(ret => ret.symbol === asset1.symbol);
        const returns2 = historicalReturns.filter(ret => ret.symbol === asset2.symbol);
        
        // Make sure we have matching time periods
        const matchingReturns = [];
        returns1.forEach(ret1 => {
          const matchingRet2 = returns2.find(ret2 => ret2.timestamp === ret1.timestamp);
          if (matchingRet2) {
            matchingReturns.push({
              timestamp: ret1.timestamp,
              return1: ret1.return,
              return2: matchingRet2.return
            });
          }
        });
        
        if (matchingReturns.length < 5) {
          // Not enough data points for correlation
          matrix[asset1.symbol][asset2.symbol] = null;
          return;
        }
        
        // Calculate correlation coefficient
        matrix[asset1.symbol][asset2.symbol] = this.calculateCorrelationCoefficient(
          matchingReturns.map(r => r.return1),
          matchingReturns.map(r => r.return2)
        );
      });
    });
    
    this.correlationMatrix = matrix;
  }
  
  /**
   * Calculate correlation coefficient between two series
   */
  calculateCorrelationCoefficient(series1, series2) {
    if (series1.length !== series2.length || series1.length === 0) {
      return null;
    }
    
    // Calculate means
    const mean1 = series1.reduce((sum, val) => sum + val, 0) / series1.length;
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / series2.length;
    
    // Calculate deviations and products
    let sumProductDeviations = 0;
    let sumSquaredDeviations1 = 0;
    let sumSquaredDeviations2 = 0;
    
    for (let i = 0; i < series1.length; i++) {
      const dev1 = series1[i] - mean1;
      const dev2 = series2[i] - mean2;
      sumProductDeviations += dev1 * dev2;
      sumSquaredDeviations1 += dev1 * dev1;
      sumSquaredDeviations2 += dev2 * dev2;
    }
    
    // Calculate correlation coefficient
    const correlation = sumProductDeviations / (Math.sqrt(sumSquaredDeviations1) * Math.sqrt(sumSquaredDeviations2));
    
    // Handle potentially NaN results (if denominator is zero)
    return isNaN(correlation) ? 0 : correlation;
  }
  
  /**
   * Calculate portfolio risk metrics
   */
  calculateRiskMetrics() {
    if (!this.portfolioData || !this.portfolioData.assets || !this.portfolioData.historicalReturns) {
      return;
    }
    
    const { assets, historicalReturns } = this.portfolioData;
    
    // Calculate portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns();
    
    // Calculate metrics for the portfolio and individual assets
    const metrics = {
      portfolio: this.calculateAssetMetrics(portfolioReturns, 'Portfolio'),
      assets: {}
    };
    
    // Calculate metrics for each asset
    assets.forEach(asset => {
      const assetReturns = historicalReturns
        .filter(ret => ret.symbol === asset.symbol)
        .map(ret => ret.return);
      
      metrics.assets[asset.symbol] = this.calculateAssetMetrics(assetReturns, asset.symbol);
    });
    
    // Calculate diversification ratio
    metrics.diversificationRatio = this.calculateDiversificationRatio();
    
    // Calculate asset concentration
    metrics.concentrationIndex = this.calculateConcentrationIndex();
    
    // Calculate Value at Risk (VaR)
    metrics.valueAtRisk = this.calculateValueAtRisk(portfolioReturns);
    
    this.riskMetrics = metrics;
  }
  
  /**
   * Calculate portfolio returns based on asset allocation and individual returns
   */
  calculatePortfolioReturns() {
    if (!this.portfolioData || !this.portfolioData.assets || !this.portfolioData.historicalReturns) {
      return [];
    }
    
    const { assets, historicalReturns } = this.portfolioData;
    
    // Get all unique timestamps from historical returns
    const timestamps = [...new Set(historicalReturns.map(ret => ret.timestamp))].sort();
    
    // Calculate portfolio return for each timestamp
    const portfolioReturns = timestamps.map(timestamp => {
      let weightedReturn = 0;
      let totalWeight = 0;
      
      assets.forEach(asset => {
        const returnData = historicalReturns.find(ret => 
          ret.symbol === asset.symbol && ret.timestamp === timestamp
        );
        
        if (returnData) {
          weightedReturn += returnData.return * asset.weight;
          totalWeight += asset.weight;
        }
      });
      
      // Normalize by total weight (in case some assets don't have data for this timestamp)
      if (totalWeight > 0) {
        weightedReturn /= totalWeight;
      }
      
      return {
        timestamp,
        return: weightedReturn
      };
    });
    
    return portfolioReturns;
  }
  
  /**
   * Calculate risk metrics for an asset or portfolio
   */
  calculateAssetMetrics(returns, symbol) {
    const returnValues = Array.isArray(returns) ? returns : returns.map(r => r.return);
    
    if (returnValues.length === 0) {
      return {
        symbol,
        returns: [],
        totalReturn: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0
      };
    }
    
    // Calculate total and annualized return
    const totalReturn = returnValues.reduce((a, b) => (1 + a) * (1 + b) - 1, 0) * 100;
    
    // Assuming daily returns and 252 trading days per year
    const annualizedReturn = Math.pow(1 + totalReturn / 100, 252 / returnValues.length) - 1;
    
    // Calculate volatility (standard deviation of returns)
    const mean = returnValues.reduce((sum, val) => sum + val, 0) / returnValues.length;
    const squaredDeviations = returnValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDeviations.reduce((sum, val) => sum + val, 0) / squaredDeviations.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    // Calculate Sharpe ratio (assuming risk-free rate of 0.02 or 2%)
    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
    
    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = -Infinity;
    
    // Reconstruct equity curve from returns
    let equity = 1;
    const equityCurve = returnValues.map(ret => {
      equity *= (1 + ret);
      return equity;
    });
    
    // Find maximum drawdown
    for (let i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
      }
      
      const drawdown = (peak - equityCurve[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate win rate
    const wins = returnValues.filter(ret => ret > 0).length;
    const winRate = wins / returnValues.length;
    
    return {
      symbol,
      returns: returnValues,
      totalReturn,
      annualizedReturn: annualizedReturn * 100, // Convert to percentage
      volatility: volatility * 100, // Convert to percentage
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100, // Convert to percentage
      winRate: winRate * 100 // Convert to percentage
    };
  }
  
  /**
   * Calculate diversification ratio of the portfolio
   */
  calculateDiversificationRatio() {
    if (!this.portfolioData || !this.portfolioData.assets || !this.correlationMatrix) {
      return 0;
    }
    
    const { assets } = this.portfolioData;
    
    // Weighted average volatility
    let weightedVolatility = 0;
    
    assets.forEach(asset1 => {
      const assetVolatility = this.riskMetrics?.assets[asset1.symbol]?.volatility || 0;
      weightedVolatility += asset1.weight * assetVolatility;
    });
    
    // Portfolio volatility
    const portfolioVolatility = this.riskMetrics?.portfolio?.volatility || 0;
    
    // Diversification ratio
    return portfolioVolatility > 0 ? weightedVolatility / portfolioVolatility : 1;
  }
  
  /**
   * Calculate concentration index (Herfindahl-Hirschman Index)
   */
  calculateConcentrationIndex() {
    if (!this.portfolioData || !this.portfolioData.assets) {
      return 1; // Maximum concentration
    }
    
    const { assets } = this.portfolioData;
    
    // Sum of squared weights
    const sumSquaredWeights = assets.reduce((sum, asset) => sum + Math.pow(asset.weight, 2), 0);
    
    // HHI index (scaled to 0-1, where 1 is complete concentration)
    return sumSquaredWeights;
  }
  
  /**
   * Calculate Value at Risk (VaR) for the portfolio
   * @param {Array} portfolioReturns - Historical portfolio returns
   * @param {number} confidenceLevel - Confidence level (default: 0.95 or 95%)
   * @returns {number} VaR as a percentage of portfolio value
   */
  calculateValueAtRisk(portfolioReturns, confidenceLevel = 0.95) {
    if (!portfolioReturns || portfolioReturns.length === 0) {
      return 0;
    }
    
    const returnValues = portfolioReturns.map(r => r.return);
    
    // Sort returns in ascending order
    const sortedReturns = [...returnValues].sort((a, b) => a - b);
    
    // Find the index corresponding to the confidence level
    const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));
    
    // Get the return at that index
    const varReturn = sortedReturns[index];
    
    // Convert VaR to positive percentage
    return -varReturn * 100;
  }
  
  /**
   * Render the portfolio analyzer UI
   */
  renderAnalyzer() {
    // Build the main HTML structure for the analyzer
    const html = `
      <div class="analyzer-container">
        <div class="analyzer-header">
          <h3>Portfolio Risk Analysis</h3>
          <div class="analyzer-controls">
            <button id="refresh-portfolio" class="btn btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
            <button id="export-analysis" class="btn btn-sm"><i class="fas fa-download"></i> Export</button>
          </div>
        </div>
        
        <div class="analyzer-summary">
          <!-- Risk metrics summary cards will be rendered here -->
        </div>
        
        <div class="analyzer-tabs">
          <button class="tab-btn active" data-tab="allocation">Allocation</button>
          <button class="tab-btn" data-tab="correlation">Correlation</button>
          <button class="tab-btn" data-tab="risk-return">Risk/Return</button>
          <button class="tab-btn" data-tab="drawdown">Drawdown</button>
        </div>
        
        <div class="analyzer-tab-content">
          <div class="tab-pane active" id="allocation-tab">
            <div class="chart-container">
              <canvas id="allocation-chart"></canvas>
            </div>
            <div class="chart-legend" id="allocation-legend"></div>
          </div>
          
          <div class="tab-pane" id="correlation-tab">
            <div class="chart-container">
              <canvas id="correlation-chart"></canvas>
            </div>
            <div class="correlation-scale">
              <div class="scale-gradient"></div>
              <div class="scale-labels">
                <span>-1.0</span>
                <span>0.0</span>
                <span>+1.0</span>
              </div>
            </div>
          </div>
          
          <div class="tab-pane" id="risk-return-tab">
            <div class="chart-container">
              <canvas id="risk-return-chart"></canvas>
            </div>
            <div class="chart-legend" id="risk-return-legend"></div>
          </div>
          
          <div class="tab-pane" id="drawdown-tab">
            <div class="chart-container">
              <canvas id="drawdown-chart"></canvas>
            </div>
            <div class="chart-controls">
              <select id="drawdown-asset-selector">
                <!-- Asset options will be rendered here -->
              </select>
            </div>
          </div>
        </div>
        
        <div class="analyzer-detail">
          <div class="detail-header">
            <h4>Asset Risk Analysis</h4>
            <div class="detail-controls">
              <input type="text" id="asset-search" placeholder="Search asset...">
              <select id="sort-by">
                <option value="weight">Sort by Weight</option>
                <option value="return">Sort by Return</option>
                <option value="volatility">Sort by Volatility</option>
                <option value="sharpe">Sort by Sharpe Ratio</option>
              </select>
            </div>
          </div>
          
          <div class="asset-list" id="asset-risk-list">
            <!-- Asset risk items will be rendered here -->
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Render summary metrics
    this.renderSummaryMetrics();
    
    // Render asset list
    this.renderAssetRiskList();
    
    // Initialize charts
    this.initializeCharts();
  }
  
  /**
   * Additional methods to implement:
   * - renderSummaryMetrics()
   * - renderAssetRiskList()
   * - initializeCharts()
   * - setupEventListeners()
   * - createAllocationChart()
   * - createCorrelationHeatmap()
   * - createRiskReturnChart()
   * - createDrawdownChart()
   */
  
  /**
   * Show loading message
   */
  showLoading(message) {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('portfolio-loading-overlay');
    
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'portfolio-loading-overlay';
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
    const loadingOverlay = document.getElementById('portfolio-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
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
  if (document.getElementById('portfolio-analyzer')) {
    window.portfolioAnalyzer = new PortfolioAnalyzer();
  }
});
