/**
 * SolarBot API Client
 * Handles communication with the SolarBot RESTful API
 */

class ApiClient {
  constructor() {
    this.baseUrl = this.getBaseUrl();
    this.token = localStorage.getItem('solarbot_auth_token');
  }

  /**
   * Determine API base URL based on environment
   */
  getBaseUrl() {
    // Use environment variables in production, but default to local for development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:3001/api';
    } else {
      // Connect to the Digital Ocean API server
      return 'https://api.solarbot.digitalocean.app/api';
    }
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('solarbot_auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('solarbot_auth_token');
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Make API request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders()
      });

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Handle unauthorized (token expired)
          this.clearAuthToken();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        throw new Error(errorData.message || 'API request failed');
      }

      // Return JSON response
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * User authentication methods
   */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      this.setAuthToken(data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      this.setAuthToken(data.token);
    }
    
    return data;
  }

  async logout() {
    this.clearAuthToken();
    return { success: true };
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  /**
   * Trading data methods
   */
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getTradingHistory(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/trading/history?${queryParams}`);
  }

  async getWallets() {
    return this.request('/wallets');
  }

  async addWallet(walletData) {
    return this.request('/wallets', {
      method: 'POST',
      body: JSON.stringify(walletData)
    });
  }

  async removeWallet(walletId) {
    return this.request(`/wallets/${walletId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Bot control methods
   */
  async getBotStatus() {
    return this.request('/bot/status');
  }

  async startBot() {
    return this.request('/bot/start', { method: 'POST' });
  }

  async stopBot() {
    return this.request('/bot/stop', { method: 'POST' });
  }

  async updateBotSettings(settings) {
    return this.request('/bot/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  /**
   * Subscription methods
   */
  async getSubscription() {
    return this.request('/subscription');
  }

  async updateSubscription(plan) {
    return this.request('/subscription', {
      method: 'PUT',
      body: JSON.stringify({ plan })
    });
  }

  async cancelSubscription() {
    return this.request('/subscription/cancel', { method: 'POST' });
  }

  /**
   * Risk Automation methods
   */
  async getRules(walletId = null) {
    const queryParams = walletId ? `?walletId=${walletId}` : '';
    return this.request(`/automation/rules${queryParams}`);
  }

  async createRule(rule) {
    return this.request('/automation/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  }

  async updateRule(ruleId, updates) {
    return this.request(`/automation/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteRule(ruleId) {
    return this.request(`/automation/rules/${ruleId}`, {
      method: 'DELETE'
    });
  }

  async evaluateRules(walletId = null) {
    return this.request('/automation/rules/evaluate', {
      method: 'POST',
      body: JSON.stringify({ walletId })
    });
  }

  async getRuleHistory(ruleId) {
    return this.request(`/automation/rules/${ruleId}/history`);
  }
}

// Create global instance
window.solarbotApi = new ApiClient();
