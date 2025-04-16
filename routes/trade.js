const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT and set req.user
function authenticateJWT(req, res, next) {
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
 * /api/trade/opportunities:
 *   get:
 *     summary: Get current arbitrage opportunities
 *     tags: [Trade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of arbitrage opportunities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 opportunities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       profitPercent:
 *                         type: number
 *                       buyExchange:
 *                         type: string
 *                       sellExchange:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
// GET /api/trade/opportunities
router.get('/opportunities', authenticateJWT, async (req, res) => {
  // For now, return mock data
  const opportunities = [
    {
      id: 'op1',
      symbol: 'SOL/USDC',
      profitPercent: 0.8,
      buyExchange: 'Orca',
      sellExchange: 'Raydium',
      timestamp: new Date().toISOString()
    },
    {
      id: 'op2',
      symbol: 'SOL/USDT',
      profitPercent: 0.5,
      buyExchange: 'Serum',
      sellExchange: 'Orca',
      timestamp: new Date().toISOString()
    }
  ];
  res.json({ opportunities });
});

/**
 * @swagger
 * /api/trade/execute:
 *   post:
 *     summary: Execute a trade based on opportunity
 *     tags: [Trade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opportunityId
 *               - walletAddress
 *               - amount
 *             properties:
 *               opportunityId:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Trade executed (mock)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trade:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     opportunityId:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Wallet not found or not owned by user
 *       401:
 *         description: Unauthorized
 */
// POST /api/trade/execute
router.post('/execute', authenticateJWT, async (req, res) => {
  // For now, just validate input and return mock result
  const { opportunityId, walletAddress, amount } = req.body;
  if (!opportunityId || !walletAddress || !amount) {
    return res.status(400).json({ error: 'opportunityId, walletAddress, and amount are required' });
  }
  // Check if wallet belongs to user
  const user = await User.findById(req.user.id);
  if (!user || !user.wallets.includes(walletAddress)) {
    return res.status(403).json({ error: 'Wallet not found or not owned by user' });
  }
  // Mock trade result
  const trade = {
    id: 'trade_' + Math.random().toString(36).slice(2),
    opportunityId,
    walletAddress,
    amount,
    status: 'executed',
    timestamp: new Date().toISOString()
  };
  // In real implementation, save trade to DB
  res.json({ trade });
});

/**
 * @swagger
 * /api/trade/history:
 *   get:
 *     summary: Get trade history for the authenticated user
 *     tags: [Trade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trades:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       opportunityId:
 *                         type: string
 *                       walletAddress:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
// GET /api/trade/history
router.get('/history', authenticateJWT, async (req, res) => {
  // For now, return mock trade history
  const trades = [
    {
      id: 'trade1',
      opportunityId: 'op1',
      walletAddress: 'user_wallet_1',
      amount: 10,
      status: 'executed',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'trade2',
      opportunityId: 'op2',
      walletAddress: 'user_wallet_2',
      amount: 5,
      status: 'executed',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];
  res.json({ trades });
});

module.exports = router;
