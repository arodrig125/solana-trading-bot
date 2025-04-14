/**
 * SolarBot Dashboard Integrations
 * Integrates all dashboard components and handles page initialization
 */

class DashboardIntegrations {
  constructor() {
    this.api = window.solarbotApi;
    this.authService = window.authService;
    this.securityService = window.securityService;
    
    // Initialize controllers based on page
    this.initializeControllers();
    
    // Set up global event listeners
    this.setupGlobalListeners();
    
    // Check authentication status
    this.checkAuth();
  }
  
  /**
   * Initialize controllers based on current page
   */
  initializeControllers() {
    const path = window.location.pathname;
    
    // Dashboard page
    if (path.includes('/dashboard')) {
      // Core dashboard controller
      if (!window.dashboardController && document.getElementById('dashboard-main')) {
        window.dashboardController = new DashboardController();
      }
      
      // Trading monitor
      if (!window.tradingMonitor && document.getElementById('trading-monitor')) {
        window.tradingMonitor = new TradingMonitor();
      }
      
      // Wallet manager
      if (!window.walletManager && document.getElementById('wallets-container')) {
        window.walletManager = new WalletManager();
      }
    }
    
    // Settings page - initialize controllers as needed
    if (path.includes('/settings')) {
      this.initializeSettingsPage();
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupGlobalListeners() {
    // Handle auth state changes
    window.addEventListener('auth:stateChanged', (e) => {
      this.handleAuthStateChange(e.detail);
    });
    
    // Mobile navigation toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
      mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
      });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Save preference
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark_mode', isDarkMode ? 'enabled' : 'disabled');
      });
      
      // Apply saved preference
      const savedMode = localStorage.getItem('dark_mode');
      if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
      }
    }
  }
  
  /**
   * Check authentication status and redirect if needed
   */
  checkAuth() {
    const path = window.location.pathname;
    const isAuthPage = path.includes('/login') || path.includes('/signup');
    
    // If on a protected page and not logged in, redirect to login
    if (!isAuthPage && path.includes('/dashboard') && !this.authService.isLoggedIn()) {
      window.location.href = '/login';
    }
    
    // If on auth page but already logged in, redirect to dashboard
    if (isAuthPage && this.authService.isLoggedIn()) {
      window.location.href = '/dashboard';
    }
    
    // Update navigation based on auth state
    this.updateNavigation();
  }
  
  /**
   * Handle authentication state changes
   */
  handleAuthStateChange(authState) {
    this.updateNavigation();
    
    // Redirect based on auth state if needed
    if (authState.isLoggedIn) {
      // Check if on login/signup page and redirect to dashboard
      const path = window.location.pathname;
      if (path.includes('/login') || path.includes('/signup')) {
        window.location.href = '/dashboard';
      }
    } else {
      // If logged out and on protected page, redirect to login
      const path = window.location.pathname;
      if (path.includes('/dashboard') || path.includes('/settings')) {
        window.location.href = '/login';
      }
    }
  }
  
  /**
   * Update navigation based on authentication state
   */
  updateNavigation() {
    const isLoggedIn = this.authService.isLoggedIn();
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (authButtons) {
      authButtons.style.display = isLoggedIn ? 'none' : 'flex';
    }
    
    if (userMenu) {
      userMenu.style.display = isLoggedIn ? 'flex' : 'none';
      
      if (isLoggedIn) {
        const user = this.authService.getCurrentUser();
        const userNameElement = userMenu.querySelector('.user-name');
        
        if (userNameElement && user) {
          userNameElement.textContent = user.name;
        }
      }
    }
  }
  
  /**
   * Initialize settings page
   */
  initializeSettingsPage() {
    // Setup two-factor authentication
    const twoFactorSetupBtn = document.getElementById('setup-2fa-btn');
    if (twoFactorSetupBtn) {
      twoFactorSetupBtn.addEventListener('click', () => this.setupTwoFactor());
    }
    
    // API key generation
    const generateApiKeyBtn = document.getElementById('generate-api-key-btn');
    if (generateApiKeyBtn) {
      generateApiKeyBtn.addEventListener('click', () => this.generateApiKey());
    }
    
    // Save notification settings
    const notificationForm = document.getElementById('notification-settings-form');
    if (notificationForm) {
      notificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveNotificationSettings(new FormData(notificationForm));
      });
    }
    
    // Update password
    const passwordForm = document.getElementById('update-password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updatePassword(new FormData(passwordForm));
      });
    }
  }
  
  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor() {
    try {
      const result = await this.securityService.setupTwoFactor();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to set up two-factor authentication');
      }
      
      // Show QR code and verification form
      const twoFactorContainer = document.getElementById('two-factor-container');
      if (twoFactorContainer) {
        twoFactorContainer.innerHTML = `
          <div class="two-factor-setup">
            <h3>Scan QR Code</h3>
            <p>Scan the QR code below with your authentication app</p>
            <div class="qr-code">
              <img src="${result.qrCode}" alt="Two-factor authentication QR code">
            </div>
            <div class="manual-key">
              <p>Or enter this key manually:</p>
              <code>${result.secret}</code>
            </div>
            <form id="verify-2fa-form">
              <input type="hidden" name="secret" value="${result.secret}">
              <div class="form-group">
                <label for="auth-code">Verification Code</label>
                <input type="text" id="auth-code" name="token" placeholder="Enter 6-digit code" required>
              </div>
              <button type="submit" class="btn btn-primary">Verify and Enable</button>
            </form>
          </div>
        `;
        
        // Setup verification form submission
        const verifyForm = document.getElementById('verify-2fa-form');
        verifyForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(verifyForm);
          try {
            const verifyResult = await this.securityService.verifyAndEnableTwoFactor(
              formData.get('token'),
              formData.get('secret')
            );
            
            if (verifyResult.success) {
              this.showNotification('Two-factor authentication enabled successfully', 'success');
              // Update UI
              twoFactorContainer.innerHTML = `
                <div class="two-factor-enabled">
                  <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <h3>Two-Factor Authentication Enabled</h3>
                  <p>Your account is now protected with two-factor authentication</p>
                  <button id="disable-2fa-btn" class="btn btn-outline">Disable 2FA</button>
                </div>
              `;
              
              // Setup disable button
              const disableBtn = document.getElementById('disable-2fa-btn');
              disableBtn.addEventListener('click', () => this.disableTwoFactor());
            } else {
              throw new Error(verifyResult.message || 'Verification failed');
            }
          } catch (error) {
            this.showNotification('Verification failed: ' + error.message, 'error');
          }
        });
      }
    } catch (error) {
      this.showNotification('Failed to set up two-factor authentication: ' + error.message, 'error');
    }
  }
  
  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor() {
    // Show confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-dialog-content">
        <h3>Disable Two-Factor Authentication</h3>
        <p>Are you sure you want to disable two-factor authentication? This will reduce the security of your account.</p>
        <form id="disable-2fa-form">
          <div class="form-group">
            <label for="disable-auth-code">Authentication Code</label>
            <input type="text" id="disable-auth-code" name="token" placeholder="Enter 6-digit code" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-danger">Disable 2FA</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Close dialog function
    const closeDialog = () => {
      dialog.classList.add('closing');
      setTimeout(() => {
        document.body.removeChild(dialog);
      }, 300);
    };
    
    // Setup event listeners
    dialog.querySelector('.cancel-btn').addEventListener('click', closeDialog);
    
    const disableForm = dialog.querySelector('#disable-2fa-form');
    disableForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(disableForm);
      try {
        const result = await this.securityService.disableTwoFactor(formData.get('token'));
        
        if (result.success) {
          this.showNotification('Two-factor authentication disabled', 'success');
          closeDialog();
          
          // Update UI
          const twoFactorContainer = document.getElementById('two-factor-container');
          if (twoFactorContainer) {
            twoFactorContainer.innerHTML = `
              <p>Two-factor authentication is currently disabled.</p>
              <button id="setup-2fa-btn" class="btn btn-primary">Set Up Two-Factor Authentication</button>
            `;
            
            // Re-attach event listener
            document.getElementById('setup-2fa-btn').addEventListener('click', () => this.setupTwoFactor());
          }
        } else {
          throw new Error(result.message || 'Failed to disable two-factor authentication');
        }
      } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = error.message || 'Failed to disable two-factor authentication';
        
        const formActions = dialog.querySelector('.form-actions');
        formActions.parentNode.insertBefore(errorElement, formActions);
      }
    });
    
    // Show dialog with animation
    setTimeout(() => {
      dialog.classList.add('show');
    }, 10);
  }
  
  /**
   * Generate API key
   */
  async generateApiKey() {
    try {
      const response = await this.api.request('/user/api-key', { method: 'POST' });
      
      if (response.apiKey) {
        const apiKeyContainer = document.getElementById('api-key-container');
        if (apiKeyContainer) {
          apiKeyContainer.innerHTML = `
            <div class="api-key-display">
              <p>Your API key (copy it now, it won't be shown again):</p>
              <div class="api-key-value">
                <code>${response.apiKey}</code>
                <button class="btn btn-icon copy-api-key-btn">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <p class="api-key-warning">Keep this key secret! Anyone with this key can access your account.</p>
            </div>
          `;
          
          // Copy button functionality
          const copyBtn = apiKeyContainer.querySelector('.copy-api-key-btn');
          copyBtn.addEventListener('click', () => {
            const apiKey = response.apiKey;
            navigator.clipboard.writeText(apiKey).then(() => {
              this.showNotification('API key copied to clipboard', 'success');
            }).catch(err => {
              console.error('Could not copy API key: ', err);
            });
          });
        }
      } else {
        throw new Error(response.message || 'Failed to generate API key');
      }
    } catch (error) {
      this.showNotification('Failed to generate API key: ' + error.message, 'error');
    }
  }
  
  /**
   * Save notification settings
   */
  async saveNotificationSettings(formData) {
    try {
      const settings = {
        emailNotifications: formData.get('email-notifications') === 'on',
        telegramNotifications: formData.get('telegram-notifications') === 'on',
        pushNotifications: formData.get('push-notifications') === 'on',
        tradingAlerts: formData.get('trading-alerts') === 'on',
        securityAlerts: formData.get('security-alerts') === 'on',
        marketingEmails: formData.get('marketing-emails') === 'on'
      };
      
      const response = await this.api.request('/user/notification-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      
      if (response.success) {
        this.showNotification('Notification settings saved successfully', 'success');
      } else {
        throw new Error(response.message || 'Failed to save notification settings');
      }
    } catch (error) {
      this.showNotification('Failed to save notification settings: ' + error.message, 'error');
    }
  }
  
  /**
   * Update password
   */
  async updatePassword(formData) {
    try {
      const currentPassword = formData.get('current-password');
      const newPassword = formData.get('new-password');
      const confirmPassword = formData.get('confirm-password');
      
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // Check password strength
      const strengthResult = this.securityService.checkPasswordStrength(newPassword);
      if (!strengthResult.isStrong) {
        throw new Error(`Password is not strong enough: ${strengthResult.feedback}`);
      }
      
      const response = await this.api.request('/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (response.success) {
        this.showNotification('Password updated successfully', 'success');
        
        // Clear form
        document.getElementById('update-password-form').reset();
      } else {
        throw new Error(response.message || 'Failed to update password');
      }
    } catch (error) {
      this.showNotification('Failed to update password: ' + error.message, 'error');
    }
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    // Add notification to container
    const container = document.querySelector('.notifications-container') || document.body;
    container.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 5000);
  }
}

// Initialize dashboard integrations when document is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardIntegrations = new DashboardIntegrations();
});
