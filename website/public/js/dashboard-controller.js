/**
 * SolarBot Dashboard Controller
 * Manages and updates the dashboard UI based on API data
 */

class DashboardController {
  constructor() {
    this.api = window.solarbotApi;
    this.authService = window.authService;
    this.chartInstances = {};
    
    // Dashboard sections
    this.sections = {
      stats: document.getElementById('stats-grid'),
      tradingHistory: document.getElementById('trading-history'),
      wallets: document.getElementById('wallets-section'),
      botControls: document.getElementById('bot-controls'),
      performanceMetrics: document.getElementById('performance-metrics')
    };
    
    // Initialize the dashboard
    this.initialize();
  }
  
  /**
   * Update dashboard stats with data from API
   * @param {Object} stats - Dashboard statistics
   */
  updateStats(stats) {
    if (!this.sections.stats || !stats) return;
    
    // Clear previous stats
    this.sections.stats.innerHTML = '';
    
    // Create stats cards
    const statsData = [
      { title: 'Total Profit', value: `$${stats.totalProfit.toFixed(2)}`, change: stats.profitChange },
      { title: 'Total Trades', value: stats.totalTrades, change: stats.tradesChange },
      { title: 'Success Rate', value: `${stats.successRate}%`, change: stats.successRateChange },
      { title: 'Avg. ROI', value: `${stats.averageRoi}%`, change: stats.roiChange }
    ];
    
    // Add stat cards to the grid
    statsData.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.className = 'stat-card';
      
      const changeClass = parseFloat(stat.change) >= 0 ? 'positive' : 'negative';
      const changeIcon = parseFloat(stat.change) >= 0 ? '↑' : '↓';
      
      statCard.innerHTML = `
        <div class="stat-title">${stat.title}</div>
        <div class="stat-value">${stat.value}</div>
        <div class="stat-change ${changeClass}">
          ${changeIcon} ${Math.abs(parseFloat(stat.change))}%
        </div>
      `;
      
      this.sections.stats.appendChild(statCard);
    });
  }
  
  /**
   * Update trading history with data from API
   * @param {Object} data - Trading history data
   */
  updateTradingHistory(data) {
    if (!this.sections.tradingHistory || !data || !data.trades) return;
    
    const tableBody = this.sections.tradingHistory.querySelector('tbody');
    if (!tableBody) return;
    
    // Clear previous history
    tableBody.innerHTML = '';
    
    // If no trades, show empty state
    if (data.trades.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-state';
      emptyRow.innerHTML = `
        <td colspan="6" class="empty-message">
          <div>No trading history available</div>
          <small>Start your bot to begin trading</small>
        </td>
      `;
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // Add trades to the table
    data.trades.forEach(trade => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(trade.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Determine profit class
      const profitClass = parseFloat(trade.profit) >= 0 ? 'positive' : 'negative';
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>
          <span class="trade-type ${trade.type.toLowerCase()}">${trade.type}</span>
        </td>
        <td>${trade.pair}</td>
        <td>${trade.amount} ${trade.pair.split('/')[0]}</td>
        <td class="${profitClass}">${parseFloat(trade.profit) >= 0 ? '+' : ''}$${parseFloat(trade.profit).toFixed(2)}</td>
        <td>${trade.status}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  /**
   * Initialize the dashboard
   */
  async initialize() {
    // Check authentication
    if (!this.authService.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    
    this.setupEventListeners();
    await this.loadDashboardData();
    this.updateUserInfo();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Bot control buttons
    const startButton = document.getElementById('start-bot');
    const stopButton = document.getElementById('stop-bot');
    
    if (startButton) {
      startButton.addEventListener('click', () => this.startBot());
    }
    
    if (stopButton) {
      stopButton.addEventListener('click', () => this.stopBot());
    }
    
    // Wallet management
    const addWalletForm = document.getElementById('add-wallet-form');
    if (addWalletForm) {
      addWalletForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addWallet(new FormData(addWalletForm));
      });
    }
    
    // Refresh data button
    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadDashboardData());
    }
    
    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => this.logout());
    }
  }
  
  /**
   * Update user information in the dashboard
   */
  updateUserInfo() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    // Update user name and plan
    const userNameElement = document.getElementById('user-name');
    const userPlanElement = document.getElementById('user-plan');
    
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
    
    if (userPlanElement) {
      const planDetails = this.authService.getPlanDetails(user.plan) || {};
      userPlanElement.textContent = planDetails.name || user.plan;
    }
  }
  
  /**
   * Load all dashboard data from API
   */
  async loadDashboardData() {
    try {
      this.showLoadingState();
      
      // Fetch data in parallel
      const [stats, tradingHistory, wallets, botStatus] = await Promise.all([
        this.api.getDashboardStats(),
        this.api.getTradingHistory({ limit: 10 }),
        this.api.getWallets(),
        this.api.getBotStatus()
      ]);
      
      // Update UI
      this.updateStats(stats);
      this.updateTradingHistory(tradingHistory);
      this.updateWallets(wallets);
      this.updateBotStatus(botStatus);
      this.initializeCharts(stats);
      
      this.hideLoadingState();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showErrorMessage('Failed to load dashboard data. Please try again.');
      this.hideLoadingState();
    }
  }
  
  /**
   * Show loading state in dashboard
   */
  showLoadingState() {
    // Add loading class to main sections
    Object.values(this.sections).forEach(section => {
      if (section) {
        section.classList.add('loading');
      }
    });
  }
  
  /**
   * Hide loading state in dashboard
   */
  hideLoadingState() {
    // Remove loading class from main sections
    Object.values(this.sections).forEach(section => {
      if (section) {
        section.classList.remove('loading');
      }
    });
  }
  
  /**
   * Show error message
   */
  showErrorMessage(message) {
    const errorElement = document.getElementById('dashboard-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  /**
   * Hide error message
   */
  hideErrorMessage() {
    const errorElement = document.getElementById('dashboard-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * Log the user out
   */
  async logout() {
    await this.authService.logout();
    window.location.href = 'login.html';
  }
}
