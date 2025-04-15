/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user data to request
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token (checks signature and expiration)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check for required claims
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Find user in database
    const user = await mongoose.connection.db.collection('users')
      .findOne({ _id: mongoose.Types.ObjectId(decoded.userId) });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Optional: Check for token revocation (e.g., user.disabled, or token blacklist)
    if (user.disabled) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Attach user to request, including role
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role || decoded.role,
      subscription: user.subscription || 'free',
      defaultWalletId: user.defaultWalletId
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  authMiddleware
};
