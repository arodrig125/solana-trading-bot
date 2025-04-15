// WebSocket Service for Real-time Updates
class WebSocketService {
    constructor() {
        this.baseUrl = window.location.host;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.subscriptions = new Map();
        this.handlers = new Map();
        this.initializeWebSocket();
    }

    async initializeWebSocket() {
        // Wait for security and handshake services to initialize
        if (!window.securityService || !window.handshakeService) {
            window.securityService = new SecurityService();
            window.handshakeService = new HandshakeService();
            
            // Wait for crypto initialization
            await new Promise(resolve => {
                const checkInit = () => {
                    if (window.securityService.keyPair && 
                        window.securityService.sessionKey) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        }
        // Wait for security service to initialize
        if (!window.securityService) {
            window.securityService = new SecurityService();
            // Wait for crypto initialization
            await new Promise(resolve => {
                const checkInit = () => {
                    if (window.securityService.keyPair && window.securityService.sessionKey) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        }
        try {
            this.ws = new WebSocket(`ws://${this.baseUrl}/ws`);
            this.setupEventHandlers();
            this.registerDefaultHandlers();
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.ws.onopen = this.handleOpen.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        this.ws.onmessage = this.handleMessage.bind(this);
    }

    registerDefaultHandlers() {
        // Trading Updates
        this.registerHandler('trade_execution', (data) => {
            this.updateTradeExecutions(data);
        });

        // Opportunity Updates
        this.registerHandler('opportunity', (data) => {
            this.updateOpportunities(data);
        });

        // Risk Updates
        this.registerHandler('risk_alert', (data) => {
            this.handleRiskAlert(data);
        });

        // System Updates
        this.registerHandler('system_metrics', (data) => {
            this.updateSystemMetrics(data);
        });

        // Chain Updates
        this.registerHandler('chain_status', (data) => {
            this.updateChainStatus(data);
        });

        // Price Updates
        this.registerHandler('price_update', (data) => {
            this.updatePrices(data);
        });

        // Gas Updates
        this.registerHandler('gas_update', (data) => {
            this.updateGasPrices(data);
        });

        // Liquidity Updates
        this.registerHandler('liquidity_update', (data) => {
            this.updateLiquidity(data);
        });
    }

    // WebSocket Event Handlers
    async handleOpen() {
        console.log('WebSocket connection established, initiating handshake');
        
        try {
            // Perform handshake
            const handshakeSuccess = await window.handshakeService.initiateHandshake(this.ws);
            
            if (handshakeSuccess) {
                console.log('Handshake completed successfully');
                this.reconnectAttempts = 0;
                this.resubscribeAll();
                this.notifyConnectionStatus(true);
            } else {
                console.error('Handshake failed');
                this.ws.close();
            }
        } catch (error) {
            console.error('Handshake error:', error);
            this.notifyError({
                type: 'handshake_error',
                message: 'Failed to establish secure connection'
            });
            this.ws.close();
        }
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.resubscribeAll();
        this.notifyConnectionStatus(true);
    }

    handleClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        // Reset handshake state
        window.handshakeService.reset();
        
        this.notifyConnectionStatus(false);
        this.scheduleReconnect();
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.notifyConnectionStatus(false);
        this.scheduleReconnect();
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        this.notifyError(error);
    }

    async handleMessage(event) {
        try {
            // Verify and decrypt the message
            const secureMessage = JSON.parse(event.data);
            const message = await window.securityService.verifyWebSocketMessage(secureMessage);
            
            const handler = this.handlers.get(message.type);
            if (handler) {
                handler(message.data);
            }
        } catch (error) {
            console.error('Error handling secure message:', error);
            this.notifyError({
                type: 'security_error',
                message: 'Invalid or tampered message received'
            });
        }
        try {
            const message = JSON.parse(event.data);
            const handler = this.handlers.get(message.type);
            if (handler) {
                handler(message.data);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    // Subscription Management
    subscribe(topic, callback) {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic).add(callback);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendSubscription('subscribe', topic);
        }
    }

    unsubscribe(topic, callback) {
        if (this.subscriptions.has(topic)) {
            this.subscriptions.get(topic).delete(callback);
            if (this.subscriptions.get(topic).size === 0) {
                this.subscriptions.delete(topic);
                this.sendSubscription('unsubscribe', topic);
            }
        }
    }

    resubscribeAll() {
        for (const topic of this.subscriptions.keys()) {
            this.sendSubscription('subscribe', topic);
        }
    }

    // Message Handlers
    updateTradeExecutions(data) {
        window.tradingVisualizations?.updateTradeData(data);
        this.notifyTrade(data);
    }

    updateOpportunities(data) {
        window.tradingVisualizations?.updateOpportunityData(data);
        if (data.profit > API_CONFIG.notifications.minOpportunityProfit) {
            this.notifyOpportunity(data);
        }
    }

    handleRiskAlert(data) {
        window.tradingVisualizations?.updateRiskMetrics(data);
        if (data.severity >= API_CONFIG.notifications.minRiskSeverity) {
            this.notifyRiskAlert(data);
        }
    }

    updateSystemMetrics(data) {
        window.tradingVisualizations?.updateSystemMetrics(data);
        this.checkSystemHealth(data);
    }

    updateChainStatus(data) {
        window.tradingVisualizations?.updateChainStatus(data);
        this.checkChainHealth(data);
    }

    updatePrices(data) {
        window.tradingVisualizations?.updatePriceData(data);
    }

    updateGasPrices(data) {
        window.tradingVisualizations?.updateGasData(data);
    }

    updateLiquidity(data) {
        window.tradingVisualizations?.updateLiquidityData(data);
    }

    // Health Checks
    checkSystemHealth(metrics) {
        if (metrics.cpu > 80 || metrics.memory > 80) {
            this.notifySystemAlert({
                type: 'system_resources',
                severity: 'high',
                message: 'System resources critically high'
            });
        }
    }

    checkChainHealth(status) {
        if (status.blockDelay > 5 || status.failureRate > 0.1) {
            this.notifySystemAlert({
                type: 'chain_health',
                severity: 'high',
                message: `Chain ${status.chain} experiencing issues`
            });
        }
    }

    // Notification System
    notifyConnectionStatus(connected) {
        const event = new CustomEvent('websocket_status', {
            detail: { connected }
        });
        window.dispatchEvent(event);

        // Update UI indicators
        const statusElement = document.getElementById('wsStatus');
        if (statusElement) {
            statusElement.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
        }
    }

    notifyTrade(trade) {
        this.showNotification('Trade Executed', {
            body: `${trade.type} ${trade.amount} ${trade.token} at ${trade.price}`,
            icon: '/icons/trade.png'
        });
    }

    notifyOpportunity(opportunity) {
        this.showNotification('Arbitrage Opportunity', {
            body: `${opportunity.profit}% profit available on ${opportunity.chain}`,
            icon: '/icons/opportunity.png'
        });
    }

    notifyRiskAlert(alert) {
        this.showNotification('Risk Alert', {
            body: alert.message,
            icon: '/icons/risk.png'
        });
    }

    notifySystemAlert(alert) {
        this.showNotification('System Alert', {
            body: alert.message,
            icon: '/icons/system.png'
        });
    }

    notifyError(error) {
        this.showNotification('Error', {
            body: error.message,
            icon: '/icons/error.png'
        });
    }

    showNotification(title, options) {
        if (!("Notification" in window)) {
            console.log('Notifications not supported');
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(title, options);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, options);
                }
            });
        }
    }

    // Utility Methods
    async sendSubscription(action, topic) {
        if (this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: action,
                topic: topic,
                timestamp: Date.now()
            };

            try {
                const secureMessage = await window.securityService.secureWebSocketMessage(message);
                this.ws.send(JSON.stringify(secureMessage));
            } catch (error) {
                console.error('Error sending secure subscription:', error);
                this.notifyError({
                    type: 'security_error',
                    message: 'Failed to secure subscription message'
                });
            }
        }
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: action,
                topic: topic
            }));
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.initializeWebSocket();
            }, this.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.notifyError({
                message: 'Unable to establish WebSocket connection'
            });
        }
    }

    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
}

// Add WebSocket Status Styles
const style = document.createElement('style');
style.textContent = `
    .status-indicator {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }

    .status-indicator.connected {
        background-color: #28a745;
        color: white;
    }

    .status-indicator.disconnected {
        background-color: #dc3545;
        color: white;
    }

    .notification-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
`;
document.head.appendChild(style);
