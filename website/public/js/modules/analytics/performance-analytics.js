/**
 * SolarBot Performance Analytics
 * Advanced performance metrics and visualizations
 */

class PerformanceAnalytics extends AnalyticsCore {
  constructor() {
    super();
    
    // Performance metrics storage
    this.metrics = {
      profitByDay: {},
      successRateByPair: {},
      volumeByExchange: {},
      profitLossDistribution: {},
      hourlyPerformance: {},
      riskAdjustedReturns: {}
    };
    
    // DOM elements
    this.containers = {
      profitChart: document.getElementById('profit-chart'),
      successRateChart: document.getElementById('success-rate-chart'),
      volumeChart: document.getElementById('volume-chart'),
      profitDistribution: document.getElementById('profit-distribution'),
      hourlyHeatmap: document.getElementById('hourly-heatmap'),
      riskReturnChart: document.getElementById('risk-return-chart'),
      topPairs: document.getElementById('top-pairs'),
      topExchanges: document.getElementById('top-exchanges')
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize performance analytics
   */
  async initialize() {
    try {
      await this.refreshAllData();
      this.renderDateRangeSelector();
    } catch (error) {
      console.error('Failed to initialize performance analytics:', error);
    }
  }
  
  /**
   * Render date range selector
   */
  renderDateRangeSelector() {
    const container = document.getElementById('date-range-selector');
    if (!container) return;
    
    let html = '<div class="date-range-options">';
    
    Object.entries(this.dateRanges).forEach(([key, range]) => {
      const isActive = key === this.settings.currentDateRange;
      html += `
        <button class="date-range-option ${isActive ? 'active' : ''}" data-range="${key}">
          ${range.label}
        </button>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  /**
   * Refresh all analytics data
   */
  async refreshAllData() {
    try {
      // Show loading indicators
      Object.values(this.containers).forEach(container => {
        if (container) this.showLoading(container);
      });
      
      const dateRange = this.getDateRangeParams();
      
      // Fetch all data in parallel
      const [
        profitData,
        successRateData,
        volumeData,
        profitDistributionData,
        hourlyPerformanceData,
        riskReturnData
      ] = await Promise.all([
        this.fetchProfitData(dateRange),
        this.fetchSuccessRateData(dateRange),
        this.fetchVolumeData(dateRange),
        this.fetchProfitDistributionData(dateRange),
        this.fetchHourlyPerformanceData(dateRange),
        this.fetchRiskReturnData(dateRange)
      ]);
      
      // Update metrics
      this.metrics.profitByDay = profitData || {};
      this.metrics.successRateByPair = successRateData || {};
      this.metrics.volumeByExchange = volumeData || {};
      this.metrics.profitLossDistribution = profitDistributionData || {};
      this.metrics.hourlyPerformance = hourlyPerformanceData || {};
      this.metrics.riskAdjustedReturns = riskReturnData || {};
      
      // Render all charts
      this.renderProfitChart();
      this.renderSuccessRateChart();
      this.renderVolumeChart();
      this.renderProfitDistribution();
      this.renderHourlyHeatmap();
      this.renderRiskReturnChart();
      this.renderTopPairs();
      this.renderTopExchanges();
      
    } catch (error) {
      console.error('Failed to refresh analytics data:', error);
      
      // Show error in all containers
      Object.values(this.containers).forEach(container => {
        if (container) this.showError(container, 'Failed to load analytics data');
      });
    }
  }
  
  /**
   * Fetch profit data from API
   */
  async fetchProfitData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/profit?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profit data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch success rate data from API
   */
  async fetchSuccessRateData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/success-rate?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch success rate data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch volume data from API
   */
  async fetchVolumeData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/volume?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch volume data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch profit distribution data from API
   */
  async fetchProfitDistributionData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/profit-distribution?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profit distribution data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch hourly performance data from API
   */
  async fetchHourlyPerformanceData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/hourly-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch hourly performance data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch risk-adjusted return data from API
   */
  async fetchRiskReturnData(dateRange) {
    try {
      const response = await this.api.request(
        `/analytics/risk-return?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch risk-return data:', error);
      throw error;
    }
  }
  
  /**
   * Render profit chart
   */
  renderProfitChart() {
    const container = this.containers.profitChart;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.profitByDay || !this.metrics.profitByDay.dates || this.metrics.profitByDay.dates.length === 0) {
      this.showError(container, 'No profit data available');
      return;
    }
    
    // Prepare chart data
    const data = {
      labels: this.metrics.profitByDay.dates,
      datasets: [
        {
          label: 'Daily Profit',
          data: this.metrics.profitByDay.profits,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Cumulative Profit',
          data: this.metrics.profitByDay.cumulativeProfits,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.profitChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'Profit Performance',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw;
                return `${label}: ${this.formatCurrency(value)}`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              color: this.settings.darkMode ? '#E5E7EB' : '#374151',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.getTimeUnit(),
              tooltipFormat: 'MMM d, yyyy'
            },
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280'
            }
          },
          y: {
            beginAtZero: true,
            position: 'left',
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatCurrency(value)
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              display: false
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }
  
  /**
   * Determine appropriate time unit based on date range
   */
  getTimeUnit() {
    const range = this.dateRanges[this.settings.currentDateRange];
    
    if (range.days <= 1) return 'hour';
    if (range.days <= 14) return 'day';
    if (range.days <= 90) return 'week';
    return 'month';
  }
  
  /**
   * Render success rate chart
   */
  renderSuccessRateChart() {
    const container = this.containers.successRateChart;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.successRateByPair || !this.metrics.successRateByPair.pairs || this.metrics.successRateByPair.pairs.length === 0) {
      this.showError(container, 'No success rate data available');
      return;
    }
    
    // Prepare chart data
    const pairs = this.metrics.successRateByPair.pairs;
    const successRates = this.metrics.successRateByPair.rates;
    const trades = this.metrics.successRateByPair.trades;
    
    // Generate colors for bars
    const colors = this.generateColorPalette(pairs.length, 0.7);
    const borderColors = colors.map(color => color.replace(', 0.7)', ', 1)'));
    
    const data = {
      labels: pairs,
      datasets: [
        {
          label: 'Success Rate',
          data: successRates,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 'flex',
          maxBarThickness: 40
        }
      ]
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.successRateChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Success Rate by Trading Pair',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw;
                const pairTrades = trades[context.dataIndex];
                return [
                  `${label}: ${this.formatPercentage(value)}`,
                  `Total Trades: ${pairTrades}`
                ];
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }
  
  /**
   * Render volume chart
   */
  renderVolumeChart() {
    const container = this.containers.volumeChart;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.volumeByExchange || !this.metrics.volumeByExchange.dates || this.metrics.volumeByExchange.dates.length === 0) {
      this.showError(container, 'No volume data available');
      return;
    }
    
    // Prepare chart data
    const dates = this.metrics.volumeByExchange.dates;
    const exchanges = this.metrics.volumeByExchange.exchanges;
    const volumeData = this.metrics.volumeByExchange.volumes;
    
    // Generate colors for each exchange
    const colors = this.generateColorPalette(exchanges.length, 0.7);
    
    // Create datasets for each exchange
    const datasets = exchanges.map((exchange, index) => ({
      label: exchange,
      data: volumeData[index],
      backgroundColor: colors[index],
      borderColor: colors[index].replace(', 0.7)', ', 1)'),
      borderWidth: 1,
      stack: 'stack0'
    }));
    
    const data = {
      labels: dates,
      datasets: datasets
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.volumeChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'Trading Volume by Exchange',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw;
                return `${label}: ${this.formatCurrency(value)}`;
              },
              footer: (tooltipItems) => {
                let total = 0;
                tooltipItems.forEach(item => {
                  total += item.parsed.y;
                });
                return `Total: ${this.formatCurrency(total)}`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              color: this.settings.darkMode ? '#E5E7EB' : '#374151',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.getTimeUnit(),
              tooltipFormat: 'MMM d, yyyy'
            },
            grid: {
              display: false,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }
  
  /**
   * Render profit distribution
   */
  renderProfitDistribution() {
    const container = this.containers.profitDistribution;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.profitLossDistribution || !this.metrics.profitLossDistribution.buckets || this.metrics.profitLossDistribution.buckets.length === 0) {
      this.showError(container, 'No profit distribution data available');
      return;
    }
    
    // Prepare chart data
    const buckets = this.metrics.profitLossDistribution.buckets; // Bucket labels (e.g., "-10 to -5", "-5 to 0", etc.)
    const counts = this.metrics.profitLossDistribution.counts;  // Count of trades in each bucket
    const profits = this.metrics.profitLossDistribution.values;  // Average profit value for each bucket
    
    // Generate colors based on profit (red for negative, green for positive)
    const colors = buckets.map((bucket, index) => {
      // Determine if this bucket represents negative or positive profits
      const isNegative = bucket.includes('-') && !bucket.includes('to 0');
      const isZero = bucket.includes('0 to') || bucket.includes('to 0');
      
      if (isNegative) {
        // Red gradient for losses with intensity based on value
        const intensity = Math.min(0.9, 0.4 + (Math.abs(profits[index]) / 100) * 0.5);
        return `rgba(239, 68, 68, ${intensity})`; // Red
      } else if (isZero) {
        return 'rgba(107, 114, 128, 0.6)'; // Gray for near-zero profit
      } else {
        // Green gradient for profits with intensity based on value
        const intensity = Math.min(0.9, 0.4 + (profits[index] / 100) * 0.5);
        return `rgba(16, 185, 129, ${intensity})`; // Green
      }
    });
    
    // Prepare chart data
    const data = {
      labels: buckets,
      datasets: [
        {
          label: 'Number of Trades',
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace(/[^,]+(?=\))/, '1')),
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 'flex',
          maxBarThickness: 50
        }
      ]
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.profitDistribution = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Profit Distribution',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              label: (context) => {
                const value = context.raw;
                const avgProfit = profits[context.dataIndex];
                return [
                  `Number of Trades: ${value}`,
                  `Average Profit: ${this.formatCurrency(avgProfit)}`
                ];
              }
            }
          },
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                xMin: buckets.findIndex(b => b.includes('0 to')),
                xMax: buckets.findIndex(b => b.includes('0 to')),
                borderColor: this.settings.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  content: 'Break Even',
                  display: true,
                  position: 'top',
                  backgroundColor: 'transparent',
                  color: this.settings.darkMode ? '#E5E7EB' : '#374151',
                  font: {
                    style: 'italic'
                  }
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              precision: 0
            }
          }
        }
      }
    });
  }
  
  /**
   * Render hourly heatmap
   */
  renderHourlyHeatmap() {
    const container = this.containers.hourlyHeatmap;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.hourlyPerformance || !this.metrics.hourlyPerformance.hours || this.metrics.hourlyPerformance.hours.length === 0) {
      this.showError(container, 'No hourly performance data available');
      return;
    }
    
    // Prepare chart data
    const hours = this.metrics.hourlyPerformance.hours;  // 0-23 hours of day
    const days = this.metrics.hourlyPerformance.days;    // Days of week (0=Sunday, 6=Saturday)
    const profits = this.metrics.hourlyPerformance.profits; // 2D array [day][hour] of profit values
    
    // Process data for heatmap
    const labels = {
      x: hours.map(h => `${h}:00`),
      y: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    
    // Find min/max profit for color scaling
    let minProfit = 0;
    let maxProfit = 0;
    
    profits.forEach(dayProfits => {
      dayProfits.forEach(profit => {
        if (profit < minProfit) minProfit = profit;
        if (profit > maxProfit) maxProfit = profit;
      });
    });
    
    // Generate dataset for heatmap
    const dataset = [];
    profits.forEach((dayProfits, dayIndex) => {
      dayProfits.forEach((profit, hourIndex) => {
        dataset.push({
          x: hourIndex,
          y: dayIndex,
          v: profit // v is the actual value for custom tooltips
        });
      });
    });
    
    // Create color gradient function
    const getColor = (value) => {
      // Normalize value between -1 and 1
      const absMax = Math.max(Math.abs(minProfit), Math.abs(maxProfit));
      const normalizedValue = absMax === 0 ? 0 : value / absMax;
      
      if (normalizedValue < 0) {
        // Red for negative (losses)
        const intensity = Math.min(0.9, 0.3 + Math.abs(normalizedValue) * 0.7);
        return `rgba(239, 68, 68, ${intensity})`; // Red
      } else if (normalizedValue === 0) {
        return 'rgba(107, 114, 128, 0.3)'; // Gray for zero
      } else {
        // Green for positive (profits)
        const intensity = Math.min(0.9, 0.3 + normalizedValue * 0.7);
        return `rgba(16, 185, 129, ${intensity})`; // Green
      }
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.hourlyHeatmap = new Chart(ctx, {
      type: 'matrix',
      data: {
        datasets: [{
          label: 'Hourly Profit',
          data: dataset,
          backgroundColor: (context) => {
            const value = context.dataset.data[context.dataIndex].v;
            return getColor(value);
          },
          borderColor: this.settings.darkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
          borderWidth: 1,
          width: ({ chart }) => (chart.chartArea || {}).width / 24 - 1,
          height: ({ chart }) => (chart.chartArea || {}).height / 7 - 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Hourly Profit Heatmap',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              title: (context) => {
                const dataPoint = context[0].dataset.data[context[0].dataIndex];
                const day = labels.y[dataPoint.y];
                const hour = labels.x[dataPoint.x];
                return `${day} at ${hour}`;
              },
              label: (context) => {
                const value = context.dataset.data[context.dataIndex].v;
                return `Profit: ${this.formatCurrency(value)}`;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'category',
            labels: labels.x,
            offset: true,
            grid: {
              display: false
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              maxRotation: 0,
              autoSkip: true,
              callback: (_, i) => i % 3 === 0 ? labels.x[i] : ''
            }
          },
          y: {
            type: 'category',
            labels: labels.y,
            offset: true,
            reverse: true,
            grid: {
              display: false
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280'
            }
          }
        }
      }
    });
    
    // Add legend manually since matrix chart doesn't have built-in legend
    this.addHeatmapLegend(container, minProfit, maxProfit, getColor);
  }
  
  /**
   * Add a custom color legend to the heatmap
   */
  addHeatmapLegend(container, minValue, maxValue, getColorFn) {
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    legend.style.display = 'flex';
    legend.style.alignItems = 'center';
    legend.style.justifyContent = 'center';
    legend.style.marginTop = '12px';
    
    // Create color gradient
    const gradient = document.createElement('div');
    gradient.style.display = 'flex';
    gradient.style.width = '200px';
    gradient.style.height = '15px';
    gradient.style.borderRadius = '3px';
    gradient.style.overflow = 'hidden';
    
    // Generate gradient stops
    const steps = 20;
    const range = Math.max(Math.abs(minValue), Math.abs(maxValue));
    
    for (let i = 0; i < steps; i++) {
      const value = minValue + (i / (steps - 1)) * (maxValue - minValue);
      const stop = document.createElement('div');
      stop.style.flex = '1';
      stop.style.height = '100%';
      stop.style.backgroundColor = getColorFn(value);
      gradient.appendChild(stop);
    }
    
    // Create legend labels
    const minLabel = document.createElement('div');
    minLabel.style.marginRight = '8px';
    minLabel.style.fontSize = '12px';
    minLabel.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
    minLabel.textContent = this.formatCurrency(minValue);
    
    const maxLabel = document.createElement('div');
    maxLabel.style.marginLeft = '8px';
    maxLabel.style.fontSize = '12px';
    maxLabel.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
    maxLabel.textContent = this.formatCurrency(maxValue);
    
    legend.appendChild(minLabel);
    legend.appendChild(gradient);
    legend.appendChild(maxLabel);
    
    container.appendChild(legend);
  }
  
  /**
   * Render risk-return chart
   */
  renderRiskReturnChart() {
    const container = this.containers.riskReturnChart;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // Check if we have data
    if (!this.metrics.riskAdjustedReturns || !this.metrics.riskAdjustedReturns.pairs || this.metrics.riskAdjustedReturns.pairs.length === 0) {
      this.showError(container, 'No risk-return data available');
      return;
    }
    
    // Prepare chart data
    const pairs = this.metrics.riskAdjustedReturns.pairs;
    const returns = this.metrics.riskAdjustedReturns.returns;  // Average return percentages
    const risks = this.metrics.riskAdjustedReturns.risks;      // Volatility/standard deviation
    const volumes = this.metrics.riskAdjustedReturns.volumes;  // Trading volumes for bubble size
    const sharpeRatios = this.metrics.riskAdjustedReturns.sharpeRatios; // Risk-adjusted return metric
    
    // Generate colors based on Sharpe ratio
    const colors = pairs.map((_, index) => {
      const sharpe = sharpeRatios[index];
      
      if (sharpe < 0) {
        // Poor risk-adjusted return - red
        return 'rgba(239, 68, 68, 0.7)';
      } else if (sharpe < 1) {
        // Below average - orange
        return 'rgba(249, 115, 22, 0.7)';
      } else if (sharpe < 2) {
        // Average - yellow
        return 'rgba(245, 158, 11, 0.7)';
      } else if (sharpe < 3) {
        // Good - light green
        return 'rgba(16, 185, 129, 0.7)';
      } else {
        // Excellent - dark green
        return 'rgba(5, 150, 105, 0.7)';
      }
    });
    
    // Normalize volumes for bubble size (between 5 and 30)
    const minVolume = Math.min(...volumes);
    const maxVolume = Math.max(...volumes);
    const volumeRange = maxVolume - minVolume;
    
    const normalizedVolumes = volumes.map(volume => {
      if (volumeRange === 0) return 15; // Default size if all volumes are equal
      const normalized = 5 + ((volume - minVolume) / volumeRange) * 25;
      return normalized;
    });
    
    // Prepare dataset
    const data = {
      datasets: [{
        label: 'Risk vs. Return by Trading Pair',
        data: pairs.map((pair, index) => ({
          x: risks[index],          // Risk (volatility)
          y: returns[index],        // Return percentage
          r: normalizedVolumes[index], // Bubble size based on volume
          pair: pair,              // For tooltip
          sharpe: sharpeRatios[index], // For tooltip
          volume: volumes[index]   // For tooltip
        })),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace(', 0.7)', ', 1)')),
        borderWidth: 1
      }]
    };
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.riskReturnChart = new Chart(ctx, {
      type: 'bubble',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Risk vs. Return Analysis',
            color: this.settings.darkMode ? '#E5E7EB' : '#374151',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: this.settings.showTooltips,
            callbacks: {
              title: (context) => {
                return context[0].raw.pair;
              },
              label: (context) => {
                const dataPoint = context.raw;
                return [
                  `Return: ${this.formatPercentage(dataPoint.y)}`,
                  `Risk: ${this.formatPercentage(dataPoint.x)}`,
                  `Sharpe Ratio: ${dataPoint.sharpe.toFixed(2)}`,
                  `Volume: ${this.formatCurrency(dataPoint.volume)}`
                ];
              }
            }
          },
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              quadrants: {
                type: 'line',
                xMin: 0,
                xMax: 0,
                yMin: 0,
                yMax: 0,
                borderColor: this.settings.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                borderWidth: 1,
                label: {
                  display: false
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (Volatility)',
              color: this.settings.darkMode ? '#E5E7EB' : '#374151'
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatPercentage(value)
            }
          },
          y: {
            title: {
              display: true,
              text: 'Return',
              color: this.settings.darkMode ? '#E5E7EB' : '#374151'
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatPercentage(value)
            }
          }
        }
      }
    });
    
    // Add legend explaining bubble colors
    this.addRiskReturnLegend(container);
  }
  
  /**
   * Add a custom legend to the risk-return chart
   */
  addRiskReturnLegend(container) {
    const legend = document.createElement('div');
    legend.className = 'risk-return-legend';
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.justifyContent = 'center';
    legend.style.marginTop = '12px';
    legend.style.fontSize = '12px';
    
    const items = [
      { color: 'rgba(239, 68, 68, 0.7)', label: 'Poor (Sharpe < 0)' },
      { color: 'rgba(249, 115, 22, 0.7)', label: 'Below Avg (0-1)' },
      { color: 'rgba(245, 158, 11, 0.7)', label: 'Average (1-2)' },
      { color: 'rgba(16, 185, 129, 0.7)', label: 'Good (2-3)' },
      { color: 'rgba(5, 150, 105, 0.7)', label: 'Excellent (3+)' }
    ];
    
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.style.display = 'flex';
      itemEl.style.alignItems = 'center';
      itemEl.style.margin = '0 8px';
      
      const colorBox = document.createElement('div');
      colorBox.style.width = '12px';
      colorBox.style.height = '12px';
      colorBox.style.backgroundColor = item.color;
      colorBox.style.marginRight = '4px';
      colorBox.style.borderRadius = '2px';
      
      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
      
      itemEl.appendChild(colorBox);
      itemEl.appendChild(label);
      legend.appendChild(itemEl);
    });
    
    const note = document.createElement('div');
    note.style.width = '100%';
    note.style.textAlign = 'center';
    note.style.marginTop = '4px';
    note.style.fontSize = '11px';
    note.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
    note.textContent = 'Bubble size represents trading volume';
    
    legend.appendChild(note);
    container.appendChild(legend);
  }
  
  /**
   * Render top performing pairs
   */
  renderTopPairs() {
    const container = this.containers.topPairs;
    if (!container) return;
    
    // Check if we have success rate data to extract top pairs
    if (!this.metrics.successRateByPair || !this.metrics.successRateByPair.pairs || this.metrics.successRateByPair.pairs.length === 0) {
      this.showError(container, 'No trading pair data available');
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get data for top pairs
    const pairs = this.metrics.successRateByPair.pairs;
    const rates = this.metrics.successRateByPair.rates;
    const trades = this.metrics.successRateByPair.trades;
    const profits = this.metrics.successRateByPair.profits || Array(pairs.length).fill(0);
    
    // Create combined data for sorting
    const pairsData = pairs.map((pair, index) => ({
      pair,
      successRate: rates[index],
      trades: trades[index],
      profit: profits[index]
    }));
    
    // Sort by profit (descending)
    pairsData.sort((a, b) => b.profit - a.profit);
    
    // Take top 5 pairs
    const topPairs = pairsData.slice(0, 5);
    
    // Create header
    const header = document.createElement('h3');
    header.className = 'analytics-section-title';
    header.textContent = 'Top Performing Pairs';
    header.style.margin = '0 0 16px 0';
    header.style.fontSize = '16px';
    header.style.fontWeight = 'bold';
    header.style.color = this.settings.darkMode ? '#E5E7EB' : '#374151';
    container.appendChild(header);
    
    // If no data, show message
    if (topPairs.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No trading pair data available</p>';
      container.appendChild(emptyState);
      return;
    }
    
    // Create cards for each top pair
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'top-pairs-grid';
    cardsContainer.style.display = 'grid';
    cardsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    cardsContainer.style.gap = '16px';
    
    topPairs.forEach((pairData, index) => {
      const card = document.createElement('div');
      card.className = 'top-pair-card';
      card.style.backgroundColor = this.settings.darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.8)';
      card.style.borderRadius = '8px';
      card.style.padding = '16px';
      card.style.boxShadow = this.settings.darkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.1)';
      
      // Generate a unique gradient for each card
      const hue = (index * 50) % 360; // Distribute colors evenly
      const gradient = `linear-gradient(135deg, hsla(${hue}, 70%, 60%, 0.1), hsla(${hue + 60}, 70%, 60%, 0.1))`;
      card.style.backgroundImage = gradient;
      
      const rank = document.createElement('div');
      rank.className = 'pair-rank';
      rank.textContent = `#${index + 1}`;
      rank.style.fontSize = '14px';
      rank.style.fontWeight = 'bold';
      rank.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
      rank.style.marginBottom = '8px';
      
      const pairName = document.createElement('div');
      pairName.className = 'pair-name';
      pairName.textContent = pairData.pair;
      pairName.style.fontSize = '18px';
      pairName.style.fontWeight = 'bold';
      pairName.style.color = this.settings.darkMode ? '#E5E7EB' : '#1F2937';
      pairName.style.marginBottom = '12px';
      
      const profitEl = document.createElement('div');
      profitEl.className = 'pair-profit';
      profitEl.textContent = this.formatCurrency(pairData.profit);
      profitEl.style.fontSize = '24px';
      profitEl.style.fontWeight = 'bold';
      profitEl.style.color = pairData.profit >= 0 ? 
        'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
      profitEl.style.marginBottom = '12px';
      
      const statsContainer = document.createElement('div');
      statsContainer.className = 'pair-stats';
      statsContainer.style.display = 'flex';
      statsContainer.style.justifyContent = 'space-between';
      
      const successRateEl = document.createElement('div');
      successRateEl.className = 'stat';
      successRateEl.innerHTML = `<div class="stat-label">Success Rate</div><div class="stat-value">${this.formatPercentage(pairData.successRate)}</div>`;
      successRateEl.style.fontSize = '14px';
      
      const tradesEl = document.createElement('div');
      tradesEl.className = 'stat';
      tradesEl.innerHTML = `<div class="stat-label">Trades</div><div class="stat-value">${pairData.trades}</div>`;
      tradesEl.style.fontSize = '14px';
      
      // Apply styles to labels and values
      card.querySelectorAll('.stat-label').forEach(el => {
        el.style.color = this.settings.darkMode ? '#9CA3AF' : '#6B7280';
        el.style.marginBottom = '4px';
      });
      
      card.querySelectorAll('.stat-value').forEach(el => {
        el.style.color = this.settings.darkMode ? '#E5E7EB' : '#1F2937';
        el.style.fontWeight = 'bold';
      });
      
      statsContainer.appendChild(successRateEl);
      statsContainer.appendChild(tradesEl);
      
      card.appendChild(rank);
      card.appendChild(pairName);
      card.appendChild(profitEl);
      card.appendChild(statsContainer);
      
      cardsContainer.appendChild(card);
    });
    
    container.appendChild(cardsContainer);
  }
  
  /**
   * Render top exchanges by volume
   */
  renderTopExchanges() {
    const container = this.containers.topExchanges;
    if (!container) return;
    
    // Check if we have volume data to extract top exchanges
    if (!this.metrics.volumeByExchange || !this.metrics.volumeByExchange.exchanges || this.metrics.volumeByExchange.exchanges.length === 0) {
      this.showError(container, 'No exchange data available');
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get data for top exchanges
    const exchanges = this.metrics.volumeByExchange.exchanges;
    const volumeByExchange = {}; // We'll sum up volumes by exchange
    
    // Calculate total volume for each exchange
    exchanges.forEach((exchange, i) => {
      const volumes = this.metrics.volumeByExchange.volumes[i];
      volumeByExchange[exchange] = volumes.reduce((sum, vol) => sum + vol, 0);
    });
    
    // Create array of exchange data for sorting
    const exchangeData = Object.entries(volumeByExchange).map(([exchange, volume]) => ({
      exchange,
      volume
    }));
    
    // Sort by volume (descending)
    exchangeData.sort((a, b) => b.volume - a.volume);
    
    // Take top 5 exchanges
    const topExchanges = exchangeData.slice(0, 5);
    
    // Create header
    const header = document.createElement('h3');
    header.className = 'analytics-section-title';
    header.textContent = 'Top Exchanges by Volume';
    header.style.margin = '0 0 16px 0';
    header.style.fontSize = '16px';
    header.style.fontWeight = 'bold';
    header.style.color = this.settings.darkMode ? '#E5E7EB' : '#374151';
    container.appendChild(header);
    
    // If no data, show message
    if (topExchanges.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No exchange data available</p>';
      container.appendChild(emptyState);
      return;
    }
    
    // Create horizontal bar chart
    const chartContainer = document.createElement('div');
    chartContainer.style.height = '250px';
    container.appendChild(chartContainer);
    
    // Prepare data for the chart
    const labels = topExchanges.map(e => e.exchange);
    const values = topExchanges.map(e => e.volume);
    
    // Generate colors
    const colors = this.generateColorPalette(labels.length, 0.7);
    
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    // Create chart
    const ctx = canvas.getContext('2d');
    this.chartInstances.topExchangesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Trading Volume',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace(', 0.7)', ', 1)')),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                return `Volume: ${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
              color: this.settings.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: this.settings.darkMode ? '#9CA3AF' : '#6B7280',
              callback: (value) => this.formatCompactNumber(value)
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              color: this.settings.darkMode ? '#E5E7EB' : '#374151',
              font: {
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('performance-analytics')) {
    window.performanceAnalytics = new PerformanceAnalytics();
  }
});
