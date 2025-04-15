const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const RATE_LIMITS = {
  free: { windowMs: 60 * 1000, max: 30 },      // 30 requests/minute
  premium: { windowMs: 60 * 1000, max: 120 }, // 120 requests/minute
  admin: { windowMs: 60 * 1000, max: 500 },   // 500 requests/minute
  default: { windowMs: 60 * 1000, max: 60 }   // fallback
};

function getTierFromJWT(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.tier || decoded.role || 'default';
  } catch {
    return null;
  }
}

const apiLimiter = rateLimit({
  windowMs: RATE_LIMITS.default.windowMs,
  max: (req, res) => {
    const tier = getTierFromJWT(req);
    if (tier && RATE_LIMITS[tier]) return RATE_LIMITS[tier].max;
    return RATE_LIMITS.default.max;
  },
  handler: (req, res, next) => {
    const tier = getTierFromJWT(req) || 'ip';
    logger.warn(`Rate limit exceeded for tier: ${tier}, ip: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
  keyGenerator: (req, res) => {
    const tier = getTierFromJWT(req);
    if (tier && req.user && req.user.id) return `${tier}:${req.user.id}`;
    return req.ip;
  }
});

module.exports = { apiLimiter };
