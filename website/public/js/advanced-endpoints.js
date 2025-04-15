// Advanced API Endpoints and Handlers
class AdvancedEndpoints {
    constructor() {
        this.api = window.apiService;
        this.initializeEndpoints();
    }

    initializeEndpoints() {
        // Add advanced endpoints to API_CONFIG
        Object.assign(API_CONFIG.endpoints, {
            // Risk Analysis Endpoints
            risk: {
                base: '/risk',
                methods: {
                    overview: { method: 'GET', path: '/overview' },
                    exposure: { method: 'GET', path: '/exposure' },
                    limits: { method: 'GET', path: '/limits' },
                    volatility: { method: 'GET', path: '/volatility' },
                    correlation: { method: 'GET', path: '/correlation' },
                    stress: { method: 'GET', path: '/stress-test' }
                }
            },

            // Advanced Analytics Endpoints
            analytics: {
                base: '/analytics',
                methods: {
                    marketMaking: { method: 'GET', path: '/market-making' },
                    arbitrage: { method: 'GET', path: '/arbitrage' },
                    liquidity: { method: 'GET', path: '/liquidity' },
                    slippage: { method: 'GET', path: '/slippage' },
                    impact: { method: 'GET', path: '/price-impact' }
                }
            },

            // Chain Analysis Endpoints
            chains: {
                base: '/chains',
                methods: {
                    health: { method: 'GET', path: '/:chain/health' },
                    congestion: { method: 'GET', path: '/:chain/congestion' },
                    mempool: { method: 'GET', path: '/:chain/mempool' },
                    validators: { method: 'GET', path: '/:chain/validators' }
                }
            },

            // Token Analytics Endpoints
            tokens: {
                base: '/tokens',
                methods: {
                    analysis: { method: 'GET', path: '/:token/analysis' },
                    holders: { method: 'GET', path: '/:token/holders' },
                    distribution: { method: 'GET', path: '/:token/distribution' },
                    volume: { method: 'GET', path: '/:token/volume' }
                }
            },

            // Smart Contract Analysis
            contracts: {
                base: '/contracts',
                methods: {
                    audit: { method: 'GET', path: '/:address/audit' },
                    risk: { method: 'GET', path: '/:address/risk' },
                    interactions: { method: 'GET', path: '/:address/interactions' },
                    events: { method: 'GET', path: '/:address/events' }
                }
            },

            // Advanced Trading Metrics
            trading: {
                base: '/trading',
                methods: {
                    strategies: { method: 'GET', path: '/strategies' },
                    execution: { method: 'GET', path: '/execution' },
                    optimization: { method: 'GET', path: '/optimization' },
                    backtesting: { method: 'POST', path: '/backtest' }
                }
            },

            // System Monitoring
            monitoring: {
                base: '/monitoring',
                methods: {
                    resources: { method: 'GET', path: '/resources' },
                    alerts: { method: 'GET', path: '/alerts' },
                    logs: { method: 'GET', path: '/logs' },
                    errors: { method: 'GET', path: '/errors' }
                }
            }
        });
    }

    // Risk Analysis Methods
    async getRiskOverview(timeRange = '24h') {
        return this.api.fetchData(`${API_CONFIG.endpoints.risk.base}/overview`, { timeRange });
    }

    async getExposureAnalysis(chain = null) {
        const params = chain ? { chain } : {};
        return this.api.fetchData(`${API_CONFIG.endpoints.risk.base}/exposure`, params);
    }

    async getRiskLimits() {
        return this.api.fetchData(`${API_CONFIG.endpoints.risk.base}/limits`);
    }

    async getVolatilityAnalysis(token = null, timeRange = '24h') {
        const params = { timeRange };
        if (token) params.token = token;
        return this.api.fetchData(`${API_CONFIG.endpoints.risk.base}/volatility`, params);
    }

    // Analytics Methods
    async getMarketMakingMetrics(timeRange = '24h') {
        return this.api.fetchData(`${API_CONFIG.endpoints.analytics.base}/market-making`, { timeRange });
    }

    async getArbitrageOpportunities(chain = null) {
        const params = chain ? { chain } : {};
        return this.api.fetchData(`${API_CONFIG.endpoints.analytics.base}/arbitrage`, params);
    }

    async getLiquidityAnalysis(token = null) {
        const params = token ? { token } : {};
        return this.api.fetchData(`${API_CONFIG.endpoints.analytics.base}/liquidity`, params);
    }

    // Chain Analysis Methods
    async getChainHealth(chain) {
        return this.api.fetchData(`${API_CONFIG.endpoints.chains.base}/${chain}/health`);
    }

    async getChainCongestion(chain) {
        return this.api.fetchData(`${API_CONFIG.endpoints.chains.base}/${chain}/congestion`);
    }

    async getMempoolAnalysis(chain) {
        return this.api.fetchData(`${API_CONFIG.endpoints.chains.base}/${chain}/mempool`);
    }

    // Token Analysis Methods
    async getTokenAnalysis(token) {
        return this.api.fetchData(`${API_CONFIG.endpoints.tokens.base}/${token}/analysis`);
    }

    async getTokenDistribution(token) {
        return this.api.fetchData(`${API_CONFIG.endpoints.tokens.base}/${token}/distribution`);
    }

    // Smart Contract Analysis Methods
    async getContractAudit(address) {
        return this.api.fetchData(`${API_CONFIG.endpoints.contracts.base}/${address}/audit`);
    }

    async getContractRisk(address) {
        return this.api.fetchData(`${API_CONFIG.endpoints.contracts.base}/${address}/risk`);
    }

    // Trading Methods
    async getTradingStrategies() {
        return this.api.fetchData(`${API_CONFIG.endpoints.trading.base}/strategies`);
    }

    async getExecutionMetrics(timeRange = '24h') {
        return this.api.fetchData(`${API_CONFIG.endpoints.trading.base}/execution`, { timeRange });
    }

    async runBacktest(params) {
        return this.api.fetchData(`${API_CONFIG.endpoints.trading.base}/backtest`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    // Monitoring Methods
    async getSystemResources() {
        return this.api.fetchData(`${API_CONFIG.endpoints.monitoring.base}/resources`);
    }

    async getAlerts(severity = null) {
        const params = severity ? { severity } : {};
        return this.api.fetchData(`${API_CONFIG.endpoints.monitoring.base}/alerts`, params);
    }

    async getLogs(level = 'error', limit = 100) {
        return this.api.fetchData(`${API_CONFIG.endpoints.monitoring.base}/logs`, { level, limit });
    }

    // WebSocket Subscriptions
    subscribeToUpdates(topics = []) {
        if (this.api.ws && this.api.ws.readyState === WebSocket.OPEN) {
            this.api.ws.send(JSON.stringify({
                type: 'subscribe',
                topics
            }));
        }
    }

    unsubscribeFromUpdates(topics = []) {
        if (this.api.ws && this.api.ws.readyState === WebSocket.OPEN) {
            this.api.ws.send(JSON.stringify({
                type: 'unsubscribe',
                topics
            }));
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.advancedEndpoints = new AdvancedEndpoints();
});
