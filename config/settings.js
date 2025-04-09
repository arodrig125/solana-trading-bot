/**
 * Settings configuration for the Solana arbitrage bot
 * This file contains various settings that control the bot's behavior
 */

module.exports = {
  // Scanning settings
  scanning: {
    // Interval between scans in milliseconds
    interval: 30000,
    
    // Maximum number of opportunities to process in a single scan
    maxOpportunities: 5,
    
    // Whether to automatically start scanning on bot startup
    autoStart: true,
    
    // Maximum number of concurrent requests to avoid rate limiting
    maxConcurrentRequests: 3
  },
  
  // Trading settings
  trading: {
    // Default minimum profit percentage to consider an opportunity valid
    defaultMinProfitPercent: 0.5,
    
    // Maximum slippage percentage allowed for trades
    maxSlippagePercent: 1.0,
    
    // Default amount to use for price quotes (in USDC)
    defaultQuoteAmount: 100,
    
    // Maximum amount to trade in a single transaction (in USDC)
    maxTradeAmount: 1000,
    
    // Whether to automatically execute trades when opportunities are found
    autoExecuteTrades: false,
    
    // Minimum time between trades in milliseconds (to avoid spamming)
    minTimeBetweenTrades: 60000
  },
  
  // Risk management settings
  riskManagement: {
    // Maximum daily trading volume (in USDC)
    maxDailyVolume: 10000,
    
    // Maximum number of trades per day
    maxDailyTrades: 50,
    
    // Maximum percentage of wallet to use for trading
    maxWalletPercentage: 50,
    
    // Minimum wallet balance to maintain (in SOL)
    minWalletBalance: 0.1,
    
    // Maximum loss percentage before pausing trading
    maxLossPercentage: 5.0,
    
    // Whether to enable circuit breaker (pause trading after consecutive losses)
    enableCircuitBreaker: true,
    
    // Number of consecutive losses to trigger circuit breaker
    circuitBreakerThreshold: 3
  },
  
  // Notification settings
  notifications: {
    // Whether to send notifications for opportunities
    sendOpportunityAlerts: true,
    
    // Whether to send notifications for executed trades
    sendTradeAlerts: true,
    
    // Whether to send daily summary reports
    sendDailySummaries: true,
    
    // Time to send daily summary (in 24-hour format, UTC)
    dailySummaryTime: '00:00',
    
    // Whether to send error notifications
    sendErrorAlerts: true,
    
    // Minimum profit percentage to send opportunity alert
    minAlertProfitPercent: 1.0
  },
  
  // Advanced settings
  advanced: {
    // RPC endpoint to use (leave empty to use default)
    rpcEndpoint: '',
    
    // Whether to use multiple RPC endpoints for redundancy
    useMultipleRpcEndpoints: false,
    
    // Additional RPC endpoints
    additionalRpcEndpoints: [],
    
    // Whether to use rate limiting to avoid RPC throttling
    useRateLimiting: true,
    
    // Maximum number of RPC requests per minute
    maxRequestsPerMinute: 100,
    
    // Log level (debug, info, warn, error)
    logLevel: 'info',
    
    // Whether to log to file
    logToFile: true,
    
    // Maximum log file size in MB
    maxLogSize: 10
  }
};
