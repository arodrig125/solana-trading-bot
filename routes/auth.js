const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Optional user role
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing or invalid input
 *       500:
 *         description: Server error
 */
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    // Create user (default role: viewer)
    const user = new User({
      username,
      password,
      role: role || 'viewer'
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: 2FA code (required if 2FA is enabled for the user)
 *     responses:
 *       200:
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing credentials or 2FA code
 *       401:
 *         description: Invalid username, password, or 2FA code
 *       500:
 *         description: Server error
 */
// POST /api/auth/login
const speakeasy = require('speakeasy');

router.post('/login', async (req, res) => {
  try {
    const { username, password, code } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    // If 2FA is enabled, require code
    if (user.twoFactorEnabled) {
      if (!code) {
        return res.status(400).json({ error: '2FA code required.' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code
      });
      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code.' });
      }
    }
    // Issue JWT
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
