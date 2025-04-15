// Advanced Metrics Dashboard Components
class AdvancedMetrics {
    constructor() {
        this.charts = new Map();
        this.initializeCharts();
    }

    // Initialize advanced metric charts
    initializeCharts() {
        // Risk Metrics Radar Chart
        this.charts.set('riskMetrics', new Chart(
            document.getElementById('riskMetricsChart'),
            {
                type: 'radar',
                data: {
                    labels: [
                        'Sharpe Ratio',
                        'Sortino Ratio',
                        'Calmar Ratio',
                        'Chain Concentration',
                        'Return Volatility'
                    ],
                    datasets: [{
                        label: 'Risk Metrics',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            }
        ));

        // Equity Curve Chart
        this.charts.set('equityCurve', new Chart(
            document.getElementById('equityCurveChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Equity',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Equity Curve'
                        }
                    }
                }
            }
        ));

        // Gas Price Trends
        this.charts.set('gasPrices', new Chart(
            document.getElementById('gasPricesChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Gas Prices by Chain'
                        }
                    }
                }
            }
        ));

        // Liquidity Distribution
        this.charts.set('liquidityDistribution', new Chart(
            document.getElementById('liquidityDistributionChart'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Pool Liquidity',
                        data: [],
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Liquidity Distribution'
                        }
                    }
                }
            }
        ));

        // System Resource Usage
        this.charts.set('systemResources', new Chart(
            document.getElementById('systemResourcesChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'CPU Usage',
                            data: [],
                            borderColor: 'rgb(255, 99, 132)'
                        },
                        {
                            label: 'Memory Usage',
                            data: [],
                            borderColor: 'rgb(75, 192, 192)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'System Resource Usage'
                        }
                    }
                }
            }
        ));
    }

    // Update risk metrics display
    updateRiskMetrics(metrics) {
        const chart = this.charts.get('riskMetrics');
        chart.data.datasets[0].data = [
            metrics.sharpeRatio,
            metrics.sortinoRatio,
            metrics.calmarRatio,
            metrics.chainConcentration,
            metrics.returnVolatility
        ];
        chart.update();

        // Update risk metrics table
        this.updateRiskMetricsTable(metrics);
    }

    // Update equity curve
    updateEquityCurve(data) {
        const chart = this.charts.get('equityCurve');
        chart.data.labels = data.map(point => 
            new Date(point.timestamp).toLocaleTimeString()
        );
        chart.data.datasets[0].data = data.map(point => point.equity);
        chart.update();
    }

    // Update gas prices
    updateGasPrices(gasPrices) {
        const chart = this.charts.get('gasPrices');
        chart.data.labels = gasPrices.timestamps.map(ts => 
            new Date(ts).toLocaleTimeString()
        );
        
        // Update or create datasets for each chain
        Object.entries(gasPrices.byChain).forEach(([chain, prices], index) => {
            const existingDataset = chart.data.datasets.find(ds => ds.label === chain);
            const chainColor = this.getChainColor(chain);

            if (existingDataset) {
                existingDataset.data = prices;
            } else {
                chart.data.datasets.push({
                    label: chain,
                    data: prices,
                    borderColor: chainColor,
                    fill: false
                });
            }
        });

        chart.update();
    }

    // Update liquidity distribution
    updateLiquidityDistribution(liquidity) {
        const chart = this.charts.get('liquidityDistribution');
        chart.data.labels = Array.from(liquidity.pools.keys());
        chart.data.datasets[0].data = Array.from(liquidity.pools.values());
        chart.update();

        // Update liquidity metrics table
        this.updateLiquidityTable(liquidity);
    }

    // Update system resources
    updateSystemResources(resources) {
        const chart = this.charts.get('systemResources');
        const timestamp = new Date().toLocaleTimeString();

        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(resources.cpu.usage);
        chart.data.datasets[1].data.push(resources.memory.used / resources.memory.available);

        // Keep last 50 data points
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        chart.update();

        // Update system health table
        this.updateSystemHealthTable(resources);
    }

    // Update risk metrics table
    updateRiskMetricsTable(metrics) {
        const tbody = document.getElementById('riskMetricsTable').querySelector('tbody');
        tbody.innerHTML = `
            <tr>
                <td>Sharpe Ratio</td>
                <td>${metrics.sharpeRatio.toFixed(4)}</td>
                <td>${this.getRiskRating(metrics.sharpeRatio, 'sharpe')}</td>
            </tr>
            <tr>
                <td>Sortino Ratio</td>
                <td>${metrics.sortinoRatio.toFixed(4)}</td>
                <td>${this.getRiskRating(metrics.sortinoRatio, 'sortino')}</td>
            </tr>
            <tr>
                <td>Calmar Ratio</td>
                <td>${metrics.calmarRatio.toFixed(4)}</td>
                <td>${this.getRiskRating(metrics.calmarRatio, 'calmar')}</td>
            </tr>
            <tr>
                <td>Current Drawdown</td>
                <td>${(metrics.currentDrawdown * 100).toFixed(2)}%</td>
                <td>${this.getDrawdownRating(metrics.currentDrawdown)}</td>
            </tr>
            <tr>
                <td>Max Drawdown</td>
                <td>${(metrics.maxDrawdown * 100).toFixed(2)}%</td>
                <td>${this.getDrawdownRating(metrics.maxDrawdown)}</td>
            </tr>
        `;
    }

    // Update liquidity table
    updateLiquidityTable(liquidity) {
        const tbody = document.getElementById('liquidityTable').querySelector('tbody');
        tbody.innerHTML = '';

        Array.from(liquidity.pools.entries()).forEach(([pool, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pool}</td>
                <td>${this.formatCurrency(data.totalLiquidity)}</td>
                <td>${(data.utilization * 100).toFixed(2)}%</td>
                <td>${(data.slippage * 100).toFixed(4)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Update system health table
    updateSystemHealthTable(resources) {
        const tbody = document.getElementById('systemHealthTable').querySelector('tbody');
        tbody.innerHTML = `
            <tr>
                <td>CPU Usage</td>
                <td>${(resources.cpu.usage * 100).toFixed(2)}%</td>
                <td>${this.getResourceStatus(resources.cpu.usage)}</td>
            </tr>
            <tr>
                <td>Memory Usage</td>
                <td>${(resources.memory.used / resources.memory.available * 100).toFixed(2)}%</td>
                <td>${this.getResourceStatus(resources.memory.used / resources.memory.available)}</td>
            </tr>
            <tr>
                <td>Network Latency</td>
                <td>${resources.network.latency}ms</td>
                <td>${this.getLatencyStatus(resources.network.latency)}</td>
            </tr>
        `;
    }

    // Helper function to get risk rating
    getRiskRating(value, type) {
        const thresholds = {
            sharpe: { low: 1, medium: 2, high: 3 },
            sortino: { low: 1.5, medium: 2.5, high: 3.5 },
            calmar: { low: 0.5, medium: 1, high: 2 }
        };

        const t = thresholds[type];
        if (value >= t.high) return '<span class="badge bg-success">Excellent</span>';
        if (value >= t.medium) return '<span class="badge bg-info">Good</span>';
        if (value >= t.low) return '<span class="badge bg-warning">Fair</span>';
        return '<span class="badge bg-danger">Poor</span>';
    }

    // Helper function to get drawdown rating
    getDrawdownRating(drawdown) {
        if (drawdown <= 0.05) return '<span class="badge bg-success">Low Risk</span>';
        if (drawdown <= 0.15) return '<span class="badge bg-warning">Moderate Risk</span>';
        return '<span class="badge bg-danger">High Risk</span>';
    }

    // Helper function to get resource status
    getResourceStatus(usage) {
        if (usage <= 0.6) return '<span class="badge bg-success">Healthy</span>';
        if (usage <= 0.8) return '<span class="badge bg-warning">Moderate</span>';
        return '<span class="badge bg-danger">Critical</span>';
    }

    // Helper function to get latency status
    getLatencyStatus(latency) {
        if (latency <= 100) return '<span class="badge bg-success">Good</span>';
        if (latency <= 300) return '<span class="badge bg-warning">Moderate</span>';
        return '<span class="badge bg-danger">High</span>';
    }

    // Helper function to format currency
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    // Get chain-specific color
    getChainColor(chain) {
        const colors = {
            'solana': '#9945FF',
            'ethereum': '#627EEA',
            'bsc': '#F3BA2F',
            'polygon': '#8247E5',
            'avalanche': '#E84142'
        };
        return colors[chain] || '#000000';
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.advancedMetrics = new AdvancedMetrics();
});
