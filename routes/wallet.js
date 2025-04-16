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
 * /api/wallet:
 *   post:
 *     summary: Add a wallet address
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Wallet address to add
 *     responses:
 *       200:
 *         description: Wallets updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallets:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Wallet already added or missing address
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Add a wallet address
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.wallets.includes(walletAddress)) {
      return res.status(400).json({ error: 'Wallet already added' });
    }
    user.wallets.push(walletAddress);
    await user.save();
    res.json({ wallets: user.wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: List all wallet addresses
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallets:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// List all wallet addresses
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ wallets: user.wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/wallet/{walletAddress}:
 *   delete:
 *     summary: Remove a wallet address
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to remove
 *     responses:
 *       200:
 *         description: Wallets updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallets:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or wallet not found
 *       500:
 *         description: Server error
 */
// Remove a wallet address
router.delete('/:walletAddress', authenticateJWT, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const index = user.wallets.indexOf(walletAddress);
    if (index === -1) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    user.wallets.splice(index, 1);
    await user.save();
    res.json({ wallets: user.wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
