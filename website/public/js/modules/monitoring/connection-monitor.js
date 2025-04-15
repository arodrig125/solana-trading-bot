class ConnectionMonitor {
    constructor() {
        this.statusElement = null;
        this.metricsElement = null;
        this.lastPingTime = 0;
        this.pingInterval = 5000; // 5 seconds
        this.metrics = {
            latency: [],
            uptime: 0,
            reconnects: 0,
            messageCount: 0
        };
        this.maxMetricsHistory = 100;
        this.startTime = Date.now();
    }

    initialize() {
        this.createMonitoringPanel();
        this.startMonitoring();
    }

    createMonitoringPanel() {
        const panel = document.createElement('div');
        panel.className = 'connection-monitor';
        panel.innerHTML = `
            <div class="monitor-header">
                <h3>WebSocket Connection Monitor</h3>
                <span class="connection-status" id="wsStatus">Initializing...</span>
            </div>
            <div class="monitor-metrics">
                <div class="metric">
                    <label>Uptime:</label>
                    <span id="wsUptime">0s</span>
                </div>
                <div class="metric">
                    <label>Latency:</label>
                    <span id="wsLatency">-</span>
                </div>
                <div class="metric">
                    <label>Messages:</label>
                    <span id="wsMessages">0</span>
                </div>
                <div class="metric">
                    <label>Reconnects:</label>
                    <span id="wsReconnects">0</span>
                </div>
            </div>
            <div class="latency-chart">
                <canvas id="latencyChart"></canvas>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .connection-monitor {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .monitor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .monitor-header h3 {
                margin: 0;
                color: #333;
            }

            .connection-status {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
            }

            .status-connected {
                background: #d4edda;
                color: #155724;
            }

            .status-disconnected {
                background: #f8d7da;
                color: #721c24;
            }

            .status-connecting {
                background: #fff3cd;
                color: #856404;
            }

            .monitor-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }

            .metric {
                background: white;
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .metric label {
                display: block;
                color: #666;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .metric span {
                font-size: 16px;
                font-weight: 500;
                color: #333;
            }

            .latency-chart {
                background: white;
                padding: 10px;
                border-radius: 4px;
                height: 200px;
            }
        `;
        document.head.appendChild(style);

        // Insert panel before test controls
        const testControls = document.querySelector('.test-controls');
        testControls.parentNode.insertBefore(panel, testControls);

        // Store references to elements
        this.statusElement = document.getElementById('wsStatus');
        this.uptimeElement = document.getElementById('wsUptime');
        this.latencyElement = document.getElementById('wsLatency');
        this.messagesElement = document.getElementById('wsMessages');
        this.reconnectsElement = document.getElementById('wsReconnects');

        // Initialize latency chart
        this.initializeLatencyChart();
    }

    initializeLatencyChart() {
        const ctx = document.getElementById('latencyChart').getContext('2d');
        this.latencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Latency (ms)'
                        }
                    },
                    x: {
                        display: false
                    }
                }
            }
        });
    }

    startMonitoring() {
        // Monitor WebSocket status
        window.wsService.onStatusChange = (status) => {
            this.updateStatus(status);
        };

        // Monitor messages
        window.wsService.onMessage = (msg) => {
            this.metrics.messageCount++;
            this.updateMetrics();
        };

        // Monitor reconnections
        window.wsService.onReconnect = () => {
            this.metrics.reconnects++;
            this.updateMetrics();
        };

        // Start ping interval
        setInterval(() => this.ping(), this.pingInterval);

        // Start uptime counter
        setInterval(() => this.updateUptime(), 1000);
    }

    updateStatus(status) {
        const statusMap = {
            CONNECTED: ['Connected', 'status-connected'],
            DISCONNECTED: ['Disconnected', 'status-disconnected'],
            CONNECTING: ['Connecting...', 'status-connecting']
        };

        const [text, className] = statusMap[status] || ['Unknown', ''];
        this.statusElement.textContent = text;
        this.statusElement.className = `connection-status ${className}`;
    }

    async ping() {
        if (window.wsService.isConnected()) {
            this.lastPingTime = Date.now();
            await window.wsService.send('ping');
        }
    }

    handlePong() {
        const latency = Date.now() - this.lastPingTime;
        this.metrics.latency.push(latency);
        if (this.metrics.latency.length > this.maxMetricsHistory) {
            this.metrics.latency.shift();
        }
        this.updateMetrics();
        this.updateLatencyChart();
    }

    updateMetrics() {
        const currentLatency = this.metrics.latency[this.metrics.latency.length - 1];
        this.latencyElement.textContent = currentLatency ? `${currentLatency}ms` : '-';
        this.messagesElement.textContent = this.metrics.messageCount;
        this.reconnectsElement.textContent = this.metrics.reconnects;
    }

    updateUptime() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        this.uptimeElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    updateLatencyChart() {
        const timestamps = this.metrics.latency.map((_, i) => 
            new Date(Date.now() - (this.metrics.latency.length - 1 - i) * this.pingInterval)
                .toLocaleTimeString()
        );

        this.latencyChart.data.labels = timestamps;
        this.latencyChart.data.datasets[0].data = this.metrics.latency;
        this.latencyChart.update();
    }
}

// Initialize when document is ready
window.connectionMonitor = new ConnectionMonitor();
