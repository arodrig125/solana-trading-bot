/**
 * SolarBot Backtesting Core
 * Foundation for backtesting trading strategies against historical data
 */

class BacktestingCore {
  constructor() {
    this.api = window.solarbotApi;
    this.historicalData = {};
    this.strategies = {};
    this.currentTest = null;
    this.testResults = {};
    
    // Default settings
    this.settings = {
      timeframe: '1h',       // 1m, 5m, 15m, 1h, 4h, 1d
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString(),
      initialCapital: 1000,  // USD
      fee: 0.1,              // % fee per trade
      slippage: 0.05,        // % slippage per trade
      pairs: [],             // Trading pairs to test
      exchanges: []          // Exchanges to include
    };
    
    // Available timeframes
    this.timeframes = [
      { value: '1m', label: '1 Minute' },
      { value: '5m', label: '5 Minutes' },
      { value: '15m', label: '15 Minutes' },
      { value: '1h', label: '1 Hour' },
      { value: '4h', label: '4 Hours' },
      { value: '1d', label: '1 Day' }
    ];
  }
  
  /**
   * Get default start date (30 days ago)
   */
  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }
  
  /**
   * Load available trading pairs for backtesting
   */
  async loadAvailablePairs() {
    try {
      const response = await this.api.request('/backtesting/available-pairs');
      return response.pairs || [];
    } catch (error) {
      console.error('Failed to load available pairs:', error);
      throw error;
    }
  }
  
  /**
   * Load available exchanges for backtesting
   */
  async loadAvailableExchanges() {
    try {
      const response = await this.api.request('/backtesting/available-exchanges');
      return response.exchanges || [];
    } catch (error) {
      console.error('Failed to load available exchanges:', error);
      throw error;
    }
  }
  
  /**
   * Load historical data for a specific pair, timeframe, and date range
   */
  async loadHistoricalData(pair, exchange, timeframe, startDate, endDate) {
    try {
      const response = await this.api.request(
        `/backtesting/historical-data?pair=${pair}&exchange=${exchange}&timeframe=${timeframe}&startDate=${startDate}&endDate=${endDate}`
      );
      
      // Cache the data
      const cacheKey = `${pair}_${exchange}_${timeframe}`;
      this.historicalData[cacheKey] = response.data || [];
      
      return response.data || [];
    } catch (error) {
      console.error(`Failed to load historical data for ${pair} on ${exchange}:`, error);
      throw error;
    }
  }
  
  /**
   * Load available strategy templates
   */
  async loadStrategyTemplates() {
    try {
      const response = await this.api.request('/backtesting/strategy-templates');
      return response.templates || [];
    } catch (error) {
      console.error('Failed to load strategy templates:', error);
      throw error;
    }
  }
  
  /**
   * Register a strategy for backtesting
   */
  registerStrategy(id, name, description, executeFn, parameterConfig = []) {
    this.strategies[id] = {
      id,
      name,
      description,
      execute: executeFn,
      parameters: parameterConfig
    };
    
    return id; // Return ID for reference
  }
  
  /**
   * Load strategy from API by ID
   */
  async loadStrategy(strategyId) {
    try {
      const response = await this.api.request(`/backtesting/strategies/${strategyId}`);
      
      if (!response.strategy) {
        throw new Error('Strategy not found');
      }
      
      // Register the strategy in our local registry
      const { id, name, description, code, parameters } = response.strategy;
      
      // Create function from code string
      let executeFn;
      try {
        // This creates a function from the code string with 'data', 'parameters', and 'utils' parameters
        executeFn = new Function('data', 'parameters', 'utils', code);
      } catch (e) {
        console.error('Error creating function from strategy code:', e);
        throw new Error('Invalid strategy code');
      }
      
      // Register the strategy
      this.registerStrategy(id, name, description, executeFn, parameters);
      
      return response.strategy;
    } catch (error) {
      console.error(`Failed to load strategy ${strategyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run a backtest with specified settings
   */
  async runBacktest(strategyId, parameters, settings = {}) {
    try {
      // Merge with default settings
      const testSettings = { ...this.settings, ...settings };
      
      // Validate required fields
      const requiredFields = ['startDate', 'endDate', 'initialCapital', 'pairs', 'exchanges'];
      for (const field of requiredFields) {
        if (!testSettings[field]) {
          throw new Error(`Missing required setting: ${field}`);
        }
      }
      
      // Make sure we have the strategy
      if (!this.strategies[strategyId]) {
        await this.loadStrategy(strategyId);
      }
      
      // Start a backtest
      const strategy = this.strategies[strategyId];
      
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }
      
      // Set current test
      this.currentTest = {
        id: `test_${Date.now()}`,
        strategyId,
        parameters,
        settings: testSettings,
        startTime: Date.now(),
        status: 'running'
      };
      
      // We can either run the backtest locally or on the server
      // For complex strategies, server-side is better
      const result = await this.api.request('/backtesting/run', {
        method: 'POST',
        body: JSON.stringify({
          strategyId,
          parameters,
          settings: testSettings
        })
      });
      
      // Store the results
      this.testResults[this.currentTest.id] = {
        ...this.currentTest,
        status: 'completed',
        endTime: Date.now(),
        results: result.results
      };
      
      // Reset current test
      this.currentTest = null;
      
      return result.results;
    } catch (error) {
      console.error('Backtest failed:', error);
      
      // Update current test with error
      if (this.currentTest) {
        this.testResults[this.currentTest.id] = {
          ...this.currentTest,
          status: 'failed',
          endTime: Date.now(),
          error: error.message
        };
        
        // Reset current test
        this.currentTest = null;
      }
      
      throw error;
    }
  }
  
  /**
   * Run a local backtest for simple strategies (mainly for debugging and development)
   */
  async runLocalBacktest(strategyId, parameters, settings = {}) {
    try {
      // Merge with default settings
      const testSettings = { ...this.settings, ...settings };
      
      // Get the strategy
      const strategy = this.strategies[strategyId];
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }
      
      // Load historical data for each pair and exchange
      const dataPromises = [];
      for (const pair of testSettings.pairs) {
        for (const exchange of testSettings.exchanges) {
          dataPromises.push(
            this.loadHistoricalData(
              pair,
              exchange,
              testSettings.timeframe,
              testSettings.startDate,
              testSettings.endDate
            )
          );
        }
      }
      
      // Wait for all data to load
      const dataResults = await Promise.all(dataPromises);
      
      // Create a combined dataset indexed by timestamp
      const combinedData = {};
      
      let pairExchangeIndex = 0;
      for (const pair of testSettings.pairs) {
        for (const exchange of testSettings.exchanges) {
          const data = dataResults[pairExchangeIndex++];
          
          for (const candle of data) {
            const timestamp = candle.timestamp;
            
            if (!combinedData[timestamp]) {
              combinedData[timestamp] = {
                timestamp,
                data: {}
              };
            }
            
            if (!combinedData[timestamp].data[pair]) {
              combinedData[timestamp].data[pair] = {};
            }
            
            combinedData[timestamp].data[pair][exchange] = candle;
          }
        }
      }
      
      // Convert to array and sort by timestamp
      const timeseriesData = Object.values(combinedData).sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      // Create utilities for the strategy
      const utils = this.createBacktestUtilities();
      
      // Execute the strategy on the dataset
      const signals = [];
      
      for (let i = 0; i < timeseriesData.length; i++) {
        const dataWindow = timeseriesData.slice(0, i + 1);
        
        try {
          // Call the strategy function
          const signal = strategy.execute(dataWindow, parameters, utils);
          
          if (signal) {
            signals.push({
              timestamp: timeseriesData[i].timestamp,
              ...signal
            });
          }
        } catch (error) {
          console.error(`Strategy execution error at ${timeseriesData[i].timestamp}:`, error);
        }
      }
      
      // Simulate trades based on signals
      const trades = this.simulateTrades(signals, timeseriesData, testSettings);
      
      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(trades, testSettings);
      
      return {
        signals,
        trades,
        metrics,
        settings: testSettings
      };
    } catch (error) {
      console.error('Local backtest failed:', error);
      throw error;
    }
  }
  
  /**
   * Create backtest utility functions for strategies
   */
  createBacktestUtilities() {
    return {
      // Technical indicators
      calculateSMA: (values, period) => {
        if (values.length < period) return null;
        const sum = values.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
      },
      
      calculateEMA: (values, period, previousEMA) => {
        if (values.length < period) return null;
        
        const k = 2 / (period + 1);
        
        // If no previous EMA, calculate SMA as starting point
        if (previousEMA === undefined) {
          previousEMA = values.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
        }
        
        return k * values[values.length - 1] + (1 - k) * previousEMA;
      },
      
      calculateRSI: (values, period) => {
        if (values.length <= period) return null;
        
        // Calculate price changes
        const changes = [];
        for (let i = 1; i < values.length; i++) {
          changes.push(values[i] - values[i - 1]);
        }
        
        // Separate gains and losses
        const gains = changes.map(change => change > 0 ? change : 0);
        const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
        
        // Calculate average gain and loss
        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) return 100; // No losses means RSI = 100
        
        // Calculate RS and RSI
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
      }
    };
  }
  
  /**
   * Simulate trades based on signals and calculate performance
   */
  simulateTrades(signals, timeseriesData, settings) {
    // Implementation will depend on the specific format of signals
    // and how we want to simulate trades
    // This is a placeholder function
    
    return [];
  }
  
  /**
   * Calculate performance metrics based on trades
   */
  calculatePerformanceMetrics(trades, settings) {
    // Calculate various metrics like:
    // - Total return
    // - Sharpe ratio
    // - Maximum drawdown
    // - Win rate
    // - Average profit per trade
    // etc.
    
    return {};
  }
  
  /**
   * Save backtest results
   */
  async saveBacktestResults(testId, name, description) {
    try {
      if (!this.testResults[testId]) {
        throw new Error(`Test ${testId} not found`);
      }
      
      const result = await this.api.request('/backtesting/save-results', {
        method: 'POST',
        body: JSON.stringify({
          testId,
          name,
          description,
          results: this.testResults[testId]
        })
      });
      
      return result;
    } catch (error) {
      console.error('Failed to save backtest results:', error);
      throw error;
    }
  }
  
  /**
   * Load saved backtest results
   */
  async loadSavedBacktests() {
    try {
      const response = await this.api.request('/backtesting/saved-results');
      return response.results || [];
    } catch (error) {
      console.error('Failed to load saved backtests:', error);
      throw error;
    }
  }
}

// Make available globally
window.BacktestingCore = BacktestingCore;
