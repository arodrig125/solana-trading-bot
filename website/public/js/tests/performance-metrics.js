// Performance Metrics Collection and Visualization
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            trading: {
                orderLatency: [],      // Time from order creation to confirmation
                slippage: [],          // Price slippage percentage
                executionSuccess: [],   // Success rate of trade execution
                profitLoss: [],        // P&L tracking
                gasUsage: [],          // Gas consumption per trade
                routeEfficiency: [],    // Efficiency of chosen trading route
                priceImpact: [],       // Price impact of trades
                liquidityDepth: []      // Available liquidity at price levels
            },
            security: {
                anomalyScores: [],     // Anomaly detection scores
                riskMetrics: [],       // Risk assessment metrics
                fraudAttempts: [],      // Detected fraud attempts
                authFailures: [],       // Authentication failures
                rateLimitHits: [],      // Rate limit violations
                ipReputation: [],       // IP reputation scores
                signatureValidity: [],  // Signature validation results
                privilegeEscalation: [] // Privilege escalation attempts
            },
            system: {
                responseTime: [],      // System response time
                errorRate: [],         // Error rate per minute
                uptime: [],            // System uptime percentage
                loadAverage: [],       // System load average
                diskUsage: [],         // Disk usage percentage
                networkIO: [],         // Network I/O operations
                databaseLatency: [],   // Database query latency
                cacheHitRate: []       // Cache hit/miss ratio
            },
            handshake: {
                latencies: [],
                success: 0,
                failed: 0,
                retries: 0,
                timeouts: 0
            },
            messaging: {
                throughput: [],
                latencies: [],
                dropped: 0,
                queued: 0,
                processed: 0
            },
            crypto: {
                keyGenTime: [],
                signTime: [],
                verifyTime: [],
                encryptTime: [],
                decryptTime: []
            },
            network: {
                rtt: [],
                packetLoss: [],
                bandwidth: [],
                connections: []
            },
            resources: {
                memory: [],
                cpu: [],
                eventLoop: [],
                gcEvents: []
            }
        };

        this.charts = {};
        this.startTime = null;
    }

    // Initialize metrics collection
    start() {
        this.startTime = performance.now();
        this.initializeCharts();
        this.startCollecting();
    }

    // Stop metrics collection
    stop() {
        this.stopCollecting();
        this.generateReport();
    }

    // Record a metric
    record(category, metric, value) {
        if (this.metrics[category] && this.metrics[category][metric]) {
            this.metrics[category][metric].push({
                timestamp: performance.now() - this.startTime,
                value: value
            });
            this.updateCharts(category, metric);
        }
    }

    // Initialize Chart.js charts
    initializeCharts() {
        // Add trading metrics section
        const tradingSection = document.createElement('div');
        tradingSection.className = 'metrics-section trading-metrics';
        tradingSection.innerHTML = `
            <h3>Trading Performance</h3>
            <div class="charts-grid">
                <div class="chart-container" id="orderLatencyChart"></div>
                <div class="chart-container" id="slippageChart"></div>
                <div class="chart-container" id="executionChart"></div>
                <div class="chart-container" id="profitLossChart"></div>
            </div>
        `;
        document.querySelector('.metrics-panel').appendChild(tradingSection);

        // Add security metrics section
        const securitySection = document.createElement('div');
        securitySection.className = 'metrics-section security-metrics';
        securitySection.innerHTML = `
            <h3>Security Metrics</h3>
            <div class="charts-grid">
                <div class="chart-container" id="anomalyChart"></div>
                <div class="chart-container" id="riskMetricsChart"></div>
                <div class="chart-container" id="fraudChart"></div>
                <div class="chart-container" id="authChart"></div>
            </div>
        `;
        document.querySelector('.metrics-panel').appendChild(securitySection);

        // Add system metrics section
        const systemSection = document.createElement('div');
        systemSection.className = 'metrics-section system-metrics';
        systemSection.innerHTML = `
            <h3>System Performance</h3>
            <div class="charts-grid">
                <div class="chart-container" id="responseTimeChart"></div>
                <div class="chart-container" id="errorRateChart"></div>
                <div class="chart-container" id="uptimeChart"></div>
                <div class="chart-container" id="loadChart"></div>
            </div>
        `;
        document.querySelector('.metrics-panel').appendChild(systemSection);
        // Create metrics panel if it doesn't exist
        let metricsPanel = document.getElementById('detailedMetrics');
        if (!metricsPanel) {
            metricsPanel = document.createElement('div');
            metricsPanel.id = 'detailedMetrics';
            metricsPanel.className = 'detailed-metrics';
            document.querySelector('.metrics-panel').appendChild(metricsPanel);
        }

        // Create chart containers
        const categories = ['handshake', 'messaging', 'crypto', 'network', 'resources'];
        categories.forEach(category => {
            const section = document.createElement('div');
            section.className = 'metrics-section';
            section.innerHTML = `
                <h3>${category.charAt(0).toUpperCase() + category.slice(1)} Metrics</h3>
                <div class="charts-container" id="${category}Charts"></div>
            `;
            metricsPanel.appendChild(section);
        });

        // Initialize charts
        this.initializeHandshakeCharts();
        this.initializeMessagingCharts();
        this.initializeCryptoCharts();
        this.initializeNetworkCharts();
        this.initializeResourceCharts();
    }

    // Initialize trading charts
    initializeTradingCharts() {
        const container = document.getElementById('tradingCharts');
        this.charts.trading = {
            orderLatency: this.createChart(container, 'Order Latency', 'ms', {
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderColor: 'rgba(75, 192, 192, 1)'
            }),
            slippage: this.createChart(container, 'Price Slippage', '%', {
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderColor: 'rgba(255, 99, 132, 1)'
            }),
            profitLoss: this.createChart(container, 'Profit/Loss', 'SOL', {
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                borderColor: 'rgba(153, 102, 255, 1)'
            }),
            gasUsage: this.createChart(container, 'Gas Usage', 'SOL', {
                backgroundColor: 'rgba(255, 159, 64, 0.1)',
                borderColor: 'rgba(255, 159, 64, 1)'
            })
        };
    }

    // Initialize security charts
    initializeSecurityCharts() {
        const container = document.getElementById('securityCharts');
        this.charts.security = {
            anomaly: this.createChart(container, 'Anomaly Score', 'Score', {
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderColor: 'rgba(255, 99, 132, 1)'
            }),
            risk: this.createChart(container, 'Risk Level', 'Score', {
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderColor: 'rgba(255, 206, 86, 1)'
            }),
            fraud: this.createChart(container, 'Fraud Attempts', 'Count', {
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderColor: 'rgba(54, 162, 235, 1)'
            }),
            auth: this.createChart(container, 'Auth Failures', 'Count', {
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderColor: 'rgba(75, 192, 192, 1)'
            })
        };
    }

    // Initialize system charts
    initializeSystemCharts() {
        const container = document.getElementById('systemCharts');
        this.charts.system = {
            response: this.createChart(container, 'Response Time', 'ms', {
                backgroundColor: 'rgba(153, 102, 255, 0.1)',
                borderColor: 'rgba(153, 102, 255, 1)'
            }),
            error: this.createChart(container, 'Error Rate', 'Count/min', {
                backgroundColor: 'rgba(255, 159, 64, 0.1)',
                borderColor: 'rgba(255, 159, 64, 1)'
            }),
            uptime: this.createChart(container, 'Uptime', '%', {
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderColor: 'rgba(75, 192, 192, 1)'
            }),
            load: this.createChart(container, 'System Load', 'Score', {
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderColor: 'rgba(255, 99, 132, 1)'
            })
        };
    }

    // Initialize specific chart groups
    initializeHandshakeCharts() {
        const container = document.getElementById('handshakeCharts');
        this.charts.handshake = {
            latency: this.createChart(container, 'Handshake Latency', 'Time (ms)'),
            success: this.createChart(container, 'Success Rate', 'Percentage'),
            retries: this.createChart(container, 'Retry Count', 'Count')
        };
    }

    initializeMessagingCharts() {
        const container = document.getElementById('messagingCharts');
        this.charts.messaging = {
            throughput: this.createChart(container, 'Message Throughput', 'Messages/s'),
            latency: this.createChart(container, 'Message Latency', 'Time (ms)'),
            queue: this.createChart(container, 'Queue Size', 'Messages')
        };
    }

    initializeCryptoCharts() {
        const container = document.getElementById('cryptoCharts');
        this.charts.crypto = {
            operations: this.createChart(container, 'Crypto Operations', 'Time (ms)'),
            keyGen: this.createChart(container, 'Key Generation', 'Time (ms)')
        };
    }

    initializeNetworkCharts() {
        const container = document.getElementById('networkCharts');
        this.charts.network = {
            rtt: this.createChart(container, 'Network RTT', 'Time (ms)'),
            bandwidth: this.createChart(container, 'Bandwidth', 'KB/s'),
            connections: this.createChart(container, 'Active Connections', 'Count')
        };
    }

    initializeResourceCharts() {
        const container = document.getElementById('resourceCharts');
        this.charts.resources = {
            memory: this.createChart(container, 'Memory Usage', 'MB'),
            cpu: this.createChart(container, 'CPU Usage', '%'),
            eventLoop: this.createChart(container, 'Event Loop Lag', 'ms')
        };
    }

    // Create a new Chart.js chart
    createChart(container, label, unit) {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        return new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: `${label} (${unit})`,
                    data: [],
                    borderColor: this.getRandomColor(),
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: unit
                        }
                    }
                }
            }
        });
    }

    // Update charts with new data
    updateCharts(category, metric) {
        const data = this.metrics[category][metric];
        if (data.length === 0) return;

        const chart = this.getChartForMetric(category, metric);
        if (!chart) return;

        const latestPoint = data[data.length - 1];
        chart.data.labels.push((latestPoint.timestamp / 1000).toFixed(1));
        chart.data.datasets[0].data.push(latestPoint.value);

        // Keep only last 50 points for performance
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update('quiet');
    }

    // Get the appropriate chart for a metric
    getChartForMetric(category, metric) {
        switch(category) {
            case 'handshake':
                return this.charts.handshake[metric === 'latencies' ? 'latency' : metric];
            case 'messaging':
                return this.charts.messaging[metric === 'latencies' ? 'latency' : metric];
            case 'crypto':
                return this.charts.crypto[metric.includes('Time') ? 'operations' : 'keyGen'];
            case 'network':
                return this.charts.network[metric];
            case 'resources':
                return this.charts.resources[metric];
            default:
                return null;
        }
    }

    // Start collecting metrics
    startCollecting() {
        // Collect resource metrics every second
        this.resourceInterval = setInterval(() => {
            this.collectResourceMetrics();
        }, 1000);

        // Collect event loop metrics
        this.eventLoopInterval = setInterval(() => {
            this.collectEventLoopMetrics();
        }, 100);
    }

    // Stop collecting metrics
    stopCollecting() {
        clearInterval(this.resourceInterval);
        clearInterval(this.eventLoopInterval);
    }

    // Collect resource metrics
    collectResourceMetrics() {
        // Memory usage
        if (performance.memory) {
            const usedMemory = performance.memory.usedJSHeapSize / (1024 * 1024);
            this.record('resources', 'memory', usedMemory);
        }

        // CPU usage (estimated through message processing time)
        const startTime = performance.now();
        setTimeout(() => {
            const endTime = performance.now();
            const cpuUsage = ((endTime - startTime) / 10) * 100;
            this.record('resources', 'cpu', Math.min(cpuUsage, 100));
        }, 0);
    }

    // Collect event loop metrics
    collectEventLoopMetrics() {
        const startTime = performance.now();
        setTimeout(() => {
            const lag = performance.now() - startTime;
            this.record('resources', 'eventLoop', lag);
        }, 0);
    }

    // Generate performance report
    generateReport() {
        const report = {
            duration: performance.now() - this.startTime,
            summary: this.calculateSummary(),
            recommendations: this.generateRecommendations()
        };

        this.displayReport(report);
    }

    // Calculate summary statistics
    calculateSummary() {
        return {
            handshake: {
                avgLatency: this.calculateAverage(this.metrics.handshake.latencies, 'value'),
                successRate: (this.metrics.handshake.success / 
                    (this.metrics.handshake.success + this.metrics.handshake.failed)) * 100
            },
            messaging: {
                avgThroughput: this.calculateAverage(this.metrics.messaging.throughput, 'value'),
                avgLatency: this.calculateAverage(this.metrics.messaging.latencies, 'value')
            },
            crypto: {
                avgKeyGenTime: this.calculateAverage(this.metrics.crypto.keyGenTime, 'value'),
                avgSignTime: this.calculateAverage(this.metrics.crypto.signTime, 'value')
            },
            network: {
                avgRtt: this.calculateAverage(this.metrics.network.rtt, 'value'),
                packetLossRate: this.calculateAverage(this.metrics.network.packetLoss, 'value')
            }
        };
    }

    // Calculate trading metrics
    calculateTradingMetrics() {
        const trading = this.metrics.trading;
        return {
            avgOrderLatency: this.calculateAverage(trading.orderLatency, 'value'),
            avgSlippage: this.calculateAverage(trading.slippage, 'value'),
            executionRate: this.calculateSuccessRate(trading.executionSuccess),
            profitLossRatio: this.calculateProfitLossRatio(trading.profitLoss),
            avgGasUsage: this.calculateAverage(trading.gasUsage, 'value'),
            routeEfficiency: this.calculateAverage(trading.routeEfficiency, 'value')
        };
    }

    // Calculate security metrics
    calculateSecurityMetrics() {
        const security = this.metrics.security;
        return {
            avgAnomalyScore: this.calculateAverage(security.anomalyScores, 'value'),
            riskLevel: this.calculateRiskLevel(security.riskMetrics),
            fraudAttemptRate: this.calculateRate(security.fraudAttempts),
            authFailureRate: this.calculateRate(security.authFailures),
            rateLimitViolations: security.rateLimitHits.length
        };
    }

    // Calculate system metrics
    calculateSystemMetrics() {
        const system = this.metrics.system;
        return {
            avgResponseTime: this.calculateAverage(system.responseTime, 'value'),
            errorRate: this.calculateRate(system.errorRate),
            uptime: this.calculateUptime(system.uptime),
            avgLoad: this.calculateAverage(system.loadAverage, 'value'),
            cacheEfficiency: this.calculateCacheEfficiency(system.cacheHitRate)
        };
    }

    // Calculate success rate
    calculateSuccessRate(data) {
        if (data.length === 0) return 100;
        const success = data.filter(item => item.value).length;
        return (success / data.length) * 100;
    }

    // Calculate rate (events per minute)
    calculateRate(data) {
        if (data.length === 0) return 0;
        const duration = (data[data.length - 1].timestamp - data[0].timestamp) / 1000 / 60;
        return data.length / duration;
    }

    // Calculate profit/loss ratio
    calculateProfitLossRatio(data) {
        if (data.length === 0) return 0;
        const profits = data.filter(item => item.value > 0).reduce((sum, item) => sum + item.value, 0);
        const losses = Math.abs(data.filter(item => item.value < 0).reduce((sum, item) => sum + item.value, 0));
        return losses === 0 ? profits : profits / losses;
    }

    // Calculate risk level
    calculateRiskLevel(data) {
        if (data.length === 0) return 0;
        const weightedSum = data.reduce((sum, item) => sum + item.value * item.weight, 0);
        const weightSum = data.reduce((sum, item) => sum + item.weight, 0);
        return weightedSum / weightSum;
    }

    // Calculate cache efficiency
    calculateCacheEfficiency(data) {
        if (data.length === 0) return 100;
        const hits = data.filter(item => item.value).length;
        return (hits / data.length) * 100;
    }

    // Calculate uptime percentage
    calculateUptime(data) {
        if (data.length === 0) return 100;
        const downtime = data.filter(item => !item.value).length;
        return ((data.length - downtime) / data.length) * 100;
    }

    // Generate performance recommendations
    generateRecommendations() {
        const recommendations = [];
        const summary = this.calculateSummary();

        // Handshake recommendations
        if (summary.handshake.avgLatency > 500) {
            recommendations.push('Consider optimizing handshake process to reduce latency');
        }
        if (summary.handshake.successRate < 95) {
            recommendations.push('Investigate failed handshakes to improve success rate');
        }

        // Messaging recommendations
        if (summary.messaging.avgThroughput < 100) {
            recommendations.push('Message throughput below target, consider batch processing');
        }
        if (summary.messaging.avgLatency > 200) {
            recommendations.push('High message latency detected, optimize message processing');
        }

        // Network recommendations
        if (summary.network.avgRtt > 100) {
            recommendations.push('High network latency, consider connection pooling');
        }
        if (summary.network.packetLossRate > 0.01) {
            recommendations.push('Significant packet loss detected, implement retry mechanism');
        }

        return recommendations;
    }

    // Calculate average for array of objects
    calculateAverage(array, key) {
        if (array.length === 0) return 0;
        return array.reduce((sum, item) => sum + item[key], 0) / array.length;
    }

    // Display performance report
    displayReport(report) {
        const reportContainer = document.createElement('div');
        reportContainer.className = 'performance-report';
        reportContainer.innerHTML = `
            <h3>Performance Test Report</h3>
            <div class="report-section">
                <h4>Test Duration: ${(report.duration / 1000).toFixed(2)}s</h4>
                
                <h4>Summary</h4>
                <ul>
                    <li>Handshake Latency: ${report.summary.handshake.avgLatency.toFixed(2)}ms</li>
                    <li>Success Rate: ${report.summary.handshake.successRate.toFixed(1)}%</li>
                    <li>Message Throughput: ${report.summary.messaging.avgThroughput.toFixed(2)}/s</li>
                    <li>Message Latency: ${report.summary.messaging.avgLatency.toFixed(2)}ms</li>
                    <li>Network RTT: ${report.summary.network.avgRtt.toFixed(2)}ms</li>
                </ul>

                <h4>Recommendations</h4>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;

        document.getElementById('detailedMetrics').appendChild(reportContainer);
    }

    // Utility function to generate random colors for charts
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}

// Initialize performance metrics
window.performanceMetrics = new PerformanceMetrics();
