const logger = require('../../utils/logger');
const EventEmitter = require('events');

class MonitoringService extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            wallets: new Map(),
            transactions: new Map(),
            errors: new Map(),
            performance: new Map(),
            bridges: new Map(),
            trading: new Map(),
            risk: new Map(),
            system: new Map(),
            gas: new Map(),
            liquidity: new Map()
        };

        // Initialize performance tracking
        this.initializePerformanceTracking();

        // Start system health monitoring
        this.startSystemMonitoring();
        
        this.alerts = [];
        this.healthStatus = new Map();
        this.lastUpdate = Date.now();
    }

    // Update wallet metrics
    updateWalletMetrics(chain, metrics) {
        this.metrics.wallets.set(chain, {
            ...metrics,
            timestamp: Date.now()
        });

        // Emit event for real-time updates
        this.emit('wallet_update', { chain, metrics });

        // Check for alerts
        this.checkWalletAlerts(chain, metrics);
    }

    // Update transaction metrics
    updateTransactionMetrics(chain, metrics) {
        this.metrics.transactions.set(chain, {
            ...metrics,
            timestamp: Date.now()
        });

        this.emit('transaction_update', { chain, metrics });
        this.checkTransactionAlerts(chain, metrics);
    }

    // Update error metrics
    updateErrorMetrics(errorStats) {
        this.metrics.errors.set('global', {
            ...errorStats,
            timestamp: Date.now()
        });

        this.emit('error_update', errorStats);
        this.checkErrorAlerts(errorStats);
    }

    // Update bridge metrics
    updateBridgeMetrics(bridge, metrics) {
        this.metrics.bridges.set(bridge, {
            ...metrics,
            timestamp: Date.now()
        });

        this.emit('bridge_update', { bridge, metrics });
        this.checkBridgeAlerts(bridge, metrics);
    }

    // Update performance metrics
    updatePerformanceMetrics(metrics) {
        this.metrics.performance.set('global', {
            ...metrics,
            timestamp: Date.now()
        });

        this.emit('performance_update', metrics);
        this.checkPerformanceAlerts(metrics);
    }

    // Check wallet-related alerts
    checkWalletAlerts(chain, metrics) {
        const alerts = [];

        // Check balance thresholds
        if (metrics.balance < metrics.minBalance) {
            alerts.push({
                type: 'wallet_low_balance',
                severity: 'high',
                chain,
                message: `Low balance on ${chain}: ${metrics.balance}`,
                timestamp: Date.now()
            });
        }

        // Check wallet health
        if (metrics.status !== 'active') {
            alerts.push({
                type: 'wallet_health',
                severity: 'critical',
                chain,
                message: `Wallet health issue on ${chain}: ${metrics.status}`,
                timestamp: Date.now()
            });
        }

        this.addAlerts(alerts);
    }

    // Check transaction-related alerts
    checkTransactionAlerts(chain, metrics) {
        const alerts = [];

        // Check pending transactions
        if (metrics.pendingCount > metrics.maxPending) {
            alerts.push({
                type: 'high_pending_transactions',
                severity: 'medium',
                chain,
                message: `High number of pending transactions on ${chain}: ${metrics.pendingCount}`,
                timestamp: Date.now()
            });
        }

        // Check failed transactions
        if (metrics.failureRate > 0.1) { // 10% failure rate threshold
            alerts.push({
                type: 'high_failure_rate',
                severity: 'high',
                chain,
                message: `High transaction failure rate on ${chain}: ${metrics.failureRate * 100}%`,
                timestamp: Date.now()
            });
        }

        this.addAlerts(alerts);
    }

    // Check bridge-related alerts
    checkBridgeAlerts(bridge, metrics) {
        const alerts = [];

        // Check bridge utilization
        if (metrics.utilization > 0.9) { // 90% utilization threshold
            alerts.push({
                type: 'high_bridge_utilization',
                severity: 'high',
                bridge,
                message: `High bridge utilization on ${bridge}: ${metrics.utilization * 100}%`,
                timestamp: Date.now()
            });
        }

        // Check bridge delays
        if (metrics.averageDelay > metrics.maxDelay) {
            alerts.push({
                type: 'bridge_delay',
                severity: 'medium',
                bridge,
                message: `High bridge delay on ${bridge}: ${metrics.averageDelay}ms`,
                timestamp: Date.now()
            });
        }

        this.addAlerts(alerts);
    }

    // Check error-related alerts
    checkErrorAlerts(errorStats) {
        const alerts = [];

        // Check error rate
        if (errorStats.errorRate > 0.05) { // 5% error rate threshold
            alerts.push({
                type: 'high_error_rate',
                severity: 'high',
                message: `High global error rate: ${errorStats.errorRate * 100}%`,
                timestamp: Date.now()
            });
        }

        // Check recovery success rate
        if (errorStats.recoverySuccessRate < 0.8) { // 80% recovery success threshold
            alerts.push({
                type: 'low_recovery_rate',
                severity: 'medium',
                message: `Low error recovery success rate: ${errorStats.recoverySuccessRate * 100}%`,
                timestamp: Date.now()
            });
        }

        this.addAlerts(alerts);
    }

    // Check performance-related alerts
    checkPerformanceAlerts(metrics) {
        const alerts = [];

        // Check profit targets
        if (metrics.dailyProfit < metrics.dailyTarget) {
            alerts.push({
                type: 'missed_profit_target',
                severity: 'medium',
                message: `Daily profit below target: ${metrics.dailyProfit} vs ${metrics.dailyTarget}`,
                timestamp: Date.now()
            });
        }

        // Check drawdown
        if (metrics.currentDrawdown > metrics.maxDrawdown) {
            alerts.push({
                type: 'high_drawdown',
                severity: 'high',
                message: `High drawdown: ${metrics.currentDrawdown * 100}%`,
                timestamp: Date.now()
            });
        }

        this.addAlerts(alerts);
    }

    // Add new alerts
    addAlerts(newAlerts) {
        for (const alert of newAlerts) {
            this.alerts.push(alert);
            this.emit('alert', alert);
            
            // Log alert
            const logLevel = alert.severity === 'critical' ? 'error' : 
                           alert.severity === 'high' ? 'warn' : 'info';
            logger[logLevel](`[ALERT] ${alert.message}`);
        }

        // Clean up old alerts
        this.cleanupOldAlerts();
    }

    // Clean up alerts older than 24 hours
    cleanupOldAlerts() {
        const now = Date.now();
        this.alerts = this.alerts.filter(alert => 
            now - alert.timestamp < 24 * 60 * 60 * 1000
        );
    }

    // Get current metrics
    getMetrics() {
        return {
            wallets: Object.fromEntries(this.metrics.wallets),
            transactions: Object.fromEntries(this.metrics.transactions),
            errors: Object.fromEntries(this.metrics.errors),
            performance: Object.fromEntries(this.metrics.performance),
            bridges: Object.fromEntries(this.metrics.bridges)
        };
    }

    // Get active alerts
    getAlerts(options = {}) {
        let filteredAlerts = [...this.alerts];

        if (options.severity) {
            filteredAlerts = filteredAlerts.filter(alert => 
                alert.severity === options.severity
            );
        }

        if (options.type) {
            filteredAlerts = filteredAlerts.filter(alert => 
                alert.type === options.type
            );
        }

        return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Get health status
    getHealthStatus() {
        const status = {
            overall: 'healthy',
            components: {}
        };

        // Check wallet health
        for (const [chain, metrics] of this.metrics.wallets.entries()) {
            status.components[`wallet_${chain}`] = metrics.status;
            if (metrics.status !== 'active') {
                status.overall = 'degraded';
            }
        }

        // Check error rates
        const errorMetrics = this.metrics.errors.get('global');
        if (errorMetrics && errorMetrics.errorRate > 0.1) {
            status.overall = 'unhealthy';
        }

        // Check bridge health
        for (const [bridge, metrics] of this.metrics.bridges.entries()) {
            status.components[`bridge_${bridge}`] = 
                metrics.utilization > 0.9 ? 'degraded' : 'healthy';
        }

        return status;
    }

    // Initialize performance tracking
    initializePerformanceTracking() {
        // Trading metrics
        this.metrics.trading.set('global', {
            profitLoss: {
                daily: new Map(),
                weekly: new Map(),
                monthly: new Map(),
                total: 0
            },
            volumeStats: {
                daily: new Map(),
                weekly: new Map(),
                monthly: new Map()
            },
            opportunities: {
                identified: 0,
                executed: 0,
                successful: 0,
                failed: 0
            },
            profitability: {
                averageReturn: 0,
                bestReturn: 0,
                worstReturn: 0,
                volatility: 0
            },
            timing: {
                averageExecutionTime: 0,
                averageConfirmationTime: 0,
                fastestExecution: Infinity,
                slowestExecution: 0
            }
        });

        // Risk metrics
        this.metrics.risk.set('global', {
            exposure: {
                byChain: new Map(),
                byToken: new Map(),
                byBridge: new Map()
            },
            concentration: {
                chainConcentration: 0,
                tokenConcentration: 0,
                bridgeConcentration: 0
            },
            volatility: {
                priceVolatility: new Map(),
                returnVolatility: 0,
                drawdown: {
                    current: 0,
                    maximum: 0,
                    average: 0
                }
            },
            correlations: {
                chainCorrelations: new Map(),
                tokenCorrelations: new Map()
            },
            riskAdjustedMetrics: {
                sharpeRatio: 0,
                sortinoRatio: 0,
                calmarRatio: 0
            }
        });

        // Gas metrics
        this.metrics.gas.set('global', {
            current: {
                byChain: new Map(),
                average: 0,
                high: 0,
                low: 0
            },
            historical: {
                hourly: new Map(),
                daily: new Map()
            },
            optimization: {
                savings: 0,
                efficiency: 0
            },
            predictions: {
                nextHour: new Map(),
                nextDay: new Map()
            }
        });

        // Liquidity metrics
        this.metrics.liquidity.set('global', {
            pools: new Map(),
            depth: {
                byToken: new Map(),
                byPair: new Map()
            },
            slippage: {
                estimates: new Map(),
                actual: new Map()
            },
            volume: {
                hourly: new Map(),
                daily: new Map()
            },
            concentration: {
                byPool: new Map(),
                byToken: new Map()
            }
        });

        // System metrics
        this.metrics.system.set('global', {
            resources: {
                cpu: {
                    usage: 0,
                    load: 0
                },
                memory: {
                    used: 0,
                    available: 0,
                    swapUsage: 0
                },
                network: {
                    bandwidth: 0,
                    latency: new Map()
                },
                storage: {
                    used: 0,
                    available: 0
                }
            },
            performance: {
                requestsPerSecond: 0,
                responseTime: 0,
                queueLength: 0,
                processingTime: 0
            },
            availability: {
                uptime: 0,
                lastDowntime: null,
                incidents: []
            },
            dependencies: {
                rpcNodes: new Map(),
                bridges: new Map(),
                exchanges: new Map()
            }
        });
    }

    // Start system monitoring
    startSystemMonitoring() {
        setInterval(() => {
            this.updateSystemMetrics();
        }, 5000); // Update every 5 seconds

        setInterval(() => {
            this.updateTradingMetrics();
        }, 60000); // Update every minute

        setInterval(() => {
            this.updateRiskMetrics();
        }, 300000); // Update every 5 minutes
    }

    // Update system metrics
    async updateSystemMetrics() {
        const systemMetrics = this.metrics.system.get('global');
        
        // Update CPU and memory usage
        const os = require('os');
        systemMetrics.resources.cpu.load = os.loadavg()[0];
        systemMetrics.resources.memory.used = os.totalmem() - os.freemem();
        systemMetrics.resources.memory.available = os.freemem();

        // Update network latency
        for (const [chain, config] of Object.entries(this.config.chains)) {
            const startTime = Date.now();
            try {
                await fetch(config.rpcUrl);
                const latency = Date.now() - startTime;
                systemMetrics.resources.network.latency.set(chain, latency);
            } catch (error) {
                logger.error(`Failed to measure latency for ${chain}: ${error.message}`);
            }
        }

        // Update dependency status
        for (const [chain, config] of Object.entries(this.config.chains)) {
            try {
                const response = await fetch(config.rpcUrl);
                systemMetrics.dependencies.rpcNodes.set(chain, {
                    status: response.ok ? 'healthy' : 'degraded',
                    latency: response.headers.get('x-response-time'),
                    lastChecked: Date.now()
                });
            } catch (error) {
                systemMetrics.dependencies.rpcNodes.set(chain, {
                    status: 'down',
                    error: error.message,
                    lastChecked: Date.now()
                });
            }
        }

        this.emit('system_update', systemMetrics);
    }

    // Update trading metrics
    updateTradingMetrics() {
        const tradingMetrics = this.metrics.trading.get('global');
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        // Update daily volume
        const dailyVolume = Array.from(this.metrics.transactions.values())
            .filter(tx => tx.timestamp > now - 24 * 60 * 60 * 1000)
            .reduce((sum, tx) => sum + tx.amount, 0);
        tradingMetrics.volumeStats.daily.set(today, dailyVolume);

        // Calculate profit metrics
        const recentTrades = Array.from(this.metrics.transactions.values())
            .filter(tx => tx.timestamp > now - 24 * 60 * 60 * 1000);

        if (recentTrades.length > 0) {
            tradingMetrics.profitability.averageReturn = recentTrades
                .reduce((sum, trade) => sum + trade.profit, 0) / recentTrades.length;

            tradingMetrics.profitability.bestReturn = Math.max(
                ...recentTrades.map(trade => trade.profit)
            );

            tradingMetrics.profitability.worstReturn = Math.min(
                ...recentTrades.map(trade => trade.profit)
            );

            // Calculate volatility
            const returns = recentTrades.map(trade => trade.profit);
            tradingMetrics.profitability.volatility = this.calculateVolatility(returns);
        }

        this.emit('trading_update', tradingMetrics);
    }

    // Update risk metrics
    updateRiskMetrics() {
        const riskMetrics = this.metrics.risk.get('global');
        const now = Date.now();

        // Update exposure metrics
        for (const [chain, wallet] of this.metrics.wallets.entries()) {
            riskMetrics.exposure.byChain.set(chain, wallet.balance);
        }

        // Calculate concentration metrics
        const totalExposure = Array.from(riskMetrics.exposure.byChain.values())
            .reduce((sum, balance) => sum + balance, 0);

        riskMetrics.concentration.chainConcentration = this.calculateHerfindahlIndex(
            Array.from(riskMetrics.exposure.byChain.values()),
            totalExposure
        );

        // Update drawdown metrics
        const trades = Array.from(this.metrics.transactions.values())
            .filter(tx => tx.timestamp > now - 30 * 24 * 60 * 60 * 1000);

        if (trades.length > 0) {
            const equityCurve = this.calculateEquityCurve(trades);
            const drawdown = this.calculateDrawdown(equityCurve);
            
            riskMetrics.volatility.drawdown = {
                current: drawdown.current,
                maximum: drawdown.maximum,
                average: drawdown.average
            };

            // Calculate risk-adjusted metrics
            const returns = trades.map(trade => trade.profit);
            riskMetrics.riskAdjustedMetrics.sharpeRatio = this.calculateSharpeRatio(returns);
            riskMetrics.riskAdjustedMetrics.sortinoRatio = this.calculateSortinoRatio(returns);
            riskMetrics.riskAdjustedMetrics.calmarRatio = this.calculateCalmarRatio(
                returns,
                drawdown.maximum
            );
        }

        this.emit('risk_update', riskMetrics);
    }

    // Helper function to calculate volatility
    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / (returns.length - 1));
    }

    // Helper function to calculate Herfindahl Index (concentration)
    calculateHerfindahlIndex(values, total) {
        if (total === 0) return 0;
        return values
            .map(v => Math.pow(v / total, 2))
            .reduce((sum, v) => sum + v, 0);
    }

    // Helper function to calculate equity curve
    calculateEquityCurve(trades) {
        let equity = 0;
        return trades
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(trade => {
                equity += trade.profit;
                return {
                    timestamp: trade.timestamp,
                    equity
                };
            });
    }

    // Helper function to calculate drawdown metrics
    calculateDrawdown(equityCurve) {
        let peak = -Infinity;
        let maxDrawdown = 0;
        let currentDrawdown = 0;
        let totalDrawdown = 0;
        let drawdownCount = 0;

        equityCurve.forEach(point => {
            if (point.equity > peak) {
                peak = point.equity;
            }

            const drawdown = (peak - point.equity) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
            currentDrawdown = drawdown;

            if (drawdown > 0) {
                totalDrawdown += drawdown;
                drawdownCount++;
            }
        });

        return {
            current: currentDrawdown,
            maximum: maxDrawdown,
            average: drawdownCount > 0 ? totalDrawdown / drawdownCount : 0
        };
    }

    // Helper function to calculate Sharpe Ratio
    calculateSharpeRatio(returns) {
        if (returns.length < 2) return 0;
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const riskFreeRate = 0.02 / 365; // Assuming 2% annual risk-free rate
        const volatility = this.calculateVolatility(returns);
        return volatility === 0 ? 0 : (meanReturn - riskFreeRate) / volatility;
    }

    // Helper function to calculate Sortino Ratio
    calculateSortinoRatio(returns) {
        if (returns.length < 2) return 0;
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const riskFreeRate = 0.02 / 365;
        const negativeReturns = returns.filter(r => r < 0);
        const downside = this.calculateVolatility(negativeReturns);
        return downside === 0 ? 0 : (meanReturn - riskFreeRate) / downside;
    }

    // Helper function to calculate Calmar Ratio
    calculateCalmarRatio(returns, maxDrawdown) {
        if (returns.length === 0 || maxDrawdown === 0) return 0;
        const annualizedReturn = returns.reduce((sum, r) => sum + r, 0) * 365 / returns.length;
        return annualizedReturn / maxDrawdown;
    }

    // Get performance summary
    getPerformanceSummary() {
        const performance = this.metrics.performance.get('global') || {};
        const trading = this.metrics.trading.get('global') || {};
        const risk = this.metrics.risk.get('global') || {};

        return {
            // Basic metrics
            dailyProfit: performance.dailyProfit || 0,
            totalProfit: performance.totalProfit || 0,
            successRate: performance.successRate || 0,
            averageExecutionTime: performance.averageExecutionTime || 0,

            // Advanced metrics
            profitability: trading.profitability || {},
            volumeStats: trading.volumeStats || {},
            riskMetrics: {
                sharpeRatio: risk.riskAdjustedMetrics?.sharpeRatio || 0,
                sortinoRatio: risk.riskAdjustedMetrics?.sortinoRatio || 0,
                calmarRatio: risk.riskAdjustedMetrics?.calmarRatio || 0,
                currentDrawdown: risk.volatility?.drawdown?.current || 0,
                maxDrawdown: risk.volatility?.drawdown?.maximum || 0
            },
            systemHealth: this.getSystemHealthScore(),
            timestamp: Date.now()
        };
    }
}

module.exports = MonitoringService;
