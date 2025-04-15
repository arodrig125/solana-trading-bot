const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAdminToken } = require('../middleware/auth');

// Apply admin verification to all routes
router.use(verifyAdminToken);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Not authorized
 */
// Get all users (admin only)
router.get('/', async (req, res) => {
    try {
        if (!req.user.hasPermission('manage_users')) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or username exists
 *       403:
 *         description: Not authorized
 */
// Create new user (admin only)
router.post('/', async (req, res) => {
    try {
        if (!req.user.hasPermission('manage_users')) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { username, password, role } = req.body;
        
        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if username exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create user
        const user = new User({
            username,
            password,
            role,
            createdBy: req.user._id
        });
        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
// Update user (admin only)
router.put('/:userId', async (req, res) => {
    try {
        if (!req.user.hasPermission('manage_users')) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { userId } = req.params;
        const { username, password, role, active } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields if provided
        if (username) user.username = username;
        if (password) user.password = password;
        if (role) user.role = role;
        if (typeof active === 'boolean') user.active = active;

        user.updatedAt = Date.now();
        await user.save();

        res.json({
            message: 'User updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
                active: user.active,
                permissions: user.permissions
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
// Delete user (admin only)
router.delete('/:userId', async (req, res) => {
    try {
        if (!req.user.hasPermission('manage_users')) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin user' });
            }
        }

        await user.remove();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       403:
 *         description: Not authorized
 */
// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users/profile/password:
 *   put:
 *     summary: Update current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Current password incorrect
 *       403:
 *         description: Not authorized
 */
// Update current user's password
router.put('/profile/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Verify current password
        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        user.updatedAt = Date.now();
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
