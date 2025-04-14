/**
 * SolarBot Advanced Analytics Core
 * Foundation for all analytics capabilities
 */

class AnalyticsCore {
  constructor() {
    this.api = window.solarbotApi;
    this.dataCache = {};
    this.chartInstances = {};
    this.dateRanges = {
      '24h': { label: 'Last 24 Hours', days: 1 },
      '7d': { label: 'Last 7 Days', days: 7 },
      '30d': { label: 'Last 30 Days', days: 30 },
      '90d': { label: 'Last 90 Days', days: 90 },
      'all': { label: 'All Time', days: 0 }
    };
    
    // Default settings
    this.settings = {
      currentDateRange: '7d',
      refreshInterval: 300000, // 5 minutes
      autoRefresh: true,
      showTooltips: true,
      darkMode: document.body.classList.contains('dark-mode')
    };
    
    // Load user settings
    this.loadSettings();
    
    // Initialize listeners
    this.setupEventListeners();
  }
  
  /**
   * Load saved user settings
   */
  loadSettings() {
    const savedSettings = localStorage.getItem('analytics_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        this.settings = {...this.settings, ...parsed};
      } catch (error) {
        console.error('Failed to parse analytics settings:', error);
      }
    }
  }
  
  /**
   * Save user settings
   */
  saveSettings() {
    localStorage.setItem('analytics_settings', JSON.stringify(this.settings));
  }
  
  /**
   * Setup event listeners for analytics components
   */
  setupEventListeners() {
    // Listen for date range changes
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('date-range-option')) {
        const range = e.target.dataset.range;
        if (range && this.dateRanges[range]) {
          this.setDateRange(range);
        }
      }
    });
    
    // Listen for refresh button
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAllData());
    }
    
    // Auto-refresh data
    if (this.settings.autoRefresh) {
      this.startAutoRefresh();
    }
    
    // Listen for theme changes to update charts
    window.addEventListener('theme-changed', () => {
      this.settings.darkMode = document.body.classList.contains('dark-mode');
      this.updateChartsTheme();
      this.saveSettings();
    });
  }
  
  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshAllData();
    }, this.settings.refreshInterval);
  }
  
  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Set date range and refresh data
   */
  setDateRange(range) {
    if (!this.dateRanges[range]) return;
    
    this.settings.currentDateRange = range;
    this.saveSettings();
    
    // Update active state in UI
    const rangeOptions = document.querySelectorAll('.date-range-option');
    rangeOptions.forEach(option => {
      if (option.dataset.range === range) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // Refresh data with new date range
    this.refreshAllData();
  }
  
  /**
   * Get date range parameters
   */
  getDateRangeParams() {
    const range = this.dateRanges[this.settings.currentDateRange];
    const end = new Date();
    let start;
    
    if (range.days === 0) {
      // All time - use a far past date
      start = new Date(2020, 0, 1); // Start from 2020-01-01
    } else {
      start = new Date();
      start.setDate(start.getDate() - range.days);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days: range.days || 'all'
    };
  }
  
  /**
   * Refresh all analytics data
   */
  async refreshAllData() {
    // This will be implemented by derived classes
    console.log('Base refreshAllData called');
  }
  
  /**
   * Update charts with current theme
   */
  updateChartsTheme() {
    const isDark = this.settings.darkMode;
    
    // Default chart theme options
    const theme = {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      textColor: isDark ? '#E5E7EB' : '#374151',
      axisColor: isDark ? '#9CA3AF' : '#6B7280',
      tooltipBackgroundColor: isDark ? '#374151' : '#FFFFFF',
      tooltipBorderColor: isDark ? '#4B5563' : '#E5E7EB'
    };
    
    // Apply theme to all chart instances
    Object.values(this.chartInstances).forEach(chart => {
      if (!chart) return;
      
      // Update global options
      chart.options.scales.x.grid.color = theme.gridColor;
      chart.options.scales.x.ticks.color = theme.axisColor;
      chart.options.scales.y.grid.color = theme.gridColor;
      chart.options.scales.y.ticks.color = theme.axisColor;
      
      // Update tooltip options
      if (chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = theme.tooltipBackgroundColor;
        chart.options.plugins.tooltip.borderColor = theme.tooltipBorderColor;
        chart.options.plugins.tooltip.titleColor = theme.textColor;
        chart.options.plugins.tooltip.bodyColor = theme.textColor;
      }
      
      // Update legend options
      if (chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = theme.textColor;
      }
      
      chart.update();
    });
  }
  
  /**
   * Generate chart colors palette
   */
  generateColorPalette(numColors, opacity = 1) {
    const isDark = this.settings.darkMode;
    
    // Base colors for light and dark themes
    const baseColors = isDark ? [
      'rgba(99, 102, 241, ' + opacity + ')',   // Indigo
      'rgba(16, 185, 129, ' + opacity + ')',   // Emerald
      'rgba(239, 68, 68, ' + opacity + ')',    // Red
      'rgba(245, 158, 11, ' + opacity + ')',   // Amber
      'rgba(139, 92, 246, ' + opacity + ')',   // Violet
      'rgba(20, 184, 166, ' + opacity + ')',   // Teal
      'rgba(236, 72, 153, ' + opacity + ')',   // Pink
      'rgba(59, 130, 246, ' + opacity + ')',   // Blue
      'rgba(249, 115, 22, ' + opacity + ')',   // Orange
      'rgba(168, 85, 247, ' + opacity + ')'    // Purple
    ] : [
      'rgba(79, 70, 229, ' + opacity + ')',   // Indigo
      'rgba(4, 120, 87, ' + opacity + ')',     // Emerald
      'rgba(220, 38, 38, ' + opacity + ')',    // Red
      'rgba(217, 119, 6, ' + opacity + ')',    // Amber
      'rgba(124, 58, 237, ' + opacity + ')',   // Violet
      'rgba(15, 118, 110, ' + opacity + ')',   // Teal
      'rgba(219, 39, 119, ' + opacity + ')',   // Pink
      'rgba(37, 99, 235, ' + opacity + ')',    // Blue
      'rgba(234, 88, 12, ' + opacity + ')',    // Orange
      'rgba(147, 51, 234, ' + opacity + ')'    // Purple
    ];
    
    // If we need more colors than our base set, generate additional ones
    if (numColors <= baseColors.length) {
      return baseColors.slice(0, numColors);
    }
    
    // Generate additional colors by interpolating between base colors
    const palette = [...baseColors];
    
    while (palette.length < numColors) {
      const idx = palette.length % baseColors.length;
      const nextIdx = (idx + 1) % baseColors.length;
      
      // Extract RGB values
      const color1 = baseColors[idx].match(/\d+/g).map(Number);
      const color2 = baseColors[nextIdx].match(/\d+/g).map(Number);
      
      // Create a gradient between the two colors
      const r = Math.floor((color1[0] + color2[0]) / 2);
      const g = Math.floor((color1[1] + color2[1]) / 2);
      const b = Math.floor((color1[2] + color2[2]) / 2);
      
      palette.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    
    return palette.slice(0, numColors);
  }
  
  /**
   * Format currency value
   */
  formatCurrency(value, decimals = 2) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return formatter.format(value);
  }
  
  /**
   * Format percentage value
   */
  formatPercentage(value, decimals = 2) {
    return value.toFixed(decimals) + '%';
  }
  
  /**
   * Format large numbers with K/M/B suffixes
   */
  formatCompactNumber(value) {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  }
  
  /**
   * Format date for display
   */
  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    if (format === 'short') {
      return d.toLocaleDateString();
    }
    
    if (format === 'time') {
      return d.toLocaleTimeString();
    }
    
    if (format === 'full') {
      return d.toLocaleString();
    }
    
    if (format === 'month') {
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
    
    if (format === 'weekday') {
      return d.toLocaleString('default', { weekday: 'short' });
    }
    
    return d.toLocaleString();
  }
  
  /**
   * Create loading indicator
   */
  showLoading(container) {
    if (!container) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'analytics-loading';
    loadingElement.innerHTML = `
      <div class="spinner"></div>
      <p>Loading analytics data...</p>
    `;
    
    container.innerHTML = '';
    container.appendChild(loadingElement);
  }
  
  /**
   * Show error message
   */
  showError(container, message) {
    if (!container) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'analytics-error';
    errorElement.innerHTML = `
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <p>${message || 'Failed to load analytics data'}</p>
      <button class="btn btn-sm btn-primary retry-btn">Retry</button>
    `;
    
    container.innerHTML = '';
    container.appendChild(errorElement);
    
    // Add retry functionality
    const retryBtn = errorElement.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.refreshAllData());
    }
  }
}

// Make available globally
window.AnalyticsCore = AnalyticsCore;
