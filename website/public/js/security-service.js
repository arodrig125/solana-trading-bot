/**
 * SolarBot Security Service
 * Provides enhanced security features for user authentication and data protection
 */

class SecurityService {
  constructor() {
    this.tokenRefreshTimer = null;
    this.sessionTimeoutTimer = null;
    this.inactivityTimer = null;
    this.lastActivity = Date.now();
    
    // Security settings
    this.settings = {
      tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
      sessionTimeout: 60 * 60 * 1000, // 1 hour
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 10,
      requirePasswordMix: true,
      twoFactorEnabled: false
    };
    
    // Initialize security
    this.initialize();
  }
  
  /**
   * Initialize security service
   */
  initialize() {
    this.setupActivityTracking();
    this.startTokenRefresh();
    this.loadSecuritySettings();
    this.checkTwoFactorStatus();
  }
  
  /**
   * Load security settings from localStorage or API
   */
  loadSecuritySettings() {
    const savedSettings = localStorage.getItem('solarbot_security_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = {...this.settings, ...parsedSettings};
      } catch (e) {
        console.error('Error parsing security settings', e);
      }
    }
  }
  
  /**
   * Check two-factor authentication status
   */
  async checkTwoFactorStatus() {
    try {
      const api = window.solarbotApi;
      const response = await api.request('/auth/2fa/status');
      this.settings.twoFactorEnabled = response.enabled;
    } catch (e) {
      console.error('Error checking 2FA status', e);
    }
  }
  
  /**
   * Track user activity to prevent session timeout
   */
  setupActivityTracking() {
    // Reset inactivity timer on user interaction
    const resetInactivityTimer = () => {
      this.lastActivity = Date.now();
      this.resetInactivityTimeout();
    };
    
    // Track user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, resetInactivityTimer, { passive: true });
    });
    
    // Start inactivity timer
    this.resetInactivityTimeout();
  }
  
  /**
   * Reset the inactivity timeout
   */
  resetInactivityTimeout() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.settings.inactivityTimeout);
  }
  
  /**
   * Handle user inactivity
   */
  handleInactivity() {
    // Show warning before logging out
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    if (timeSinceLastActivity >= this.settings.inactivityTimeout) {
      this.showInactivityWarning();
    }
  }
  
  /**
   * Show inactivity warning before logout
   */
  showInactivityWarning() {
    const warningDialog = document.createElement('div');
    warningDialog.className = 'security-dialog';
    warningDialog.innerHTML = `
      <div class="security-dialog-content">
        <h3>Session Timeout Warning</h3>
        <p>You've been inactive for a while. Your session will expire in 60 seconds.</p>
        <div class="security-dialog-actions">
          <button id="stay-active-btn" class="btn btn-primary">Stay Active</button>
          <button id="logout-now-btn" class="btn btn-outline">Logout Now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(warningDialog);
    
    // Set timeout for automatic logout
    const autoLogoutTimer = setTimeout(() => {
      this.forceLogout('Your session has expired due to inactivity.');
    }, 60000); // 60 seconds warning
    
    // Stay active button
    document.getElementById('stay-active-btn').addEventListener('click', () => {
      clearTimeout(autoLogoutTimer);
      document.body.removeChild(warningDialog);
      this.lastActivity = Date.now();
      this.resetInactivityTimeout();
    });
    
    // Logout now button
    document.getElementById('logout-now-btn').addEventListener('click', () => {
      clearTimeout(autoLogoutTimer);
      this.forceLogout('You have been logged out.');
    });
  }
  
  /**
   * Start token refresh timer
   */
  startTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }
    
    this.tokenRefreshTimer = setInterval(() => {
      this.refreshAuthToken();
    }, this.settings.tokenRefreshInterval);
  }
  
  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    try {
      const api = window.solarbotApi;
      const response = await api.request('/auth/refresh-token', { method: 'POST' });
      
      if (response && response.token) {
        api.setAuthToken(response.token);
      }
    } catch (e) {
      console.error('Error refreshing token', e);
      // If token refresh fails, force logout
      this.forceLogout('Your session has expired. Please login again.');
    }
  }
  
  /**
   * Force logout the user
   */
  forceLogout(message) {
    // Clear all timers
    if (this.tokenRefreshTimer) clearInterval(this.tokenRefreshTimer);
    if (this.sessionTimeoutTimer) clearTimeout(this.sessionTimeoutTimer);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    
    // Logout
    const authService = window.authService;
    authService.logout();
    
    // Store message for login page
    if (message) {
      sessionStorage.setItem('logout_message', message);
    }
    
    // Redirect to login
    window.location.href = 'login.html';
  }
  
  /**
   * Generate a CSRF token for forms
   */
  generateCsrfToken() {
    const token = this.generateRandomString(32);
    sessionStorage.setItem('csrf_token', token);
    return token;
  }
  
  /**
   * Validate a CSRF token
   */
  validateCsrfToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken;
  }
  
  /**
   * Check password strength
   */
  checkPasswordStrength(password) {
    if (!password) return { score: 0, feedback: 'Password is required' };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length < this.settings.passwordMinLength) {
      feedback.push(`Password should be at least ${this.settings.passwordMinLength} characters`);
    } else {
      score += Math.min(2, Math.floor(password.length / 5));
    }
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');
    
    // Repeated characters
    if (/(.)(\1\1)/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }
    
    // Sequential characters
    if (/abc|bcd|cde|def|efg|123|234|345|456|567|678|789/.test(password.toLowerCase())) {
      score -= 1;
      feedback.push('Avoid sequential characters');
    }
    
    // Final score (0-5)
    score = Math.max(0, Math.min(5, score));
    
    return {
      score,
      feedback: feedback.join('. '),
      isStrong: score >= 3
    };
  }
  
  /**
   * Generate a random string
   */
  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor() {
    try {
      const api = window.solarbotApi;
      const response = await api.request('/auth/2fa/setup', { method: 'POST' });
      
      return {
        success: true,
        qrCode: response.qrCode,
        secret: response.secret
      };
    } catch (e) {
      console.error('Error setting up 2FA', e);
      return { success: false, message: e.message };
    }
  }
  
  /**
   * Verify and enable two-factor authentication
   */
  async verifyAndEnableTwoFactor(token, secret) {
    try {
      const api = window.solarbotApi;
      const response = await api.request('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ token, secret })
      });
      
      if (response.success) {
        this.settings.twoFactorEnabled = true;
        this.saveSecuritySettings();
      }
      
      return response;
    } catch (e) {
      console.error('Error verifying 2FA', e);
      return { success: false, message: e.message };
    }
  }
  
  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(token) {
    try {
      const api = window.solarbotApi;
      const response = await api.request('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      
      if (response.success) {
        this.settings.twoFactorEnabled = false;
        this.saveSecuritySettings();
      }
      
      return response;
    } catch (e) {
      console.error('Error disabling 2FA', e);
      return { success: false, message: e.message };
    }
  }
  
  /**
   * Save security settings
   */
  saveSecuritySettings() {
    localStorage.setItem('solarbot_security_settings', JSON.stringify(this.settings));
  }
}

// Create global security service instance
window.securityService = new SecurityService();
