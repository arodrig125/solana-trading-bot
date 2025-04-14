const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const os = require('os');

// Middleware to verify admin JWT token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Apply admin verification to all routes
router.use(verifyAdminToken);

// Get quick stats
router.get('/metrics/quick', async (req, res) => {
    try {
        const stats = {
            status: global.bot.isRunning ? 'Active' : 'Stopped',
            profit24h: global.profitManager.get24hProfit(),
            totalTrades: global.alertManager.getTotalTrades(),
            uptime: process.uptime()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get network metrics
router.get('/metrics/network', async (req, res) => {
    try {
        const metrics = {
            rpc: {
                latency: global.rpcManager.getAverageLatency(),
                successRate: global.rpcManager.getSuccessRate(),
                errors24h: global.rpcManager.get24hErrors()
            },
            gas: {
                current: global.gasTracker.getCurrentPrice(),
                spent24h: global.gasTracker.get24hSpent(),
                average24h: global.gasTracker.get24hAverage()
            },
            network: {
                tps: await global.networkMonitor.getCurrentTPS(),
                blockTime: await global.networkMonitor.getAverageBlockTime(),
                slot: await global.connection.getSlot()
            }
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get market overview
router.get('/metrics/market', async (req, res) => {
    try {
        const market = {
            topPairs: await global.marketManager.getTopPairs(),
            opportunities: await global.marketManager.getCurrentOpportunities()
        };
        res.json(market);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system metrics
router.get('/metrics/system', async (req, res) => {
    try {
        const metrics = {
            cpu: {
                loadAvg: os.loadavg(),
                usage: process.cpuUsage(),
                cores: os.cpus().length
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
            },
            uptime: os.uptime(),
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch()
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trading metrics
router.get('/metrics/trading', async (req, res) => {
    try {
        const metrics = {
            trades: global.alertManager.lastTradeStats,
            profits: global.profitManager.getStats(),
            performance: {
                successRate: (global.alertManager.lastTradeStats.success / 
                    (global.alertManager.lastTradeStats.success + global.alertManager.lastTradeStats.failure) * 100).toFixed(2),
                avgExecutionTime: global.performanceMetrics.getAverageExecutionTime(),
                avgSlippage: global.performanceMetrics.getAverageSlippage()
            }
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get alert history
router.get('/alerts/history', async (req, res) => {
    try {
        const { category, limit = 50 } = req.query;
        const history = await global.alertManager.getAlertHistory(category, parseInt(limit));
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active alerts
router.get('/alerts/active', async (req, res) => {
    try {
        const activeAlerts = Array.from(global.alertManager.pendingAlerts.values());
        res.json(activeAlerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const success = await global.alertManager.acknowledgeAlert(alertId);
        if (success) {
            res.json({ message: 'Alert acknowledged' });
        } else {
            res.status(404).json({ error: 'Alert not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get wallet metrics
router.get('/metrics/wallet', async (req, res) => {
    try {
        const metrics = {
            balance: await global.wallet.getBalance(),
            pendingTransactions: global.transactionManager.getPendingCount(),
            recentTransactions: await global.transactionManager.getRecentTransactions(10)
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
