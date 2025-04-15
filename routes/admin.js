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

/**
 * @swagger
 * /admin/api/metrics/quick:
 *   get:
 *     summary: Get quick bot stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quick stats for bot status, profit, trades, uptime
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/metrics/network:
 *   get:
 *     summary: Get network metrics (RPC, gas, network)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Network, RPC, and gas metrics
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/metrics/market:
 *   get:
 *     summary: Get market overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top pairs and current opportunities
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/metrics/system:
 *   get:
 *     summary: Get system metrics (CPU, memory, uptime, host info)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/metrics/trading:
 *   get:
 *     summary: Get trading metrics (trades, profits, performance)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trading metrics
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/alerts/history:
 *   get:
 *     summary: Get alert history
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by alert category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of alerts to return
 *     responses:
 *       200:
 *         description: Array of alert history
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/alerts/active:
 *   get:
 *     summary: Get active alerts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of active alerts
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
// Get active alerts
router.get('/alerts/active', async (req, res) => {
    try {
        const activeAlerts = Array.from(global.alertManager.pendingAlerts.values());
        res.json(activeAlerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /admin/api/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the alert to acknowledge
 *     responses:
 *       200:
 *         description: Alert acknowledged
 *       404:
 *         description: Alert not found
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /admin/api/metrics/wallet:
 *   get:
 *     summary: Get wallet metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance, pending, recent transactions
 *       401:
 *         description: No token provided or invalid
 *       403:
 *         description: Not authorized
 */
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
