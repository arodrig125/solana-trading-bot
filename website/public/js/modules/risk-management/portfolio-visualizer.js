/**
 * SolarBot Portfolio Risk Visualizer
 * Visualizes portfolio risk metrics and correlations using interactive charts
 */

class PortfolioVisualizer {
  constructor(analyzer) {
    this.analyzer = analyzer || window.portfolioAnalyzer;
    this.initialized = false;
    
    // Chart instances
    this.charts = {
      allocation: null,
      correlation: null,
      riskReturn: null,
      drawdown: null
    };
    
    // Chart containers
    this.containers = {
      allocation: document.getElementById('allocation-chart'),
      correlation: document.getElementById('correlation-chart'),
      riskReturn: document.getElementById('risk-return-chart'),
      drawdown: document.getElementById('drawdown-chart')
    };
    
    // Check if we have access to a portfolio analyzer
    if (!this.analyzer) {
      console.error('Portfolio analyzer not found. The visualizer requires an instance of PortfolioAnalyzer.');
      return;
    }
    
    // Initialize only if we have Chart.js
    if (typeof Chart !== 'undefined') {
      this.initialize();
    } else {
      console.error('Chart.js library not found. Please include Chart.js before initializing the visualizer.');
    }
  }
  
  /**
   * Initialize the portfolio visualizer
   */
  initialize() {
    try {
      // Make sure all containers exist
      const containersExist = Object.values(this.containers).every(container => container !== null);
      
      if (!containersExist) {
        console.error('One or more chart containers not found. Make sure all chart containers exist in the DOM.');
        return;
      }
      
      // Create charts
      this.createAllocationChart();
      this.createCorrelationHeatmap();
      this.createRiskReturnChart();
      this.createDrawdownChart();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize portfolio visualizer:', error);
    }
  }
  
