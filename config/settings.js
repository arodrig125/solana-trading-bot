/**
 * Settings configuration for the Solana arbitrage bot
 * This file contains various settings that control the bot's behavior
 */

module.exports = {
  // Gas optimization settings
  gasOptimization: {
    // Whether to enable gas optimization
    enabled: true,

    // High gas threshold in lamports (above this is considered expensive)
    highGasThreshold: 5000,

    // Medium gas threshold in lamports
    mediumGasThreshold: 1000,

    // Whether to adjust profit thresholds based on gas prices
    adjustProfitThresholds: true,

    // Maximum profit threshold adjustment percentage
    maxProfitAdjustmentPercent: 2.0,

    // Minimum profit multiplier for high gas conditions
    highGasMultiplier: 2.0,

    // Minimum profit multiplier for medium gas conditions
    mediumGasMultiplier: 1.5,

    // How many recent gas prices to keep for trend analysis
    historyLength: 10
  },

  // Scanning settings
  scanning: {
    // Interval between scans in milliseconds
    interval: 120000, // Increased to 120 seconds to reduce API calls

    // Maximum number of opportunities to process in a single scan
    maxOpportunities: 5,

    // Whether to automatically start scanning on bot startup
    autoStart: true,

    // Maximum number of concurrent requests to avoid rate limiting
    maxConcurrentRequests: 1, // Reduced to 1 to avoid rate limiting

    // Dynamic arbitrage settings
    dynamicArbitrage: {
      // Whether to enable dynamic arbitrage path finding
      enabled: true,

      // Path lengths to check (3 for triangular, 4 for quadrangular, etc.)
      pathLengths: [3, 4],

      // Maximum number of paths to check per length
      maxPathsPerLength: 5,

      // Base tokens to use for dynamic arbitrage (mint addresses)
      baseTokens: [
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'So11111111111111111111111111111111111111112'     // SOL
      ]
    }
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

    // Circuit breaker settings
    circuitBreaker: {
      // Whether to enable circuit breaker
      enabled: true,

      // Thresholds for different circuit breaker levels (consecutive losses)
      thresholds: [3, 5, 7],

      // Cooldown period in milliseconds before starting recovery (1 hour)
      cooldownPeriodMs: 3600000,

      // Position size multipliers for different levels
      positionSizeMultipliers: [0.75, 0.5, 0.25, 0],

      // Recovery increment per successful trade
      recoveryIncrement: 0.1,

      // Whether to consider market conditions when triggering
      considerMarketConditions: true
    },

    // Position sizing settings
    positionSizing: {
      // Whether to enable dynamic position sizing
      enabled: true,

      // Default position size (in USDC) when no history is available
      defaultSize: 50,

      // Minimum position size (in USDC)
      minPositionSize: 10,

      // Maximum position size (in USDC)
      maxPositionSize: 500,

      // Multiplier for Kelly criterion (0-1, lower is more conservative)
      kellyFractionMultiplier: 0.3,

      // Whether to adjust position size based on market volatility
      volatilityAdjustment: true,

      // Current market volatility estimate (0-1, higher means more volatile)
      marketVolatility: 0.2,

      // Weight given to path reliability in position sizing (0-1)
      pathReliabilityWeight: 0.7
    }
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

  // Gas optimization settings
  gasOptimization: {
    // Whether to enable gas optimization
    enabled: true,

    // Default prioritization fee in lamports when no data is available
    defaultPrioritizationFee: 5000,

    // Threshold for high gas price in lamports
    highGasThreshold: 10000,

    // Threshold for medium gas price in lamports
    mediumGasThreshold: 5000,

    // Minimum profit margin multiplier (profit must be this many times the gas cost)
    minProfitMarginMultiplier: 2,

    // Whether to wait for better gas prices when trend is decreasing
    waitForBetterGas: true,

    // Maximum wait time in milliseconds when waiting for better gas
    maxWaitTimeMs: 60000,

    // Whether to adjust profit thresholds based on gas prices
    adjustProfitThresholds: true
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
