/**
 * Application configuration file
 * Contains environment-specific settings and constants
 */

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000';
const API_TIMEOUT = 30000; // 30 seconds

// Feature flags
const FEATURES = {
  MULTI_WALLET: true,
  NOTIFICATIONS: true,
  AUTO_TRADING: true,
  ANALYTICS: true,
};

// Token settings
const DEFAULT_TOKENS = [
  'SOL', 
  'USDC', 
  'ETH', 
  'BONK', 
  'JUP', 
  'RAY'
];

// Trading settings
const TRADE_SETTINGS = {
  MIN_PROFIT_PERCENT: 0.5,
  MAX_SLIPPAGE_PERCENT: 1.0,
  DEFAULT_TRADE_AMOUNT: 100, // USDC
  MAX_CONCURRENT_TRADES: 3,
  SIMULATION_ENABLED: true,
};

// Application metadata
const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@solarbot.io';

export {
  API_BASE_URL,
  API_TIMEOUT,
  FEATURES,
  DEFAULT_TOKENS,
  TRADE_SETTINGS,
  APP_VERSION,
  SUPPORT_EMAIL,
};
