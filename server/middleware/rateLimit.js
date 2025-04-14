/**
 * Rate Limiting Middleware
 * Implements subscription-based rate limiting
 */

const rateLimit = (options) => {
  const { windowMs, maxRequests, message } = options;
  
  // Store request counts per user
  const requestCounts = {};
  
  // Clear counters periodically
  setInterval(() => {
    for (const key in requestCounts) {
      if (Date.now() - requestCounts[key].timestamp > windowMs) {
        delete requestCounts[key];
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    try {
      // Skip rate limiting if no user attached (public routes)
      if (!req.user) {
        return next();
      }
      
      const userId = req.user.id;
      const subscription = req.user.subscription || 'free';
      const key = `${userId}_${req.originalUrl}`;
      
      // Initialize or update counter
      if (!requestCounts[key]) {
        requestCounts[key] = {
          count: 1,
          timestamp: Date.now()
        };
      } else {
        requestCounts[key].count++;
      }
      
      // Get limit based on subscription tier
      const limit = maxRequests[subscription] || maxRequests.free;
      
      // Check if limit exceeded
      if (requestCounts[key].count > limit) {
        return res.status(429).json({
          success: false,
          message: message || 'Rate limit exceeded'
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue in case of error
    }
  };
};

module.exports = {
  rateLimit
};
