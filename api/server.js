/**
 * API Server for Solana Trading Bot
 * Provides REST API access to bot functionality
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { initJupiterClient, getSolanaConnection, findArbitrageOpportunities, executeTrade } = require('../utils/jupiter');
const walletManager = require('../utils/walletManager');
const logger = require('../utils/logger');
const { TOKENS, TOKEN_PAIRS } = require('../config/tokens');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Set up middleware
app.use(cors());
app.use(bodyParser.json());

// Store for API keys and user data
const apiKeys = new Map();
const userWallets = new Map();

// Initialize Jupiter client
let jupiterClient;
let connection;

async function initializeServices() {
  jupiterClient = await initJupiterClient();
  connection = getSolanaConnection();
  logger.info('API services initialized');
}

// Authentication middleware
function authenticate(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check if API key is valid
    if (!apiKeys.has(decoded.apiKey)) {
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Rate limiting middleware
const rateLimit = new Map();
function rateLimiter(req, res, next) {
  const apiKey = req.user.apiKey;
  const now = Date.now();
  
  // Get user's tier and rate limits
  const userTier = apiKeys.get(apiKey).tier;
  let maxRequests = 10; // Default rate limit
  
  // Set rate limits based on tier
  switch (userTier) {
    case 'basic':
      maxRequests = 20;
      break;
    case 'pro':
      maxRequests = 50;
      break;
    case 'enterprise':
      maxRequests = 200;
      break;
  }
  
  // Check rate limit
  if (!rateLimit.has(apiKey)) {
    rateLimit.set(apiKey, { count: 1, resetTime: now + 60000 }); // Reset after 1 minute
  } else {
    const limit = rateLimit.get(apiKey);
    
    // Reset counter if time expired
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      rateLimit.set(apiKey, limit);
    } else if (limit.count >= maxRequests) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
    } else {
      limit.count++;
      rateLimit.set(apiKey, limit);
    }
  }
  
  next();
}

// API Routes

// Health check endpoint (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate API key (this would be secured behind admin authentication in production)
app.post('/api/generate-key', (req, res) => {
  const { userId, tier, name } = req.body;
  
  if (!userId || !tier || !name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  // Generate new API key
  const apiKey = uuidv4();
  
  // Store API key with user info
  apiKeys.set(apiKey, {
    userId,
    tier,
    name,
    createdAt: new Date().toISOString(),
    active: true
  });
  
  // Generate JWT token
  const token = jwt.sign({ apiKey, userId }, JWT_SECRET, { expiresIn: '30d' });
  
  res.json({
    success: true,
    apiKey,
    token,
    expiresIn: '30 days'
  });
});

// User wallet management
app.post('/api/wallets', authenticate, (req, res) => {
  const { privateKeys } = req.body;
  const { apiKey } = req.user;
  
  if (!privateKeys || !Array.isArray(privateKeys) || privateKeys.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid private keys' });
  }
  
  try {
    // Initialize wallets for this user
    const wallets = walletManager.initWallets(privateKeys);
    
    // Store wallet manager for this user
    userWallets.set(apiKey, { walletManager, wallets });
    
    res.json({
      success: true,
      walletCount: wallets.length,
      walletAddresses: wallets.map(w => w.publicKey)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get wallet information
app.get('/api/wallets', authenticate, async (req, res) => {
  const { apiKey } = req.user;
  
  // Check if user has initialized wallets
  if (!userWallets.has(apiKey)) {
    return res.status(400).json({ success: false, error: 'No wallets initialized' });
  }
  
  try {
    const { walletManager } = userWallets.get(apiKey);
    
    // Update wallet balances
    await walletManager.updateAllWalletBalances(connection);
    
    // Get wallet stats
    const stats = walletManager.getWalletStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find arbitrage opportunities
app.get('/api/opportunities', authenticate, rateLimiter, async (req, res) => {
  const { minProfitPercent } = req.query;
  
  try {
    const opportunities = await findArbitrageOpportunities(jupiterClient, minProfitPercent);
    
    res.json({
      success: true,
      count: opportunities.length,
      opportunities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute trade
app.post('/api/execute-trade', authenticate, rateLimiter, async (req, res) => {
  const { apiKey } = req.user;
  const { opportunity, simulationMode = true } = req.body;
  
  // Check if user has initialized wallets
  if (!userWallets.has(apiKey)) {
    return res.status(400).json({ success: false, error: 'No wallets initialized' });
  }
  
  try {
    const { walletManager } = userWallets.get(apiKey);
    
    // Execute trade with wallet manager
    const result = await executeTrade(
      jupiterClient,
      connection,
      null, // Wallet will be selected by wallet manager
      opportunity,
      simulationMode, 
      walletManager
    );
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available tokens
app.get('/api/tokens', authenticate, (req, res) => {
  res.json({
    success: true,
    tokens: Object.values(TOKENS)
  });
});

// Get token pairs
app.get('/api/token-pairs', authenticate, (req, res) => {
  res.json({
    success: true,
    pairs: TOKEN_PAIRS
  });
});

// Start the server
app.listen(PORT, async () => {
  await initializeServices();
  logger.info(`API server running on port ${PORT}`);
});

module.exports = app; // Export for testing
