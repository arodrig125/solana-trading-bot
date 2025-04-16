const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser');
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview for the authenticated user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalTrades:
 *                       type: integer
 *                     totalVolume:
 *                       type: number
 *                     winLoss:
 *                       type: object
 *                       properties:
 *                         wins:
 *                           type: integer
 *                         losses:
 *                           type: integer
 *                         winRate:
 *                           type: number
 *                     totalProfit:
 *                       type: number
 *                     bestTrade:
 *                       type: object
 *                     worstTrade:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
// GET /api/analytics/overview
router.get('/overview', authenticateUser, async (req, res) => {
  // Mock summary stats
  const overview = {
    totalTrades: 42,
    totalVolume: 12345.67,
    winLoss: {
      wins: 30,
      losses: 12,
      winRate: 0.714
    },
    totalProfit: 789.12,
    bestTrade: {
      id: 'trade123',
      profit: 150.75,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    worstTrade: {
      id: 'trade456',
      profit: -50.00,
      timestamp: new Date(Date.now() - 604800000).toISOString()
    }
  };
  res.json({ overview });
});

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Get time-series performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance time-series data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 performance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       pnl:
 *                         type: number
 *                       trades:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
// GET /api/analytics/performance
router.get('/performance', authenticateUser, async (req, res) => {
  // Mock time-series data
  const now = Date.now();
  const performance = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(now - i * 86400000).toISOString().slice(0, 10),
    pnl: Math.round(Math.random() * 200 - 100), // Random daily P&L
    trades: Math.floor(Math.random() * 5 + 1)
  })).reverse();
  res.json({ performance });
});

/**
 * @swagger
 * /api/analytics/leaderboard:
 *   get:
 *     summary: Get leaderboard of top users by profit
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       totalProfit:
 *                         type: number
 *       401:
 *         description: Unauthorized
 */
// GET /api/analytics/leaderboard
router.get('/leaderboard', authenticateUser, async (req, res) => {
  // Mock leaderboard
  const leaderboard = [
    { username: 'user1', totalProfit: 1200.00 },
    { username: 'user2', totalProfit: 950.50 },
    { username: 'user3', totalProfit: 789.12 }
  ];
  res.json({ leaderboard });
});

module.exports = router;
