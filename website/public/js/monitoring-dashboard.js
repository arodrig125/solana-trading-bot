// Monitoring Dashboard
class MonitoringDashboard {
    constructor() {
        this.metrics = {};
        this.alerts = [];
        this.charts = new Map();
        this.updateInterval = 5000; // 5 seconds
        this.socket = null;
        
        this.initializeWebSocket();
        this.initializeCharts();
        this.setupEventListeners();
    }

    // Initialize WebSocket connection
    initializeWebSocket() {
        // Use production WebSocket endpoint unless running locally
    let wsUrl;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      wsUrl = 'ws://localhost:8080/monitoring';
    } else {
      wsUrl = 'wss://api.solarbot.digitalocean.app/monitoring'; // PRODUCTION ENDPOINT
    }
    this.socket = new WebSocket(wsUrl);
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed. Reconnecting...');
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }

    // Initialize charts
    initializeCharts() {
        // Wallet Balance Chart
        this.charts.set('walletBalance', new Chart(
            document.getElementById('walletBalanceChart'),
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
                            text: 'Wallet Balances Over Time'
                        }
                    }
                }
            }
        ));

        // Transaction Success Rate Chart
        this.charts.set('transactionSuccess', new Chart(
            document.getElementById('transactionSuccessChart'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Success Rate',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Transaction Success Rate by Chain'
                        }
                    }
                }
            }
        ));

        // Error Rate Chart
        this.charts.set('errorRate', new Chart(
            document.getElementById('errorRateChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Error Rate',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Error Rate Over Time'
                        }
                    }
                }
            }
        ));

        // Bridge Performance Chart
        this.charts.set('bridgePerformance', new Chart(
            document.getElementById('bridgePerformanceChart'),
            {
                type: 'radar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Bridge Performance',
                        data: [],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Bridge Performance Metrics'
                        }
                    }
                }
            }
        ));
    }

    // Set up event listeners
    setupEventListeners() {
        // Alert filters
        document.getElementById('alertSeverityFilter').addEventListener('change', (e) => {
            this.filterAlerts({ severity: e.target.value });
        });

        // Time range selector
        document.getElementById('timeRangeSelector').addEventListener('change', (e) => {
            this.updateChartTimeRange(e.target.value);
        });

        // Refresh button
        document.getElementById('refreshButton').addEventListener('click', () => {
            this.refreshDashboard();
        });
    }

    // Handle WebSocket messages
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'wallet_update':
                this.updateWalletMetrics(data.payload);
                break;
            case 'transaction_update':
                this.updateTransactionMetrics(data.payload);
                break;
            case 'error_update':
                this.updateErrorMetrics(data.payload);
                break;
            case 'bridge_update':
                this.updateBridgeMetrics(data.payload);
                break;
            case 'alert':
                this.handleNewAlert(data.payload);
                break;
        }
    }

    // Update wallet metrics
    updateWalletMetrics(metrics) {
        this.metrics.wallets = metrics;
        this.updateWalletBalanceChart();
        this.updateWalletStatusTable();
    }

    // Update transaction metrics
    updateTransactionMetrics(metrics) {
        this.metrics.transactions = metrics;
        this.updateTransactionSuccessChart();
        this.updateTransactionTable();
    }

    // Update error metrics
    updateErrorMetrics(metrics) {
        this.metrics.errors = metrics;
        this.updateErrorRateChart();
        this.updateErrorTable();
    }

    // Update bridge metrics
    updateBridgeMetrics(metrics) {
        this.metrics.bridges = metrics;
        this.updateBridgePerformanceChart();
        this.updateBridgeTable();
    }

    // Handle new alert
    handleNewAlert(alert) {
        this.alerts.unshift(alert);
        this.updateAlertPanel();
        
        // Show notification for high severity alerts
        if (alert.severity === 'high' || alert.severity === 'critical') {
            this.showNotification(alert);
        }
    }

    // Update wallet balance chart
    updateWalletBalanceChart() {
        const chart = this.charts.get('walletBalance');
        const walletData = this.metrics.wallets;

        chart.data.labels = walletData.timestamps;
        chart.data.datasets = Object.keys(walletData.balances).map(chain => ({
            label: chain,
            data: walletData.balances[chain],
            borderColor: this.getChainColor(chain)
        }));

        chart.update();
    }

    // Update transaction success chart
    updateTransactionSuccessChart() {
        const chart = this.charts.get('transactionSuccess');
        const txData = this.metrics.transactions;

        chart.data.labels = Object.keys(txData.successRates);
        chart.data.datasets[0].data = Object.values(txData.successRates);

        chart.update();
    }

    // Update error rate chart
    updateErrorRateChart() {
        const chart = this.charts.get('errorRate');
        const errorData = this.metrics.errors;

        chart.data.labels = errorData.timestamps;
        chart.data.datasets[0].data = errorData.rates;

        chart.update();
    }

    // Update bridge performance chart
    updateBridgePerformanceChart() {
        const chart = this.charts.get('bridgePerformance');
        const bridgeData = this.metrics.bridges;

        chart.data.labels = Object.keys(bridgeData.metrics);
        chart.data.datasets[0].data = Object.values(bridgeData.metrics);

        chart.update();
    }

    // Update wallet status table
    updateWalletStatusTable() {
        const tableBody = document.getElementById('walletStatusTable').querySelector('tbody');
        tableBody.innerHTML = '';

        Object.entries(this.metrics.wallets).forEach(([chain, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${chain}</td>
                <td>${data.balance}</td>
                <td><span class="status-badge ${data.status}">${data.status}</span></td>
                <td>${data.lastActivity}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update transaction table
    updateTransactionTable() {
        const tableBody = document.getElementById('transactionTable').querySelector('tbody');
        tableBody.innerHTML = '';

        this.metrics.transactions.recent.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tx.hash}</td>
                <td>${tx.type}</td>
                <td>${tx.status}</td>
                <td>${tx.timestamp}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update error table
    updateErrorTable() {
        const tableBody = document.getElementById('errorTable').querySelector('tbody');
        tableBody.innerHTML = '';

        this.metrics.errors.recent.forEach(error => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${error.type}</td>
                <td>${error.message}</td>
                <td>${error.timestamp}</td>
                <td>${error.recovered ? 'Yes' : 'No'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update bridge table
    updateBridgeTable() {
        const tableBody = document.getElementById('bridgeTable').querySelector('tbody');
        tableBody.innerHTML = '';

        Object.entries(this.metrics.bridges).forEach(([bridge, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bridge}</td>
                <td>${data.utilization}%</td>
                <td>${data.averageDelay}ms</td>
                <td>${data.successRate}%</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update alert panel
    updateAlertPanel() {
        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';

        this.alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alert.severity}`;
            alertElement.innerHTML = `
                <strong>${alert.type}</strong>
                <p>${alert.message}</p>
                <small>${new Date(alert.timestamp).toLocaleString()}</small>
            `;
            alertContainer.appendChild(alertElement);
        });
    }

    // Show browser notification
    showNotification(alert) {
        if (Notification.permission === 'granted') {
            new Notification('Monitoring Alert', {
                body: alert.message,
                icon: '/images/alert-icon.png'
            });
        }
    }

    // Filter alerts
    filterAlerts(filters) {
        const filteredAlerts = this.alerts.filter(alert => {
            if (filters.severity && alert.severity !== filters.severity) return false;
            if (filters.type && alert.type !== filters.type) return false;
            return true;
        });

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        filteredAlerts.forEach(alert => this.renderAlert(alert));
    }

    // Update chart time range
    updateChartTimeRange(range) {
        // Update data range for all charts
        this.charts.forEach(chart => {
            const data = this.getChartDataForRange(chart.id, range);
            chart.data = data;
            chart.update();
        });
    }

    // Get chart data for specific time range
    getChartDataForRange(chartId, range) {
        const now = Date.now();
        const rangeMs = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        }[range];

        // Filter data points within the selected time range
        const data = this.metrics[chartId];
        return {
            ...data,
            timestamps: data.timestamps.filter(t => (now - t) <= rangeMs),
            values: data.values.filter((_, i) => (now - data.timestamps[i]) <= rangeMs)
        };
    }

    // Refresh dashboard
    refreshDashboard() {
        this.updateWalletBalanceChart();
        this.updateTransactionSuccessChart();
        this.updateErrorRateChart();
        this.updateBridgePerformanceChart();
        this.updateWalletStatusTable();
        this.updateTransactionTable();
        this.updateErrorTable();
        this.updateBridgeTable();
        this.updateAlertPanel();
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

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new MonitoringDashboard();
});
