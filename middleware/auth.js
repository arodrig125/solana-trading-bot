const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Verify admin role
const verifyAdminToken = async (req, res, next) => {
    await verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

// Check specific permission
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user.hasPermission(permission)) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    verifyAdminToken,
    checkPermission
};
