const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const authenticateUser = require('../middleware/authenticateUser');

const router = express.Router();

/**
 * @swagger
 * /api/2fa/setup:
 *   post:
 *     summary: Generate a TOTP secret and QR code for 2FA setup
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP secret and QR code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qr:
 *                   type: string
 *                   description: Data URL for QR code
 *       400:
 *         description: 2FA already enabled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// POST /api/2fa/setup - Generate secret and QR code
router.post('/setup', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.twoFactorEnabled) {
      return res.status(409).json({ error: '2FA is already enabled' });
    }
    const secret = speakeasy.generateSecret({
      name: `SolanaBot (${user.username})`
    });
    // Save secret temp (not enabled until verified)
    user.twoFactorSecret = secret.base32;
    await user.save();
    // Generate QR code
    const otpauth_url = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth_url);
    res.json({ secret: secret.base32, qr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verify TOTP code and enable 2FA
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: TOTP code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid code or setup not started
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// POST /api/2fa/verify - Verify code and enable 2FA
router.post('/verify', authenticateUser, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup not started' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA (requires valid code)
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: TOTP code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: Invalid code or 2FA not enabled
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// POST /api/2fa/disable - Disable 2FA (require valid code)
router.post('/disable', authenticateUser, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    await user.save();
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
