const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authenticateUser = require('../middleware/authenticateUser');

const router = express.Router();

/**
 * @swagger
 * /api/apikeys:
 *   post:
 *     summary: Generate a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Optional label for the API key
 *     responses:
 *       200:
 *         description: API key generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                 label:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { label } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Generate a secure random API key
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = {
      key,
      label: label || '',
      createdAt: new Date()
    };
    user.apiKeys.push(apiKey);
    await user.save();
    res.json({ key: apiKey.key, label: apiKey.label, createdAt: apiKey.createdAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/apikeys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       key:
 *                         type: string
 *                       label:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       lastUsed:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ apiKeys: user.apiKeys });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/apikeys/{keyId}:
 *   delete:
 *     summary: Revoke (delete) an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The _id of the API key to revoke
 *     responses:
 *       200:
 *         description: API key revoked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or API key not found
 *       500:
 *         description: Server error
 */
router.delete('/:keyId', authenticateUser, async (req, res) => {
  try {
    const { keyId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const idx = user.apiKeys.findIndex(k => k._id.toString() === keyId);
    if (idx === -1) return res.status(404).json({ error: 'API key not found' });
    user.apiKeys.splice(idx, 1);
    await user.save();
    res.json({ message: 'API key revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
