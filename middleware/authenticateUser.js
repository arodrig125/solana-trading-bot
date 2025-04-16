const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate user using JWT or API key (x-api-key header)
 * Sets req.user if authenticated, else returns 401
 */
async function authenticateUser(req, res, next) {
  // 1. Check for JWT in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const userPayload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(userPayload.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      return next();
    } catch (err) {
      // Continue to API key check if JWT fails
    }
  }

  // 2. Check for API key in x-api-key header
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    // Find user by API key
    const user = await User.findOne({ 'apiKeys.key': apiKey });
    if (user) {
      // Find the specific key object
      const keyObj = user.apiKeys.find(k => k.key === apiKey);
      if (keyObj) {
        keyObj.lastUsed = new Date();
        await user.save();
        req.user = user;
        return next();
      }
    }
  }

  // 3. If neither, unauthorized
  return res.status(401).json({ error: 'Unauthorized: valid JWT or API key required' });
}

module.exports = authenticateUser;
