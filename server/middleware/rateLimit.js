/**
 * Enhanced Rate Limiting Middleware
 * Supports per-user and per-IP rate limits, endpoint-specific limits, and Retry-After header
 */

// Per-IP rate limiting for public endpoints
function ipRateLimit({ windowMs = 60000, max = 30, message = 'Too many requests from this IP' } = {}) {
  const ipCounts = {};
  setInterval(() => {
    for (const ip in ipCounts) {
      if (Date.now() - ipCounts[ip].timestamp > windowMs) {
        delete ipCounts[ip];
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!ip) return next();
    if (!ipCounts[ip]) {
      ipCounts[ip] = { count: 1, timestamp: Date.now() };
    } else {
      ipCounts[ip].count++;
    }
    if (ipCounts[ip].count > max) {
      res.set('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

// Per-user rate limiting for authenticated endpoints
function userRateLimit({ windowMs = 60000, maxRequests = { free: 30, pro: 120, admin: 300 }, message = 'Rate limit exceeded', endpointKey = req => req.originalUrl } = {}) {
  const userCounts = {};
  setInterval(() => {
    for (const key in userCounts) {
      if (Date.now() - userCounts[key].timestamp > windowMs) {
        delete userCounts[key];
      }
    }
  }, windowMs);

  return (req, res, next) => {
    try {
      if (!req.user) return next();
      const userId = req.user.id;
      const role = req.user.role || 'free';
      const key = `${userId}_${endpointKey(req)}`;
      if (!userCounts[key]) {
        userCounts[key] = { count: 1, timestamp: Date.now() };
      } else {
        userCounts[key].count++;
      }
      const limit = maxRequests[role] || maxRequests.free;
      if (userCounts[key].count > limit) {
        res.set('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({ success: false, message });
      }
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
}

module.exports = {
  userRateLimit,
  ipRateLimit
};
