// JupiterService.js - Interface between dashboard and Jupiter API
import axios from 'axios';

// API endpoint URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const OPPORTUNITIES_ENDPOINT = `${API_BASE_URL}/opportunities`;
const TRADE_ENDPOINT = `${API_BASE_URL}/trade`;
const WALLETS_ENDPOINT = `${API_BASE_URL}/wallets`;
const SIMULATION_ENDPOINT = `${API_BASE_URL}/simulate`;

/**
 * JupiterService provides methods to interact with the SolarBot Jupiter trading backend
 */
class JupiterService {
  /**
   * Get authentication token
   * @returns {string} The JWT token from localStorage
   */
  static getAuthToken() {
    return localStorage.getItem('solarbot_token');
  }

  /**
   * Sets default authorization headers for API requests
   * @returns {Object} Headers object with Authorization
   */
  static getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  /**
   * Fetch arbitrage opportunities from the API
   * @param {Object} filters - Optional filters (minProfit, tokenSymbol, etc)
   * @returns {Promise<Array>} List of opportunities
   */
  static async getOpportunities(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to request params
      if (filters.minProfit) params.append('minProfit', filters.minProfit);
      if (filters.riskLevel) params.append('risk', filters.riskLevel);
      if (filters.tokenSymbol) params.append('token', filters.tokenSymbol);
      if (filters.type) params.append('type', filters.type);
      
      const response = await axios.get(
        `${OPPORTUNITIES_ENDPOINT}?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.opportunities || [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  /**
   * Simulate a trade to check expected profit
   * @param {Object} opportunity - The opportunity to simulate
   * @param {number} amount - The amount to trade
   * @returns {Promise<Object>} Simulation results
   */
  static async simulateTrade(opportunity, amount) {
    try {
      const response = await axios.post(
        SIMULATION_ENDPOINT,
        { 
          opportunityId: opportunity.id,
          amount,
          path: opportunity.path
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.simulation;
    } catch (error) {
      console.error('Error simulating trade:', error);
      throw error;
    }
  }

  /**
   * Execute a trade
   * @param {Object} opportunity - The opportunity to trade
   * @param {string} walletId - The wallet to use for trading
   * @param {number} amount - Amount to trade
   * @param {Object} options - Additional options (slippage, etc)
   * @returns {Promise<Object>} Trade execution results
   */
  static async executeTrade(opportunity, walletId, amount, options = {}) {
    try {
      const response = await axios.post(
        TRADE_ENDPOINT,
        {
          opportunityId: opportunity.id,
          walletId,
          amount,
          path: opportunity.path,
          slippageBps: options.slippage || 100, // Default 1%
          priority: options.priority || 'balanced'
        },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Get available wallets for trading
   * @returns {Promise<Array>} List of wallets
   */
  static async getWallets() {
    try {
      const response = await axios.get(
        WALLETS_ENDPOINT,
        { headers: this.getHeaders() }
      );
      
      return response.data.wallets || [];
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance for specific tokens
   * @param {string} walletId - The wallet ID
   * @param {Array<string>} tokens - Array of token symbols to check balance for
   * @returns {Promise<Object>} Wallet balances
   */
  static async getWalletBalance(walletId, tokens = []) {
    try {
      const params = new URLSearchParams();
      if (tokens.length > 0) {
        params.append('tokens', tokens.join(','));
      }
      
      const response = await axios.get(
        `${WALLETS_ENDPOINT}/${walletId}/balance?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.balances || {};
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get history of trades
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Trade history
   */
  static async getTradeHistory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.walletId) params.append('walletId', filters.walletId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(
        `${API_BASE_URL}/history?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.trades || [];
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    }
  }
}

export default JupiterService;
