/**
 * SolarBot Authentication Service
 * Handles authentication, user management, and subscription features
 * Connects to the RESTful API for secure authentication
 */

class AuthService {
  constructor() {
    this.api = window.solarbotApi;
    this.currentUser = null;
    this.subscriptionPlans = {
      starter: {
        name: 'STARTER',
        price: 29,
        yearlyPrice: 279,
        savings: 69,
        trialDays: 7,
        features: [
          'Simulation mode only',
          'Basic arbitrage detection',
          'Telegram notifications',
          '5 token pairs',
          'Daily summary reports',
          'Basic dashboard access',
          'Community support',
          '2-minute scan interval',
          '100 daily scans'
        ]
      },
      pro: {
        name: 'PRO',
        price: 79,
        yearlyPrice: 759,
        savings: 189,
        trialDays: 0,
        features: [
          'Everything in STARTER tier',
          'Live trading mode',
          'Simple and triangular arbitrage',
          '20 token pairs',
          'Customizable profit thresholds',
          'Detailed analytics',
          'Email support',
          '1-minute scan interval',
          '500 daily scans'
        ]
      },
      elite: {
        name: 'ELITE',
        price: 199,
        yearlyPrice: 1899,
        savings: 489,
        trialDays: 0,
        features: [
          'Everything in PRO tier',
          'Multi-wallet support',
          'Advanced risk management',
          'API access',
          '50 token pairs',
          'Multi-hop arbitrage',
          'Priority support',
          '30-second scan interval',
          '2000 daily scans'
        ]
      },
      institutional: {
        name: 'INSTITUTIONAL',
        price: 999,
        yearlyPrice: 9590,
        savings: 2398,
        trialDays: 0,
        features: [
          'Everything in ELITE tier',
          'Dedicated VPS',
          'Custom development',
          'Multiple exchange support',
          'Advanced reporting',
          'Direct developer access',
          'Unlimited token pairs',
          '10-second scan interval',
          'Flash-loan arbitrage'
        ]
      }
    };
    
    // Initialize
    this.initializeFromToken();
    this.setupEventListeners();
  }

  /**
   * Try to initialize user from stored token
   */
  async initializeFromToken() {
    try {
      if (localStorage.getItem('solarbot_auth_token')) {
        // Get user data from API using the stored token
        const userData = await this.api.getCurrentUser();
        this.currentUser = userData.user;
        this.triggerAuthStateChange();
      }
    } catch (error) {
      console.error('Failed to initialize from token:', error);
      this.logout();
    }
  }

  /**
   * Set up event listeners for auth events
   */
  setupEventListeners() {
    window.addEventListener('auth:logout', () => {
      this.currentUser = null;
      this.triggerAuthStateChange();
    });
  }

  /**
   * Trigger auth state change event
   */
  triggerAuthStateChange() {
    window.dispatchEvent(new CustomEvent('auth:stateChanged', {
      detail: {
        isLoggedIn: !!this.currentUser,
        user: this.currentUser
      }
    }));
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  async register(userData) {
    try {
      const result = await this.api.register(userData);
      this.currentUser = result.user;
      this.triggerAuthStateChange();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Login an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    try {
      const result = await this.api.login(email, password);
      this.currentUser = result.user;
      this.triggerAuthStateChange();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Logout the current user
   */
  async logout() {
    try {
      await this.api.logout();
      this.currentUser = null;
      this.triggerAuthStateChange();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Check if a user is currently logged in
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Get the current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Update user subscription
   * @param {string} plan - Subscription plan ID
   */
  async updateSubscription(plan) {
    try {
      const result = await this.api.updateSubscription(plan);
      this.currentUser = result.user;
      this.triggerAuthStateChange();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription() {
    try {
      const result = await this.api.cancelSubscription();
      this.currentUser = result.user;
      this.triggerAuthStateChange();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all available subscription plans
   */
  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  /**
   * Get details for a specific subscription plan
   * @param {string} planId - Subscription plan ID
   */
  getPlanDetails(planId) {
    return this.subscriptionPlans[planId] || null;
  }
}

// Create global auth service instance
window.authService = new AuthService();
