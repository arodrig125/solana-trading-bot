// Dashboard functionality
class Dashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = 5000; // 5 seconds
        this.token = localStorage.getItem('admin_token');
        this.baseUrl = '/admin';
        this.setupCharts();
        this.setupEventListeners();
        this.startUpdates();
    }

    // Initialize charts
    setupCharts() {
        // RPC Health Chart
        this.charts.rpc = new Chart(document.getElementById('rpcChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Latency',
                    data: [],
                    borderColor: '#4F46E5',
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gas Chart
        this.charts.gas = new Chart(document.getElementById('gasChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Gas Price',
                    data: [],
                    borderColor: '#10B981',
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // CPU Usage Chart
        this.charts.cpu = new Chart(document.getElementById('cpuChart'), {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#4F46E5', '#E5E7EB']
                }]
            },
            options: {
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });

        // Memory Usage Chart
        this.charts.memory = new Chart(document.getElementById('memoryChart'), {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#10B981', '#E5E7EB']
                }]
            },
            options: {
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });

        // Trading Performance Chart
        this.charts.trading = new Chart(document.getElementById('tradingChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Success Rate',
                    data: [],
                    borderColor: '#4F46E5',
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.updateAll());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Handle alert acknowledgments
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ack-alert')) {
                const alertId = e.target.dataset.alertId;
                this.acknowledgeAlert(alertId);
            }
        });
    }

    // Start automatic updates
    startUpdates() {
        this.updateAll();
        setInterval(() => this.updateAll(), this.updateInterval);
    }

    // Format duration
    formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    // Format number with K/M/B suffix
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    // Update all metrics
    async updateAll() {
        const startTime = performance.now();
        document.getElementById('refreshBtn').classList.add('animate-spin');


        try {
            await Promise.all([
                this.updateQuickStats(),
                this.updateNetworkMetrics(),
                this.updateMarketOverview(),
                this.updateSystemMetrics(),
                this.updateTradingMetrics(),
                this.updateAlerts(),
                this.updateWalletMetrics()
            ]);
        } catch (error) {
            console.error('Failed to update metrics:', error);
            if (error.status === 401) {
                this.logout();
            }
        }
    }

    // API request helper
    async fetchApi(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw { status: response.status, message: await response.text() };
        }

        return response.json();
    }

    // Update quick stats
    async updateQuickStats() {
        const stats = await this.fetchApi('/metrics/quick');
        document.getElementById('botStatus').textContent = stats.status;
        document.getElementById('profit24h').textContent = `${stats.profit24h.toFixed(3)} SOL`;
        document.getElementById('totalTrades').textContent = this.formatNumber(stats.totalTrades);
        document.getElementById('botUptime').textContent = this.formatDuration(stats.uptime);
    }

    // Update system metrics
    async updateSystemMetrics() {
        const metrics = await this.fetchApi('/metrics/system');
        
        // Update CPU chart
        this.charts.cpu.data.datasets[0].data = [metrics.cpu.usage, 100 - metrics.cpu.usage];
        this.charts.cpu.update();
        document.getElementById('cpuUsage').textContent = `${metrics.cpu.usage.toFixed(1)}%`;

        // Update Memory chart
        this.charts.memory.data.datasets[0].data = [metrics.memory.usage, 100 - metrics.memory.usage];
        this.charts.memory.update();
        document.getElementById('memoryUsage').textContent = `${metrics.memory.usage}%`;
    }

    // Update trading metrics
    // Update network metrics
    async updateNetworkMetrics() {
        const metrics = await this.fetchApi('/metrics/network');
        
        // Update RPC chart
        const rpcChart = this.charts.rpc;
        if (rpcChart.data.labels.length > 20) {
            rpcChart.data.labels.shift();
            rpcChart.data.datasets[0].data.shift();
        }
        rpcChart.data.labels.push(new Date().toLocaleTimeString());
        rpcChart.data.datasets[0].data.push(metrics.rpc.latency);
        rpcChart.update();

        // Update gas chart
        const gasChart = this.charts.gas;
        if (gasChart.data.labels.length > 20) {
            gasChart.data.labels.shift();
            gasChart.data.datasets[0].data.shift();
        }
        gasChart.data.labels.push(new Date().toLocaleTimeString());
        gasChart.data.datasets[0].data.push(metrics.gas.current);
        gasChart.update();

        // Update network stats
        document.getElementById('rpcLatency').textContent = `${metrics.rpc.latency} ms`;
        document.getElementById('rpcSuccess').textContent = `${metrics.rpc.successRate}%`;
        document.getElementById('currentGas').textContent = `${metrics.gas.current.toFixed(6)} SOL`;
        document.getElementById('gasSpent').textContent = `${metrics.gas.spent24h.toFixed(3)} SOL`;

        // Update TPS
        const tpsPercent = Math.min((metrics.network.tps / 5000) * 100, 100);
        document.getElementById('tpsBar').style.width = `${tpsPercent}%`;
        document.getElementById('tpsValue').textContent = `${metrics.network.tps} TPS`;

        // Update block time
        const blockTimePercent = Math.min((metrics.network.blockTime / 800) * 100, 100);
        document.getElementById('blockTimeBar').style.width = `${blockTimePercent}%`;
        document.getElementById('blockTimeValue').textContent = `${metrics.network.blockTime} ms`;

        document.getElementById('currentSlot').textContent = this.formatNumber(metrics.network.slot);
    }

    // Update market overview
    async updateMarketOverview() {
        const market = await this.fetchApi('/metrics/market');

        // Update top pairs
        const topPairsHtml = market.topPairs.map(pair => `
            <tr class="border-b">
                <td class="px-4 py-2">${pair.name}</td>
                <td class="px-4 py-2">${pair.volume24h.toFixed(2)} SOL</td>
                <td class="px-4 py-2">${pair.trades24h}</td>
                <td class="px-4 py-2 ${pair.profit >= 0 ? 'text-green-500' : 'text-red-500'}">
                    ${pair.profit.toFixed(3)} SOL
                </td>
            </tr>
        `).join('');
        document.getElementById('topPairs').innerHTML = topPairsHtml;

        // Update opportunities
        const opportunitiesHtml = market.opportunities.map(opp => `
            <div class="p-4 border-b last:border-b-0">
                <div class="flex justify-between items-center">
                    <div class="font-medium">${opp.pair}</div>
                    <div class="text-sm ${opp.profit >= 0 ? 'text-green-500' : 'text-red-500'}">
                        ${opp.profit.toFixed(3)} SOL (${opp.profitPercent.toFixed(2)}%)
                    </div>
                </div>
                <div class="text-sm text-gray-500 mt-1">
                    ${opp.route}
                </div>
            </div>
        `).join('');
        document.getElementById('opportunities').innerHTML = opportunitiesHtml;
    }

    async updateTradingMetrics() {
        const metrics = await this.fetchApi('/metrics/trading');
        
        // Update trading chart
        const chart = this.charts.trading;
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.data.labels.push(new Date().toLocaleTimeString());
        chart.data.datasets[0].data.push(metrics.performance.successRate);
        chart.update();

        // Update performance metrics
        document.getElementById('tradeSuccessRate').textContent = `${metrics.performance.successRate}%`;
        document.getElementById('avgExecutionTime').textContent = `${metrics.performance.avgExecutionTime}ms`;
        document.getElementById('avgSlippage').textContent = `${metrics.performance.avgSlippage}%`;
        document.getElementById('totalProfit').textContent = `${metrics.profits.total.toFixed(3)} SOL`;
    }

    // Update active alerts
    async updateAlerts() {
        const alerts = await this.fetchApi('/alerts/active');
        const tbody = document.getElementById('activeAlerts');
        tbody.innerHTML = alerts.map(alert => `
            <tr class="border-b">
                <td class="px-6 py-4">${this.getAlertEmoji(alert.category)} ${alert.type}</td>
                <td class="px-6 py-4">${alert.category}</td>
                <td class="px-6 py-4">${alert.message}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded ${this.getSeverityClass(alert.severity)}">
                        ${alert.severity}
                    </span>
                </td>
                <td class="px-6 py-4">${new Date(alert.createdAt).toLocaleString()}</td>
                <td class="px-6 py-4">
                    <button class="ack-alert bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            data-alert-id="${alert.id}">
                        Acknowledge
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Update wallet metrics
    async updateWalletMetrics() {
        const metrics = await this.fetchApi('/metrics/wallet');
        const solPrice = await this.getSolanaPrice();
        
        document.getElementById('walletBalance').textContent = `${metrics.balance.toFixed(3)} SOL`;
        document.getElementById('walletUsd').textContent = 
            `($${(metrics.balance * solPrice).toFixed(2)})`;

        // Update recent transactions
        const tbody = document.getElementById('recentTrades');
        tbody.innerHTML = metrics.recentTransactions.map(tx => `
            <tr class="border-b">
                <td class="px-4 py-2">${tx.pair}</td>
                <td class="px-4 py-2">${tx.type}</td>
                <td class="px-4 py-2">${tx.amount.toFixed(3)} SOL</td>
                <td class="px-4 py-2 ${tx.profit >= 0 ? 'text-green-500' : 'text-red-500'}">
                    ${tx.profit.toFixed(3)} SOL
                </td>
                <td class="px-4 py-2">${new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    // Acknowledge an alert
    async acknowledgeAlert(alertId) {
        try {
            await fetch(`${this.baseUrl}/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            this.updateAlerts();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    }

    // Get current Solana price
    async getSolanaPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await response.json();
            return data.solana.usd;
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
            return 0;
        }
    }

    // Helper functions
    getAlertEmoji(category) {
        const emojis = {
            SYSTEM: '🖥️', TRADING: '📊', SECURITY: '🔒',
            PERFORMANCE: '⚡', NETWORK: '🌐', WALLET: '👛',
            ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️'
        };
        return emojis[category] || '❓';
    }

    getSeverityClass(severity) {
        const classes = {
            critical: 'bg-red-100 text-red-800',
            warning: 'bg-yellow-100 text-yellow-800',
            info: 'bg-blue-100 text-blue-800'
        };
        return classes[severity.toLowerCase()] || 'bg-gray-100 text-gray-800';
    }

    // Logout
    logout() {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('admin_token')) {
        window.location.href = '/admin/login.html';
        return;
    }
    new Dashboard();
});
