const ApiLog = require('../models/ApiLog');

/**
 * Logs API requests for auditing and analytics.
 * Should be used after authentication middleware.
 */
async function apiLogger(req, res, next) {
  const start = Date.now();
  // Listen for response finish to get status code
  res.on('finish', async () => {
    try {
      const authType = req.headers['x-api-key'] ? 'apikey' : (req.headers['authorization'] ? 'jwt' : 'none');
      const apiKey = req.headers['x-api-key'] || undefined;
      await ApiLog.create({
        userId: req.user ? req.user._id : undefined,
        apiKey,
        route: req.originalUrl,
        method: req.method,
        status: res.statusCode,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        authType,
        reqBody: req.method !== 'GET' ? req.body : undefined
      });
    } catch (err) {
      // Logging should never break the API
      console.error('API log error:', err);
    }
  });
  next();
}

module.exports = apiLogger;