  /**
   * Create asset allocation chart (doughnut/pie chart)
   */
  createAllocationChart() {
    if (!this.analyzer.portfolioData || !this.analyzer.portfolioData.assets) {
      return;
    }
    
    const { assets } = this.analyzer.portfolioData;
    
    // Prepare chart data
    const labels = assets.map(asset => asset.symbol);
    const data = assets.map(asset => asset.weight * 100); // Convert weights to percentages
    
    // Color palette for allocation chart
    const colors = this.generateColorPalette(assets.length);
    
    // Create allocation chart
    this.charts.allocation = new Chart(this.containers.allocation, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: colors.map(color => this.adjustColorBrightness(color, -20)),
          borderWidth: 1,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // We'll create a custom legend
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw.toFixed(2) + '%';
                return `${label}: ${value}`;
              }
            }
          },
          title: {
            display: true,
            text: 'Asset Allocation',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            }
          }
        },
        cutout: '60%',
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });
    
    // Create custom legend
    this.createCustomLegend('allocation-legend', labels, colors, data);
  }
  
  /**
   * Create correlation heatmap
   */
  createCorrelationHeatmap() {
    if (!this.analyzer.correlationMatrix) {
      return;
    }
    
    const { correlationMatrix } = this.analyzer;
    const assets = Object.keys(correlationMatrix);
    
    // Prepare data for heatmap
    const datasets = [];
    
    // Create a dataset for each row in the correlation matrix
    assets.forEach((asset, index) => {
      const data = assets.map(otherAsset => {
        return {
          x: otherAsset,
          y: asset,
          v: correlationMatrix[asset][otherAsset]
        };
      });
      
      datasets.push({
        label: asset,
        data: data
      });
    });
    
    // Create correlation heatmap
    this.charts.correlation = new Chart(this.containers.correlation, {
      type: 'matrix',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const item = context[0].raw;
                return `${item.y} / ${item.x}`;
              },
              label: function(context) {
                const value = context.raw.v;
                return `Correlation: ${value ? value.toFixed(2) : 'N/A'}`;
              }
            }
          },
          title: {
            display: true,
            text: 'Asset Correlation Matrix',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 45
            },
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        },
        animation: false,
        parsing: false,
        layout: {
          padding: 20
        },
        elements: {
          point: {
            backgroundColor: function(context) {
              const value = context.raw.v;
              
              if (value === null || isNaN(value)) {
                return 'rgba(200, 200, 200, 0.5)';
              }
              
              // Color based on correlation value
              if (value === 1) {
                return 'rgba(60, 60, 60, 0.9)'; // Self-correlation is dark gray
              } else if (value > 0) {
                // Positive correlation (red gradient)
                const intensity = Math.min(value, 1) * 255;
                return `rgba(${intensity}, 0, 0, 0.7)`;
              } else {
                // Negative correlation (blue gradient)
                const intensity = Math.min(Math.abs(value), 1) * 255;
                return `rgba(0, 0, ${intensity}, 0.7)`;
              }
            },
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            radius: function(context) {
              const value = context.raw.v;
              if (value === null || isNaN(value)) {
                return 12;
              }
              return 15 * Math.abs(value);
            },
            hoverRadius: function(context) {
              const value = context.raw.v;
              if (value === null || isNaN(value)) {
                return 14;
              }
              return 16 * Math.abs(value);
            }
          }
        }
      }
    });
  }
  
  /**
   * Create risk/return scatter plot
   */
  createRiskReturnChart() {
    if (!this.analyzer.riskMetrics || !this.analyzer.riskMetrics.assets) {
      return;
    }
    
    const { assets } = this.analyzer.portfolioData;
    const { riskMetrics } = this.analyzer;
    
    // Prepare data for risk/return chart
    const data = [];
    const labels = [];
    const colors = [];
    
    // Add each asset as a data point
    assets.forEach(asset => {
      const metrics = riskMetrics.assets[asset.symbol];
      if (metrics) {
        data.push({
          x: metrics.volatility,           // Risk (volatility)
          y: metrics.annualizedReturn,    // Return
          r: asset.weight * 20 + 5,       // Size based on weight
          weight: asset.weight * 100       // Weight as percentage
        });
        labels.push(asset.symbol);
        colors.push(this.getAssetColor(asset.symbol));
      }
    });
    
    // Add portfolio as a data point
    const portfolioMetrics = riskMetrics.portfolio;
    if (portfolioMetrics) {
      data.push({
        x: portfolioMetrics.volatility,
        y: portfolioMetrics.annualizedReturn,
        r: 15,
        weight: 100
      });
      labels.push('Portfolio');
      colors.push('rgba(63, 140, 255, 0.8)');
    }
    
    // Create risk/return chart
    this.charts.riskReturn = new Chart(this.containers.riskReturn, {
      type: 'bubble',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: colors.map(color => this.adjustColorBrightness(color, -20)),
          borderWidth: 1
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
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                const data = context.raw;
                return [
                  `Return: ${data.y.toFixed(2)}%`,
                  `Risk (Volatility): ${data.x.toFixed(2)}%`,
                  `Weight: ${data.weight.toFixed(2)}%`
                ];
              }
            }
          },
          title: {
            display: true,
            text: 'Risk vs. Return Analysis',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (Volatility %)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: 0,
            grid: {
              color: 'rgba(200, 200, 200, 0.1)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Annualized Return (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.1)'
            }
          }
        }
      }
    });
    
    // Create custom legend
    this.createCustomLegend('risk-return-legend', labels, colors, data.map(d => d.weight));
  }
  
  /**
   * Create drawdown chart (line chart)
   */
  createDrawdownChart() {
    if (!this.analyzer.portfolioData || !this.analyzer.portfolioData.historicalReturns) {
      return;
    }
    
    // Start with portfolio drawdown
    this.updateDrawdownChart('Portfolio');
    
    // Populate asset selector
    const assetSelector = document.getElementById('drawdown-asset-selector');
    if (assetSelector) {
      const { assets } = this.analyzer.portfolioData;
      
      // Add portfolio option
      let html = '<option value="Portfolio">Portfolio</option>';
      
      // Add asset options
      assets.forEach(asset => {
        html += `<option value="${asset.symbol}">${asset.symbol}</option>`;
      });
      
      assetSelector.innerHTML = html;
      
      // Add change event listener
      assetSelector.addEventListener('change', () => {
        const selectedAsset = assetSelector.value;
        this.updateDrawdownChart(selectedAsset);
      });
    }
  }
  
  /**
   * Update drawdown chart for a specific asset or portfolio
   */
  updateDrawdownChart(symbol) {
    if (!this.analyzer.portfolioData || !this.containers.drawdown) {
      return;
    }
    
    // Get returns for the selected asset/portfolio
    let returns;
    let color;
    
    if (symbol === 'Portfolio') {
      // Get portfolio returns
      returns = this.analyzer.calculatePortfolioReturns();
      color = 'rgba(63, 140, 255, 0.8)';
    } else {
      // Get asset returns
      returns = this.analyzer.portfolioData.historicalReturns.filter(ret => ret.symbol === symbol);
      color = this.getAssetColor(symbol);
    }
    
    // Sort returns by timestamp
    returns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate drawdown
    const drawdowns = this.calculateDrawdownSeries(returns.map(ret => ret.return));
    
    // Format dates for display
    const labels = returns.map(ret => {
      const date = new Date(ret.timestamp);
      return date.toLocaleDateString();
    });
    
    // Destroy previous chart if it exists
    if (this.charts.drawdown) {
      this.charts.drawdown.destroy();
    }
    
    // Create drawdown chart
    this.charts.drawdown = new Chart(this.containers.drawdown, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${symbol} Drawdown`,
          data: drawdowns,
          borderColor: color,
          backgroundColor: this.adjustColorBrightness(color, 0, 0.2),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Drawdown: ${(value * 100).toFixed(2)}%`;
              }
            }
          },
          title: {
            display: true,
            text: 'Drawdown Analysis',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            title: {
              display: true,
              text: 'Drawdown (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return (value * 100).toFixed(0) + '%';
              }
            },
            // Invert the y-axis so drawdowns go down
            min: -0.01,
            max: Math.min(...drawdowns) - 0.05
          }
        }
      }
    });
  }
  
  /**
   * Calculate drawdown series from returns
   */
  calculateDrawdownSeries(returns) {
    if (!returns || returns.length === 0) {
      return [];
    }
    
    // Calculate equity curve
    let equity = 1;
    const equityCurve = returns.map(ret => {
      equity *= (1 + ret);
      return equity;
    });
    
    // Calculate drawdown series
    let peak = equityCurve[0];
    const drawdowns = equityCurve.map(value => {
      peak = Math.max(peak, value);
      return (value - peak) / peak; // Always negative or zero
    });
    
    return drawdowns;
  }
  
  /**
   * Create a custom legend for a chart
   */
  createCustomLegend(containerId, labels, colors, values) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '<div class="custom-legend">';
    
    labels.forEach((label, index) => {
      const color = colors[index];
      const value = values[index].toFixed(2) + '%';
      
      html += `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${color}"></div>
          <div class="legend-label">${label}</div>
          <div class="legend-value">${value}</div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add interactivity to legend items
    const legendItems = container.querySelectorAll('.legend-item');
    legendItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        // Highlight the corresponding chart element
        // Implementation depends on the chart type
      });
      
      item.addEventListener('mouseleave', () => {
        // Remove highlight
      });
    });
  }
  
  /**
   * Generate a color palette for charts
   */
  generateColorPalette(count) {
    const baseColors = [
      'rgba(255, 99, 132, 0.8)',    // Red
      'rgba(54, 162, 235, 0.8)',     // Blue
      'rgba(255, 206, 86, 0.8)',     // Yellow
      'rgba(75, 192, 192, 0.8)',     // Teal
      'rgba(153, 102, 255, 0.8)',    // Purple
      'rgba(255, 159, 64, 0.8)',     // Orange
      'rgba(39, 174, 96, 0.8)',      // Green
      'rgba(142, 68, 173, 0.8)',     // Violet
      'rgba(41, 128, 185, 0.8)',     // Blue
      'rgba(192, 57, 43, 0.8)'       // Dark Red
    ];
    
    // If we need more colors than in our base palette
    if (count > baseColors.length) {
      // Create additional colors by adjusting brightness
      const extraColors = [];
      
      for (let i = 0; i < count - baseColors.length; i++) {
        const baseColor = baseColors[i % baseColors.length];
        const brightness = (i % 3 + 1) * 15; // Alternate brightness levels
        extraColors.push(this.adjustColorBrightness(baseColor, brightness));
      }
      
      return [...baseColors, ...extraColors];
    }
    
    return baseColors.slice(0, count);
  }
  
  /**
   * Get a consistent color for a specific asset based on its symbol
   */
  getAssetColor(symbol) {
    // Generate a consistent hash for the symbol
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Mod hash to get an index in our base color palette
    const baseColors = [
      'rgba(255, 99, 132, 0.8)',    // Red
      'rgba(54, 162, 235, 0.8)',     // Blue
      'rgba(255, 206, 86, 0.8)',     // Yellow
      'rgba(75, 192, 192, 0.8)',     // Teal
      'rgba(153, 102, 255, 0.8)',    // Purple
      'rgba(255, 159, 64, 0.8)',     // Orange
      'rgba(39, 174, 96, 0.8)',      // Green
      'rgba(142, 68, 173, 0.8)',     // Violet
      'rgba(41, 128, 185, 0.8)',     // Blue
      'rgba(192, 57, 43, 0.8)'       // Dark Red
    ];
    
    const index = Math.abs(hash) % baseColors.length;
    return baseColors[index];
  }
  
  /**
   * Adjust color brightness
   * @param {string} color - RGBA color string
   * @param {number} percent - Brightness adjustment percent (-100 to 100)
   * @param {number} alphaAdjust - Optional alpha adjustment (0-1)
   * @returns {string} Adjusted color
   */
  adjustColorBrightness(color, percent, alphaAdjust = null) {
    // Extract RGBA values
    const rgba = color.match(/\d+(\.\d+)?/g);
    
    if (!rgba || rgba.length < 3) {
      return color;
    }
    
    // Convert to numbers
    let r = parseInt(rgba[0]);
    let g = parseInt(rgba[1]);
    let b = parseInt(rgba[2]);
    let a = rgba.length >= 4 ? parseFloat(rgba[3]) : 1;
    
    // Adjust brightness
    if (percent !== 0) {
      r = Math.max(0, Math.min(255, r + (percent / 100) * 255));
      g = Math.max(0, Math.min(255, g + (percent / 100) * 255));
      b = Math.max(0, Math.min(255, b + (percent / 100) * 255));
    }
    
    // Adjust alpha if specified
    if (alphaAdjust !== null) {
      a = alphaAdjust;
    }
    
    // Return adjusted color
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
  
  /**
   * Update all charts with new data
   */
  updateCharts() {
    if (!this.initialized) {
      this.initialize();
      return;
    }
    
    // Update each chart
    if (this.charts.allocation) {
      this.charts.allocation.destroy();
      this.createAllocationChart();
    }
    
    if (this.charts.correlation) {
      this.charts.correlation.destroy();
      this.createCorrelationHeatmap();
    }
    
    if (this.charts.riskReturn) {
      this.charts.riskReturn.destroy();
      this.createRiskReturnChart();
    }
    
    if (this.charts.drawdown) {
      // Get currently selected asset
      const assetSelector = document.getElementById('drawdown-asset-selector');
      const selectedAsset = assetSelector ? assetSelector.value : 'Portfolio';
      
      this.updateDrawdownChart(selectedAsset);
    }
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for portfolioAnalyzer to be initialized first
  const checkAnalyzer = setInterval(() => {
    if (window.portfolioAnalyzer && window.portfolioAnalyzer.initialized) {
      clearInterval(checkAnalyzer);
      window.portfolioVisualizer = new PortfolioVisualizer(window.portfolioAnalyzer);
    }
  }, 100);
  
  // Timeout after 5 seconds if analyzer doesn't initialize
  setTimeout(() => {
    clearInterval(checkAnalyzer);
  }, 5000);
});
