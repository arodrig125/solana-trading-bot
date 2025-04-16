const express = require('express');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const authenticateUser = require('../middleware/authenticateUser');

const router = express.Router();

// Middleware: Only allow admin users
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * @swagger
 * /admin/api/users:
 *   get:
 *     summary: Search, filter, and paginate users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [enabled, disabled]
 *         description: Filter by account status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { search, role, status, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status === 'enabled') filter.disabled = { $ne: true };
    if (status === 'disabled') filter.disabled = true;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter, '-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
    res.json({ users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/api/users/{userId}:
 *   get:
 *     summary: Get detailed user info (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, '-password -twoFactorSecret');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/api/users/{userId}/role:
 *   patch:
 *     summary: Change user role (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/users/:userId/role', authenticateUser, requireAdmin, async (req, res) => {
  // Scaffold: implement role change
  res.json({ message: 'Role updated' });
});

/**
 * @swagger
 * /admin/api/users/{userId}/reset-password:
 *   patch:
 *     summary: Force password reset for user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset triggered
 */
router.patch('/users/:userId/reset-password', authenticateUser, requireAdmin, async (req, res) => {
  // Scaffold: implement password reset trigger
  res.json({ message: 'Password reset triggered' });
});

/**
 * @swagger
 * /admin/api/users/{userId}:
 *   delete:
 *     summary: Soft delete a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { disabled: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User soft deleted', user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/api/logs:
 *   get:
 *     summary: List API logs (admin only, advanced filters, CSV export)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by userId
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *         description: Filter logs by route
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *         description: Filter by HTTP status code
 *       - in: query
 *         name: authType
 *         schema:
 *           type: string
 *           enum: [jwt, apikey, none]
 *         description: Filter by authentication type
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO)
 *       - in: query
 *         name: csv
 *         schema:
 *           type: boolean
 *         description: Export as CSV
 *     responses:
 *       200:
 *         description: List of API logs or CSV
 */
const { Parser: Json2csvParser } = require('json2csv');

router.get('/logs', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId, route, status, authType, from, to, csv } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (route) filter.route = route;
    if (status) filter.status = Number(status);
    if (authType) filter.authType = authType;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    const logs = await ApiLog.find(filter).sort({ timestamp: -1 }).limit(500);
    if (csv === 'true') {
      // Export as CSV
      const fields = ['userId','apiKey','route','method','status','timestamp','ip','userAgent','authType'];
      const parser = new Json2csvParser({ fields });
      const csvData = parser.parse(logs.map(l => l.toObject()));
      res.header('Content-Type', 'text/csv');
      res.attachment('api-logs.csv');
      return res.send(csvData);
    }
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/api/users/{userId}/disable:
 *   patch:
 *     summary: Disable a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User disabled
 */
router.patch('/users/:userId/disable', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndUpdate(userId, { disabled: true });
  res.json({ message: 'User disabled' });
});

/**
 * @swagger
 * /admin/api/users/{userId}/enable:
 *   patch:
 *     summary: Enable a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User enabled
 */
router.patch('/users/:userId/enable', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndUpdate(userId, { disabled: false });
  res.json({ message: 'User enabled' });
});

/**
 * @swagger
 * /admin/api/users/{userId}/apikeys/{keyId}:
 *   delete:
 *     summary: Revoke a user's API key (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked
 */
router.delete('/users/:userId/apikeys/:keyId', authenticateUser, requireAdmin, async (req, res) => {
  const { userId, keyId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const idx = user.apiKeys.findIndex(k => k._id.toString() === keyId);
  if (idx === -1) return res.status(404).json({ error: 'API key not found' });
  user.apiKeys.splice(idx, 1);
  await user.save();
  res.json({ message: 'API key revoked' });
});

/**
 * @swagger
 * /admin/api/logs:
 *   get:
 *     summary: List API logs (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by userId
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *         description: Filter logs by route
 *     responses:
 *       200:
 *         description: List of API logs
 */
router.get('/logs', authenticateUser, requireAdmin, async (req, res) => {
  const { userId, route } = req.query;
  const filter = {};
  if (userId) filter.userId = userId;
  if (route) filter.route = route;
  const logs = await ApiLog.find(filter).sort({ timestamp: -1 }).limit(100);
  res.json({ logs });
});

module.exports = router;
