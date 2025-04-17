/**
 * SolarBot Trading Monitor
 * Real-time monitoring of trading activity and market opportunities
 */

class TradingMonitor {
  constructor() {
    this.api = window.solarbotApi;
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // Initial delay in ms
    this.opportunities = [];
    this.activeTrades = [];
    this.marketData = {};
    
    // DOM elements
    this.elements = {
      opportunitiesContainer: document.getElementById('arbitrage-opportunities'),
      activeTradesContainer: document.getElementById('active-trades'),
      marketDataContainer: document.getElementById('market-data')
    };
    
    // Initialize the monitor
    this.initialize();
  }
  
  /**
   * Initialize the trading monitor
   */
  async initialize() {
    try {
      // Fetch initial data
      await this.fetchInitialData();
      
      // Connect to WebSocket for real-time updates
      this.connectWebSocket();
      
      // Set up refresh timer (fallback if WebSocket fails)
      this.startRefreshTimer();
      
      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize trading monitor:', error);
    }
  }
  
  /**
   * Fetch initial data from API
   */
  async fetchInitialData() {
    try {
      // Fetch in parallel
      const [
        opportunitiesResponse,
        activeTradesResponse,
        marketDataResponse
      ] = await Promise.all([
        this.api.request('/trading/opportunities'),
        this.api.request('/trading/active-trades'),
        this.api.request('/market/data')
      ]);
      
      // Update data
      this.opportunities = opportunitiesResponse.opportunities || [];
      this.activeTrades = activeTradesResponse.trades || [];
      this.marketData = marketDataResponse.data || {};
      
      // Update UI
      this.updateOpportunitiesUI();
      this.updateActiveTradesUI();
      this.updateMarketDataUI();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }
  
  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket() {
    // Determine WebSocket URL based on environment
    let wsUrl;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      wsUrl = 'ws://localhost:3001/trading-socket';
    } else {
      wsUrl = 'wss://api.solarbot.digitalocean.app/trading-socket';
    }
    
    // Add token for authentication
    const token = localStorage.getItem('solarbot_auth_token');
    if (token) {
      wsUrl += `?token=${token}`;
    }
    
    // Create WebSocket connection
    this.wsConnection = new WebSocket(wsUrl);
    
    // Setup event handlers
    this.wsConnection.onopen = this.handleWebSocketOpen.bind(this);
    this.wsConnection.onmessage = this.handleWebSocketMessage.bind(this);
    this.wsConnection.onclose = this.handleWebSocketClose.bind(this);
    this.wsConnection.onerror = this.handleWebSocketError.bind(this);
  }
  
  /**
   * Handle WebSocket open event
   */
  handleWebSocketOpen() {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;
    
    // Subscribe to notifications
    this.sendWebSocketMessage({
      type: 'subscribe',
      channels: ['opportunities', 'trades', 'market']
    });
  }
  
  /**
   * Handle WebSocket message event
   */
  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'opportunity':
          this.handleOpportunityUpdate(message.data);
          break;
        case 'trade':
          this.handleTradeUpdate(message.data);
          break;
        case 'market':
          this.handleMarketUpdate(message.data);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  handleWebSocketClose(event) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  handleWebSocketError(error) {
    console.error('WebSocket error:', error);
  }
  
