/**
 * Solana Trading Bot API Client
 * A simple client library for interacting with the trading bot API
 */

const axios = require('axios');

class TradingBotClient {
  /**
   * Initialize the API client
   * @param {string} baseUrl - Base URL of the API
   * @param {string} token - JWT token for authentication
   */
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  /**
   * Set the JWT token for authentication
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    this.axios.defaults.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * Generate a new API key
   * @param {string} userId - User ID
   * @param {string} tier - Subscription tier (basic, pro, enterprise)
   * @param {string} name - Name for the API key
   * @returns {Promise} - API key information
   */
  async generateApiKey(userId, tier, name) {
    try {
      const response = await this.axios.post('/api/generate-key', {
        userId,
        tier,
        name
      });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Initialize wallets with private keys
   * @param {Array<string>} privateKeys - Array of private keys
   * @returns {Promise} - Wallet initialization result
   */
  async initializeWallets(privateKeys) {
    try {
      const response = await this.axios.post('/api/wallets', { privateKeys });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Get wallet information
   * @returns {Promise} - Wallet information
   */
  async getWalletInfo() {
    try {
      const response = await this.axios.get('/api/wallets');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Find arbitrage opportunities
   * @param {number} minProfitPercent - Minimum profit percentage
   * @returns {Promise} - List of opportunities
   */
  async findOpportunities(minProfitPercent = null) {
    try {
      const url = minProfitPercent ? `/api/opportunities?minProfitPercent=${minProfitPercent}` : '/api/opportunities';
      const response = await this.axios.get(url);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Execute a trade
   * @param {Object} opportunity - Trading opportunity
   * @param {boolean} simulationMode - Whether to run in simulation mode
   * @returns {Promise} - Trade execution result
   */
  async executeTrade(opportunity, simulationMode = true) {
    try {
      const response = await this.axios.post('/api/execute-trade', {
        opportunity,
        simulationMode
      });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Get available tokens
   * @returns {Promise} - List of tokens
   */
  async getTokens() {
    try {
      const response = await this.axios.get('/api/tokens');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Get token pairs
   * @returns {Promise} - List of token pairs
   */
  async getTokenPairs() {
    try {
      const response = await this.axios.get('/api/token-pairs');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Check API health
   * @returns {Promise} - Health status
   */
  async checkHealth() {
    try {
      const response = await this.axios.get('/api/health');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Handle API errors
   * @private
   * @param {Error} error - Error object
   */
  _handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      const errorMessage = data.error || 'An unknown error occurred';
      
      throw new Error(`API Error (${status}): ${errorMessage}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = TradingBotClient;
