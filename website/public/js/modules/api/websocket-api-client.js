class WebSocketAPIClient {
    constructor() {
        this.socket = null;
        this.baseUrl = '';
        this.apiKey = '';
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.messageHandlers = new Map();
        this.streams = {
            market: 'market',
            trades: 'trades',
            orderbook: 'orderbook',
            account: 'account'
        };
    }

    initialize() {
        this.createWebSocketPanel();
        this.loadConfig();
        this.setupMessageHandlers();
    }

    createWebSocketPanel() {
        const panel = document.createElement('div');
        panel.className = 'websocket-api';
        panel.innerHTML = `
            <div class="ws-header">
                <h3>WebSocket API</h3>
                <div class="ws-status">
                    <span class="status-indicator"></span>
                    <span id="wsStatus">Disconnected</span>
                </div>
            </div>
            <div class="ws-controls">
                <div class="control-group">
                    <label>WebSocket URL</label>
                    <div class="input-group">
                        <input type="text" id="wsUrl" placeholder="wss://api.example.com/ws">
                        <button id="wsConnect" class="primary">Connect</button>
                        <button id="wsDisconnect" class="secondary" disabled>Disconnect</button>
                    </div>
                </div>
            </div>
            <div class="ws-subscriptions">
                <h4>Stream Subscriptions</h4>
                <div class="subscription-grid">
                    <div class="subscription-item">
                        <label>
                            <input type="checkbox" id="subMarket" disabled>
                            Market Data
                        </label>
                        <span class="message-count" id="marketCount">0</span>
                    </div>
                    <div class="subscription-item">
                        <label>
                            <input type="checkbox" id="subTrades" disabled>
                            Trade Updates
                        </label>
                        <span class="message-count" id="tradesCount">0</span>
                    </div>
                    <div class="subscription-item">
                        <label>
                            <input type="checkbox" id="subOrderbook" disabled>
                            Orderbook
                        </label>
                        <span class="message-count" id="orderbookCount">0</span>
                    </div>
                    <div class="subscription-item">
                        <label>
                            <input type="checkbox" id="subAccount" disabled>
                            Account Updates
                        </label>
                        <span class="message-count" id="accountCount">0</span>
                    </div>
                </div>
            </div>
            <div class="ws-monitor">
                <div class="monitor-header">
                    <h4>Stream Monitor</h4>
                    <div class="monitor-controls">
                        <button id="clearMonitor" class="secondary" disabled>Clear</button>
                        <label>
                            <input type="checkbox" id="autoScroll" checked>
                            Auto-scroll
                        </label>
                    </div>
                </div>
                <div id="wsMonitor" class="monitor-content"></div>
            </div>
            <div class="ws-metrics">
                <div class="metric-item">
                    <label>Messages/sec</label>
                    <span id="msgRate">0</span>
                </div>
                <div class="metric-item">
                    <label>Latency</label>
                    <span id="wsLatency">-</span>
                </div>
                <div class="metric-item">
                    <label>Uptime</label>
                    <span id="wsUptime">-</span>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .websocket-api {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .ws-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .ws-header h3 {
                margin: 0;
                color: #333;
            }

            .ws-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #dc3545;
                transition: background-color 0.3s ease;
            }

            .status-indicator.connected {
                background: #28a745;
            }

            .ws-controls {
                background: white;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 15px;
            }

            .control-group {
                margin-bottom: 15px;
            }

            .control-group:last-child {
                margin-bottom: 0;
            }

            .control-group label {
                display: block;
                margin-bottom: 5px;
                color: #666;
                font-size: 14px;
            }

            .input-group {
                display: flex;
                gap: 10px;
            }

            .input-group input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .ws-subscriptions {
                background: white;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 15px;
            }

            .ws-subscriptions h4 {
                margin: 0 0 15px 0;
                color: #333;
            }

            .subscription-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .subscription-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            .subscription-item label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #444;
                cursor: pointer;
            }

            .message-count {
                background: #e9ecef;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 12px;
                color: #666;
            }

            .ws-monitor {
                background: white;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 15px;
            }

            .monitor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .monitor-header h4 {
                margin: 0;
                color: #333;
            }

            .monitor-controls {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .monitor-content {
                height: 300px;
                overflow-y: auto;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
                font-family: monospace;
                font-size: 13px;
            }

            .monitor-message {
                padding: 5px;
                margin-bottom: 5px;
                border-radius: 2px;
            }

            .monitor-message:last-child {
                margin-bottom: 0;
            }

            .monitor-message.market {
                background: #e3f2fd;
                color: #0d47a1;
            }

            .monitor-message.trades {
                background: #e8f5e9;
                color: #1b5e20;
            }

            .monitor-message.orderbook {
                background: #fff3e0;
                color: #e65100;
            }

            .monitor-message.account {
                background: #f3e5f5;
                color: #4a148c;
            }

            .ws-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                background: white;
                padding: 15px;
                border-radius: 4px;
            }

            .metric-item {
                text-align: center;
            }

            .metric-item label {
                display: block;
                color: #666;
                font-size: 12px;
                margin-bottom: 5px;
            }

            .metric-item span {
                font-size: 20px;
                font-weight: 500;
                color: #333;
            }
        `;
        document.head.appendChild(style);

        // Insert panel before API client
        const apiClient = document.querySelector('.api-client');
        apiClient.parentNode.insertBefore(panel, apiClient);

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Connect/Disconnect buttons
        document.getElementById('wsConnect').addEventListener('click', () => {
            this.connect();
        });

        document.getElementById('wsDisconnect').addEventListener('click', () => {
            this.disconnect();
        });

        // Stream subscriptions
        Object.keys(this.streams).forEach(stream => {
            document.getElementById(`sub${stream.charAt(0).toUpperCase() + stream.slice(1)}`)
                .addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.subscribe(stream);
                    } else {
                        this.unsubscribe(stream);
                    }
                });
        });

        // Monitor controls
        document.getElementById('clearMonitor').addEventListener('click', () => {
            this.clearMonitor();
        });
    }

    loadConfig() {
        try {
            const config = JSON.parse(localStorage.getItem('apiConfig'));
            if (config) {
                document.getElementById('wsUrl').value = config.endpoint.replace(/^http/, 'ws') + '/ws';
                this.apiKey = config.apiKey;
            }
        } catch (error) {
            console.error('Failed to load WebSocket configuration:', error);
        }
    }

    setupMessageHandlers() {
        this.messageHandlers.set('market', this.handleMarketData.bind(this));
        this.messageHandlers.set('trades', this.handleTradeUpdate.bind(this));
        this.messageHandlers.set('orderbook', this.handleOrderbookUpdate.bind(this));
        this.messageHandlers.set('account', this.handleAccountUpdate.bind(this));
    }

    async connect() {
        const url = document.getElementById('wsUrl').value;
        if (!url) {
            this.addMonitorMessage('Please provide a WebSocket URL', 'error');
            return;
        }

        try {
            this.socket = new WebSocket(url);
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);

            document.getElementById('wsConnect').disabled = true;
            document.getElementById('wsDisconnect').disabled = false;
            document.getElementById('clearMonitor').disabled = false;
            
            this.startMetricsUpdate();
        } catch (error) {
            this.addMonitorMessage(`Connection error: ${error.message}`, 'error');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    handleOpen() {
        this.updateStatus(true);
        this.addMonitorMessage('Connected to WebSocket server', 'success');
        this.authenticate();
        
        // Enable subscription checkboxes
        Object.keys(this.streams).forEach(stream => {
            document.getElementById(`sub${stream.charAt(0).toUpperCase() + stream.slice(1)}`).disabled = false;
        });
    }

    handleClose() {
        this.updateStatus(false);
        this.addMonitorMessage('Disconnected from WebSocket server', 'info');
        
        document.getElementById('wsConnect').disabled = false;
        document.getElementById('wsDisconnect').disabled = true;
        
        // Disable subscription checkboxes
        Object.keys(this.streams).forEach(stream => {
            const checkbox = document.getElementById(`sub${stream.charAt(0).toUpperCase() + stream.slice(1)}`);
            checkbox.disabled = true;
            checkbox.checked = false;
        });

        this.stopMetricsUpdate();
        this.reconnect();
    }

    handleError(error) {
        this.addMonitorMessage(`WebSocket error: ${error.message}`, 'error');
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            const handler = this.messageHandlers.get(message.type);
            
            if (handler) {
                handler(message);
            }

            this.updateMessageCount(message.type);
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    authenticate() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'auth',
                apiKey: this.apiKey
            }));
        }
    }

    subscribe(stream) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                stream: stream
            }));
            this.subscriptions.set(stream, true);
        }
    }

    unsubscribe(stream) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'unsubscribe',
                stream: stream
            }));
            this.subscriptions.delete(stream);
        }
    }

    handleMarketData(message) {
        this.addMonitorMessage(JSON.stringify(message.data, null, 2), 'market');
    }

    handleTradeUpdate(message) {
        this.addMonitorMessage(JSON.stringify(message.data, null, 2), 'trades');
    }

    handleOrderbookUpdate(message) {
        this.addMonitorMessage(JSON.stringify(message.data, null, 2), 'orderbook');
    }

    handleAccountUpdate(message) {
        this.addMonitorMessage(JSON.stringify(message.data, null, 2), 'account');
    }

    addMonitorMessage(message, type) {
        const monitor = document.getElementById('wsMonitor');
        const messageElement = document.createElement('div');
        messageElement.className = `monitor-message ${type}`;
        messageElement.textContent = message;
        
        monitor.appendChild(messageElement);

        if (document.getElementById('autoScroll').checked) {
            monitor.scrollTop = monitor.scrollHeight;
        }
    }

    updateStatus(connected) {
        const indicator = document.querySelector('.ws-status .status-indicator');
        const status = document.getElementById('wsStatus');

        if (connected) {
            indicator.classList.add('connected');
            status.textContent = 'Connected';
        } else {
            indicator.classList.remove('connected');
            status.textContent = 'Disconnected';
        }
    }

    updateMessageCount(type) {
        const countElement = document.getElementById(`${type}Count`);
        if (countElement) {
            countElement.textContent = parseInt(countElement.textContent) + 1;
        }
    }

    clearMonitor() {
        document.getElementById('wsMonitor').innerHTML = '';
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.addMonitorMessage(
                `Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
                'info'
            );
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            this.addMonitorMessage('Max reconnection attempts reached', 'error');
        }
    }

    startMetricsUpdate() {
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);
    }

    stopMetricsUpdate() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
    }

    updateMetrics() {
        // Update messages per second
        const totalMessages = Object.keys(this.streams)
            .reduce((sum, stream) => {
                return sum + parseInt(document.getElementById(`${stream}Count`).textContent);
            }, 0);
        
        document.getElementById('msgRate').textContent = totalMessages;

        // Update latency (if available)
        if (this.lastPingTime) {
            const latency = Date.now() - this.lastPingTime;
            document.getElementById('wsLatency').textContent = `${latency}ms`;
        }

        // Update uptime
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const uptime = Math.floor((Date.now() - this.connectTime) / 1000);
            document.getElementById('wsUptime').textContent = this.formatUptime(uptime);
        }
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }
}

// Initialize when document is ready
window.wsApiClient = new WebSocketAPIClient();
