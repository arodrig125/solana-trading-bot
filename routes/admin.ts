import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import os from 'os';

const router = Router();

// Middleware to verify admin JWT token
const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        if ((decoded as any).role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        (req as any).user = decoded;
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
router.get('/metrics/quick', async (req: Request, res: Response) => {
    try {
        const stats = {
            status: (global as any).bot.isRunning ? 'Active' : 'Stopped',
            profit24h: (global as any).profitManager.get24hProfit(),
            totalTrades: (global as any).alertManager.getTotalTrades(),
            uptime: process.uptime()
        };
        res.json(stats);
    } catch (error: any) {
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
router.get('/metrics/network', async (req: Request, res: Response) => {
    try {
        const metrics = {
            rpc: {
                latency: (global as any).rpcManager.getAverageLatency(),
                successRate: (global as any).rpcManager.getSuccessRate(),
                errors24h: (global as any).rpcManager.get24hErrors()
            },
            gas: {
                current: (global as any).gasTracker.getCurrentPrice(),
                spent24h: (global as any).gasTracker.get24hSpent(),
                average24h: (global as any).gasTracker.get24hAverage()
            },
            network: {
                tps: await (global as any).networkMonitor.getCurrentTPS(),
                blockTime: await (global as any).networkMonitor.getAverageBlockTime(),
                slot: await (global as any).connection.getSlot()
            }
        };
        res.json(metrics);
    } catch (error: any) {
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
router.get('/metrics/market', async (req: Request, res: Response) => {
    try {
        const market = {
            topPairs: await (global as any).marketManager.getTopPairs(),
            opportunities: await (global as any).marketManager.getCurrentOpportunities()
        };
        res.json(market);
    } catch (error: any) {
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
router.get('/metrics/system', async (req: Request, res: Response) => {
    try {
        const metrics = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpuLoad: os.loadavg(),
            cpuCount: os.cpus().length,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch()
        };
        res.json(metrics);
    } catch (error: any) {
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
router.get('/metrics/trading', async (req: Request, res: Response) => {
    try {
        const metrics = {
            trades: (global as any).performanceMetrics.getTradeCount(),
            profits: (global as any).performanceMetrics.getProfits(),
            performance: {
                avgExecutionTime: (global as any).performanceMetrics.getAverageExecutionTime(),
                avgSlippage: (global as any).performanceMetrics.getAverageSlippage()
            }
        };
        res.json(metrics);
    } catch (error: any) {
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
router.get('/alerts/history', async (req: Request, res: Response) => {
    try {
        const { category, limit = 50 } = req.query;
        const history = await (global as any).alertManager.getAlertHistory(category, parseInt(limit as string));
        res.json(history);
    } catch (error: any) {
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
router.get('/alerts/active', async (req: Request, res: Response) => {
    try {
        const activeAlerts = Array.from((global as any).alertManager.pendingAlerts.values());
        res.json(activeAlerts);
    } catch (error: any) {
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
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const success = await (global as any).alertManager.acknowledgeAlert(alertId);
        if (success) {
            res.json({ message: 'Alert acknowledged' });
        } else {
            res.status(404).json({ error: 'Alert not found' });
        }
    } catch (error: any) {
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
router.get('/metrics/wallet', async (req: Request, res: Response) => {
    try {
        const metrics = {
            balance: await (global as any).wallet.getBalance(),
            pendingTransactions: (global as any).transactionManager.getPendingCount(),
            recentTransactions: await (global as any).transactionManager.getRecentTransactions(10)
        };
        res.json(metrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