  /**
   * Attempt to reconnect to WebSocket
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Exponential backoff
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('Maximum reconnect attempts reached. Falling back to polling.');
    }
  }
  
  /**
   * Send message via WebSocket
   */
  sendWebSocketMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    }
  }
  
  /**
   * Start refresh timer (fallback if WebSocket fails)
   */
  startRefreshTimer() {
    // Refresh data every 30 seconds as fallback
    setInterval(() => {
      if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
        this.fetchInitialData();
      }
    }, 30000);
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for manual refresh requests
    const refreshButton = document.getElementById('refresh-trading-data');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.fetchInitialData());
    }
    
    // Listen for trade action buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('execute-trade-btn')) {
        const opportunityId = e.target.dataset.opportunityId;
        this.executeTrade(opportunityId);
      } else if (e.target.classList.contains('cancel-trade-btn')) {
        const tradeId = e.target.dataset.tradeId;
        this.cancelTrade(tradeId);
      }
    });
  }
  
  /**
   * Execute a trade for an opportunity
   */
  async executeTrade(opportunityId) {
    try {
      const result = await this.api.request(`/trading/execute/${opportunityId}`, {
        method: 'POST'
      });
      
      if (result.success) {
        // Show success notification
        this.showNotification('Trade executed successfully', 'success');
        
        // Update active trades
        if (result.trade) {
          this.activeTrades.push(result.trade);
          this.updateActiveTradesUI();
        }
        
        // Remove opportunity from list
        this.opportunities = this.opportunities.filter(opp => opp.id !== opportunityId);
        this.updateOpportunitiesUI();
      } else {
        this.showNotification(`Failed to execute trade: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      this.showNotification('Error executing trade', 'error');
    }
  }
  
  /**
   * Cancel an active trade
   */
  async cancelTrade(tradeId) {
    try {
      const result = await this.api.request(`/trading/cancel/${tradeId}`, {
        method: 'POST'
      });
      
      if (result.success) {
        // Show success notification
        this.showNotification('Trade canceled successfully', 'success');
        
        // Remove trade from active trades
        this.activeTrades = this.activeTrades.filter(trade => trade.id !== tradeId);
        this.updateActiveTradesUI();
      } else {
        this.showNotification(`Failed to cancel trade: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error canceling trade:', error);
      this.showNotification('Error canceling trade', 'error');
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
      if (notification.parentNode) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  /**
   * Handle opportunity update from WebSocket
   */
  handleOpportunityUpdate(data) {
    if (data.action === 'add') {
      // Add new opportunity
      this.opportunities.unshift(data.opportunity);
      // Limit to 10 opportunities
      if (this.opportunities.length > 10) {
        this.opportunities = this.opportunities.slice(0, 10);
      }
    } else if (data.action === 'remove') {
      // Remove opportunity
      this.opportunities = this.opportunities.filter(opp => opp.id !== data.id);
    } else if (data.action === 'update') {
      // Update opportunity
      const index = this.opportunities.findIndex(opp => opp.id === data.opportunity.id);
      if (index !== -1) {
        this.opportunities[index] = data.opportunity;
      }
    }
    
    // Update UI
    this.updateOpportunitiesUI();
    
    // Play notification sound for new opportunities
    if (data.action === 'add') {
      this.playNotificationSound();
    }
  }
  
  /**
   * Handle trade update from WebSocket
   */
  handleTradeUpdate(data) {
    if (data.action === 'add') {
      // Add new trade
      this.activeTrades.unshift(data.trade);
    } else if (data.action === 'remove') {
      // Remove trade
      this.activeTrades = this.activeTrades.filter(trade => trade.id !== data.id);
    } else if (data.action === 'update') {
      // Update trade
      const index = this.activeTrades.findIndex(trade => trade.id === data.trade.id);
      if (index !== -1) {
        this.activeTrades[index] = data.trade;
      }
    }
    
    // Update UI
    this.updateActiveTradesUI();
  }
  
  /**
   * Handle market update from WebSocket
   */
  handleMarketUpdate(data) {
    // Update market data
    this.marketData = {...this.marketData, ...data};
    
    // Update UI
    this.updateMarketDataUI();
  }
  
  /**
   * Play notification sound
   */
  playNotificationSound() {
    // Check if we can play sounds
    if (!this.notificationSound) {
      this.notificationSound = new Audio('/sounds/notification.mp3');
    }
    
    // Play the sound
    this.notificationSound.play().catch(e => {
      console.log('Could not play notification sound:', e);
    });
  }
  
  /**
   * Update opportunities UI
   */
  updateOpportunitiesUI() {
    const container = this.elements.opportunitiesContainer;
    if (!container) return;
    
    // Clear current content
    container.innerHTML = '';
    
    // Show empty state if no opportunities
    if (this.opportunities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3>No Active Opportunities</h3>
          <p>Bot is scanning for profitable arbitrage opportunities</p>
        </div>
      `;
      return;
    }
    
    // Create opportunities list
    this.opportunities.forEach(opportunity => {
      const card = document.createElement('div');
      card.className = 'opportunity-card';
      
      // Calculate formatting
      const profitPercentClass = opportunity.profitPercent >= 2 ? 'high-profit' : 'normal-profit';
      
      card.innerHTML = `
        <div class="opportunity-header">
          <div class="opportunity-pair">${opportunity.pair}</div>
          <div class="opportunity-time">${this.formatTimeAgo(opportunity.discoveredAt)}</div>
        </div>
        <div class="opportunity-profit ${profitPercentClass}">
          <div class="profit-percent">${opportunity.profitPercent.toFixed(2)}%</div>
          <div class="profit-amount">$${opportunity.estimatedProfit.toFixed(2)}</div>
        </div>
        <div class="opportunity-details">
          <div class="route-info">
            <div class="exchange">${opportunity.sourceExchange}</div>
            <div class="arrow">→</div>
            <div class="exchange">${opportunity.targetExchange}</div>
          </div>
          <div class="price-info">
            <div>Buy: $${opportunity.buyPrice.toFixed(6)}</div>
            <div>Sell: $${opportunity.sellPrice.toFixed(6)}</div>
          </div>
        </div>
        <div class="opportunity-actions">
          <button class="btn btn-primary execute-trade-btn" data-opportunity-id="${opportunity.id}">
            Execute Trade
          </button>
          <button class="btn btn-outline details-btn" data-opportunity-id="${opportunity.id}">
            Details
          </button>
        </div>
      `;
      
      container.appendChild(card);
    });
  }
  
  /**
   * Update active trades UI
   */
  updateActiveTradesUI() {
    const container = this.elements.activeTradesContainer;
    if (!container) return;
    
    // Clear current content
    container.innerHTML = '';
    
    // Show empty state if no active trades
    if (this.activeTrades.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <h3>No Active Trades</h3>
          <p>You don't have any trades in progress</p>
        </div>
      `;
      return;
    }
    
    // Create trades list
    this.activeTrades.forEach(trade => {
      const card = document.createElement('div');
      card.className = 'trade-card';
      
      // Calculate progress
      const progressPercent = this.calculateTradeProgress(trade);
      
      card.innerHTML = `
        <div class="trade-header">
          <div class="trade-id">#${trade.id.slice(0, 8)}</div>
          <div class="trade-status">${trade.status}</div>
        </div>
        <div class="trade-info">
          <div class="trade-pair">${trade.pair}</div>
          <div class="trade-amount">${trade.amount} ${trade.pair.split('/')[0]}</div>
        </div>
        <div class="trade-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-text">${progressPercent}% Complete</div>
        </div>
        <div class="trade-actions">
          ${trade.status !== 'completed' && trade.status !== 'failed' ? 
            `<button class="btn btn-outline cancel-trade-btn" data-trade-id="${trade.id}">
              Cancel
            </button>` : ''
          }
        </div>
      `;
      
      container.appendChild(card);
    });
  }
  
  /**
   * Update market data UI
   */
  updateMarketDataUI() {
    const container = this.elements.marketDataContainer;
    if (!container) return;
    
    // Clear current content
    container.innerHTML = '';
    
    // Create market data cards
    Object.entries(this.marketData).forEach(([pair, data]) => {
      const card = document.createElement('div');
      card.className = 'market-card';
      
      // Determine price change class
      const priceChangeClass = data.priceChange24h >= 0 ? 'positive' : 'negative';
      const priceChangeIcon = data.priceChange24h >= 0 ? '↑' : '↓';
      
      card.innerHTML = `
        <div class="market-pair">${pair}</div>
        <div class="market-price">$${data.price.toFixed(data.price < 1 ? 6 : 2)}</div>
        <div class="market-change ${priceChangeClass}">
          ${priceChangeIcon} ${Math.abs(data.priceChange24h).toFixed(2)}%
        </div>
        <div class="market-volume">Vol: $${this.formatNumberWithK(data.volume24h)}</div>
      `;
      
      container.appendChild(card);
    });
  }
  
  /**
   * Calculate trade progress percentage
   */
  calculateTradeProgress(trade) {
    const statuses = {
      'initiated': 10,
      'buying': 30,
      'bought': 50,
      'selling': 70,
      'sold': 90,
      'completed': 100,
      'failed': 100
    };
    
    return statuses[trade.status] || 0;
  }
  
  /**
   * Format time ago string
   */
  formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days}d ago`;
    }
  }
  
  /**
   * Format number with K/M for thousands/millions
   */
  formatNumberWithK(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(0);
    }
  }
}

// Initialize trading monitor when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on pages that need it
  if (document.getElementById('trading-monitor')) {
    window.tradingMonitor = new TradingMonitor();
  }
});
