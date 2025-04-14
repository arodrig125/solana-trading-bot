/**
 * SolarBot Wallet Manager
 * Advanced wallet management, monitoring, and integration
 */

class WalletManager {
  constructor() {
    this.api = window.solarbotApi;
    this.wallets = [];
    this.tokenBalances = {};
    this.historicalBalances = {};
    this.selectedWallet = null;
    this.chartInstances = {};
    
    // DOM elements
    this.elements = {
      walletsContainer: document.getElementById('wallets-container'),
      tokenBalancesContainer: document.getElementById('token-balances'),
      walletActionsContainer: document.getElementById('wallet-actions'),
      walletStatsContainer: document.getElementById('wallet-stats'),
      balanceHistoryChart: document.getElementById('balance-history-chart')
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize wallet manager
   */
  async initialize() {
    try {
      await this.loadWallets();
      this.setupEventListeners();
      this.initWalletPolling();
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
      this.showError('Failed to load wallet data');
    }
  }
  
  /**
   * Load wallets from the API
   */
  async loadWallets() {
    try {
      const response = await this.api.request('/wallets');
      this.wallets = response.wallets || [];
      
      if (this.wallets.length > 0) {
        // Select first wallet by default if none selected
        if (!this.selectedWallet) {
          this.selectedWallet = this.wallets[0].address;
        }
        
        // Load token balances for selected wallet
        await this.loadTokenBalances(this.selectedWallet);
        
        // Load historical balance data
        await this.loadHistoricalBalances(this.selectedWallet);
      }
      
      this.updateWalletsUI();
    } catch (error) {
      console.error('Error loading wallets:', error);
      throw error;
    }
  }
  
  /**
   * Load token balances for a specific wallet
   */
  async loadTokenBalances(walletAddress) {
    try {
      const response = await this.api.request(`/wallets/${walletAddress}/balances`);
      this.tokenBalances = response.balances || {};
      this.updateTokenBalancesUI();
    } catch (error) {
      console.error('Error loading token balances:', error);
      throw error;
    }
  }
  
  /**
   * Load historical balances for a specific wallet
   */
  async loadHistoricalBalances(walletAddress) {
    try {
      const response = await this.api.request(`/wallets/${walletAddress}/history?period=month`);
      this.historicalBalances = response.history || {};
      this.updateBalanceHistoryChart();
    } catch (error) {
      console.error('Error loading historical balances:', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Wallet selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.wallet-item')) {
        const walletItem = e.target.closest('.wallet-item');
        const walletAddress = walletItem.dataset.address;
        this.selectWallet(walletAddress);
      }
      
      // Add wallet button
      if (e.target.id === 'add-wallet-btn') {
        this.showAddWalletModal();
      }
      
      // Remove wallet button
      if (e.target.classList.contains('remove-wallet-btn')) {
        const walletAddress = e.target.dataset.address;
        this.confirmRemoveWallet(walletAddress);
      }
    });
    
    // Add wallet form submission
    const addWalletForm = document.getElementById('add-wallet-form');
    if (addWalletForm) {
      addWalletForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addWallet(addWalletForm);
      });
    }
  }
  
  /**
   * Initialize wallet polling for real-time updates
   */
  initWalletPolling() {
    // Update wallet data every 30 seconds
    setInterval(() => {
      if (this.selectedWallet) {
        this.loadTokenBalances(this.selectedWallet);
      }
    }, 30000);
    
    // Update historical data every 5 minutes
    setInterval(() => {
      if (this.selectedWallet) {
        this.loadHistoricalBalances(this.selectedWallet);
      }
    }, 300000);
  }
  
  /**
   * Select a wallet
   */
  async selectWallet(walletAddress) {
    this.selectedWallet = walletAddress;
    
    // Update UI to show selected wallet
    const walletItems = document.querySelectorAll('.wallet-item');
    walletItems.forEach(item => {
      if (item.dataset.address === walletAddress) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Load data for selected wallet
    await Promise.all([
      this.loadTokenBalances(walletAddress),
      this.loadHistoricalBalances(walletAddress)
    ]);
  }
  
  /**
   * Show add wallet modal
   */
  showAddWalletModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'add-wallet-modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Wallet</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-wallet-form">
            <div class="form-group">
              <label for="wallet-name">Wallet Name</label>
              <input type="text" id="wallet-name" name="name" placeholder="My Trading Wallet" required>
            </div>
            <div class="form-group">
              <label for="wallet-address">Solana Wallet Address</label>
              <input type="text" id="wallet-address" name="address" placeholder="Enter Solana wallet address" required>
              <small>Enter a valid Solana wallet address starting with a base58 encoded string</small>
            </div>
            <div class="form-group">
              <label for="private-key">Private Key (Optional)</label>
              <div class="private-key-input">
                <input type="password" id="private-key" name="privateKey" placeholder="Enter private key for trading">
                <button type="button" class="toggle-visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <small>Private key is required for automated trading. Your key is encrypted and stored securely.</small>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Wallet</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Toggle private key visibility
    const toggleBtn = modal.querySelector('.toggle-visibility');
    const privateKeyInput = modal.querySelector('#private-key');
    
    toggleBtn.addEventListener('click', () => {
      const type = privateKeyInput.type === 'password' ? 'text' : 'password';
      privateKeyInput.type = type;
      toggleBtn.querySelector('i').classList.toggle('fa-eye');
      toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
    });
    
    // Close modal functionality
    const closeModal = () => {
      modal.classList.add('closing');
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
    
    // Form submission
    modal.querySelector('#add-wallet-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const walletData = {
        name: formData.get('name'),
        address: formData.get('address'),
        privateKey: formData.get('privateKey') || undefined
      };
      
      try {
        await this.addWallet(walletData);
        closeModal();
      } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = error.message || 'Failed to add wallet';
        
        const formActions = modal.querySelector('.form-actions');
        formActions.parentNode.insertBefore(errorElement, formActions);
      }
    });
    
    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }
  
  /**
   * Add a new wallet
   */
  async addWallet(walletData) {
    try {
      const response = await this.api.request('/wallets', {
        method: 'POST',
        body: JSON.stringify(walletData)
      });
      
      if (response.success) {
        // Add new wallet to the list
        this.wallets.push(response.wallet);
        this.updateWalletsUI();
        
        // Select the new wallet
        this.selectWallet(response.wallet.address);
        
        // Show success message
        this.showNotification('Wallet added successfully', 'success');
      } else {
        throw new Error(response.message || 'Failed to add wallet');
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      this.showNotification('Failed to add wallet: ' + error.message, 'error');
      throw error;
    }
  }
  
  /**
   * Confirm wallet removal
   */
  confirmRemoveWallet(walletAddress) {
    const wallet = this.wallets.find(w => w.address === walletAddress);
    if (!wallet) return;
    
    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    
    dialog.innerHTML = `
      <div class="confirm-dialog-content">
        <h3>Remove Wallet</h3>
        <p>Are you sure you want to remove the wallet "${wallet.name}"?</p>
        <div class="confirm-dialog-actions">
          <button class="btn btn-outline cancel-btn">Cancel</button>
          <button class="btn btn-danger confirm-btn">Remove</button>
        </div>
      </div>
    `;
    
    // Add dialog to body
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
    
    dialog.querySelector('.confirm-btn').addEventListener('click', async () => {
      try {
        await this.removeWallet(walletAddress);
        closeDialog();
      } catch (error) {
        // Show error in dialog
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = error.message || 'Failed to remove wallet';
        
        const actions = dialog.querySelector('.confirm-dialog-actions');
        actions.parentNode.insertBefore(errorMessage, actions);
      }
    });
    
    // Show dialog with animation
    setTimeout(() => {
      dialog.classList.add('show');
    }, 10);
  }
  
  /**
   * Remove a wallet
   */
  async removeWallet(walletAddress) {
    try {
      const response = await this.api.request(`/wallets/${walletAddress}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Remove wallet from list
        this.wallets = this.wallets.filter(w => w.address !== walletAddress);
        
        // If removed wallet was selected, select another one
        if (this.selectedWallet === walletAddress) {
          this.selectedWallet = this.wallets.length > 0 ? this.wallets[0].address : null;
        }
        
        // Update UI
        this.updateWalletsUI();
        
        // If we still have a selected wallet, load its data
        if (this.selectedWallet) {
          this.loadTokenBalances(this.selectedWallet);
          this.loadHistoricalBalances(this.selectedWallet);
        } else {
          // Clear data if no wallets left
          this.tokenBalances = {};
          this.historicalBalances = {};
          this.updateTokenBalancesUI();
          this.updateBalanceHistoryChart();
        }
        
        // Show success message
        this.showNotification('Wallet removed successfully', 'success');
      } else {
        throw new Error(response.message || 'Failed to remove wallet');
      }
    } catch (error) {
      console.error('Error removing wallet:', error);
      this.showNotification('Failed to remove wallet: ' + error.message, 'error');
      throw error;
    }
  }
  
  /**
   * Update wallets UI
   */
  updateWalletsUI() {
    const container = this.elements.walletsContainer;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Show empty state if no wallets
    if (this.wallets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-wallet"></i>
          </div>
          <h3>No Wallets Added</h3>
          <p>Add a wallet to start trading</p>
          <button id="add-wallet-btn" class="btn btn-primary">Add Wallet</button>
        </div>
      `;
      
      // Hide other containers
      if (this.elements.tokenBalancesContainer) {
        this.elements.tokenBalancesContainer.style.display = 'none';
      }
      if (this.elements.walletStatsContainer) {
        this.elements.walletStatsContainer.style.display = 'none';
      }
      
      return;
    }
    
    // Show wallet containers
    if (this.elements.tokenBalancesContainer) {
      this.elements.tokenBalancesContainer.style.display = 'block';
    }
    if (this.elements.walletStatsContainer) {
      this.elements.walletStatsContainer.style.display = 'block';
    }
    
    // Create wallet list header
    const header = document.createElement('div');
    header.className = 'wallets-header';
    header.innerHTML = `
      <h3>Your Wallets</h3>
      <button id="add-wallet-btn" class="btn btn-sm btn-primary">
        <i class="fas fa-plus"></i> Add Wallet
      </button>
    `;
    container.appendChild(header);
    
    // Create wallets list
    const walletsList = document.createElement('div');
    walletsList.className = 'wallets-list';
    
    this.wallets.forEach(wallet => {
      const walletItem = document.createElement('div');
      walletItem.className = `wallet-item ${wallet.address === this.selectedWallet ? 'selected' : ''}`;
      walletItem.dataset.address = wallet.address;
      
      // Format wallet address for display
      const formattedAddress = this.formatWalletAddress(wallet.address);
      
      // Determine wallet status indicator
      let statusClass = 'status-active';
      let statusText = 'Active';
      
      if (wallet.status === 'low_balance') {
        statusClass = 'status-warning';
        statusText = 'Low Balance';
      } else if (wallet.status === 'error') {
        statusClass = 'status-error';
        statusText = 'Error';
      } else if (wallet.status === 'inactive') {
        statusClass = 'status-inactive';
        statusText = 'Inactive';
      }
      
      walletItem.innerHTML = `
        <div class="wallet-icon">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="wallet-info">
          <div class="wallet-name">${wallet.name}</div>
          <div class="wallet-address">${formattedAddress}</div>
          <div class="wallet-balance">
            $${this.formatCurrency(wallet.usdBalance)}
          </div>
        </div>
        <div class="wallet-status ${statusClass}">
          ${statusText}
        </div>
        <div class="wallet-actions">
          <button class="btn btn-icon copy-address-btn" data-address="${wallet.address}" title="Copy Address">
            <i class="fas fa-copy"></i>
          </button>
          <button class="btn btn-icon remove-wallet-btn" data-address="${wallet.address}" title="Remove Wallet">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      walletsList.appendChild(walletItem);
    });
    
    container.appendChild(walletsList);
  }
  
  /**
   * Update token balances UI
   */
  updateTokenBalancesUI() {
    const container = this.elements.tokenBalancesContainer;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create token balances header
    const header = document.createElement('div');
    header.className = 'token-balances-header';
    header.innerHTML = `<h3>Token Balances</h3>`;
    container.appendChild(header);
    
    // If no token balances
    if (Object.keys(this.tokenBalances).length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">
          <i class="fas fa-coins"></i>
        </div>
        <p>No tokens found in this wallet</p>
      `;
      container.appendChild(emptyState);
      return;
    }
    
    // Create token list
    const tokenList = document.createElement('div');
    tokenList.className = 'token-list';
    
    // Sort tokens by USD value (descending)
    const sortedTokens = Object.entries(this.tokenBalances)
      .sort(([, a], [, b]) => b.usdValue - a.usdValue);
    
    sortedTokens.forEach(([symbol, data]) => {
      const tokenItem = document.createElement('div');
      tokenItem.className = 'token-item';
      
      // Determine price change class
      const priceChangeClass = data.priceChange24h >= 0 ? 'price-up' : 'price-down';
      
      tokenItem.innerHTML = `
        <div class="token-icon">
          <img src="${data.iconUrl || '/images/tokens/default-token.png'}" alt="${symbol}" onerror="this.src='/images/tokens/default-token.png'">
        </div>
        <div class="token-info">
          <div class="token-name">${data.name || symbol}</div>
          <div class="token-amount">${data.amount.toFixed(4)} ${symbol}</div>
        </div>
        <div class="token-value">
          <div class="token-usd-value">$${this.formatCurrency(data.usdValue)}</div>
          <div class="token-price-change ${priceChangeClass}">
            ${data.priceChange24h >= 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%
          </div>
        </div>
      `;
      
      tokenList.appendChild(tokenItem);
    });
    
    container.appendChild(tokenList);
  }
  
  /**
   * Update balance history chart
   */
  updateBalanceHistoryChart() {
    const canvas = this.elements.balanceHistoryChart;
    if (!canvas) return;
    
    // If chart already exists, destroy it
    if (this.chartInstances.balanceHistory) {
      this.chartInstances.balanceHistory.destroy();
    }
    
    // If no historical data
    if (!this.historicalBalances.dates || this.historicalBalances.dates.length === 0) {
      const container = canvas.parentElement;
      const placeholder = document.createElement('div');
      placeholder.className = 'chart-placeholder';
      placeholder.innerHTML = `
        <div class="empty-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <p>No historical data available</p>
      `;
      
      container.innerHTML = '';
      container.appendChild(placeholder);
      return;
    }
    
    // Create chart
    const ctx = canvas.getContext('2d');
    
    this.chartInstances.balanceHistory = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.historicalBalances.dates,
        datasets: [{
          label: 'Wallet Balance (USD)',
          data: this.historicalBalances.values,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '$' + context.parsed.y.toFixed(2);
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              color: 'rgba(160, 174, 192, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            }
          }
        }
      }
    });
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
  
  /**
   * Show error message
   */
  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (this.elements.walletsContainer) {
      this.elements.walletsContainer.innerHTML = '';
      this.elements.walletsContainer.appendChild(errorElement);
    }
  }
  
  /**
   * Format wallet address (show first 6 and last 4 characters)
   */
  formatWalletAddress(address) {
    if (!address) return '';
    if (address.length < 12) return address;
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  /**
   * Format currency with commas
   */
  formatCurrency(value) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Initialize wallet manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on pages that need it
  if (document.getElementById('wallets-container')) {
    window.walletManager = new WalletManager();
  }
});
