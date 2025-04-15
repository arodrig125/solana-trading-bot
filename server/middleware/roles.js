// Role-based access control middleware
// Usage: roles(['admin', 'user'])

module.exports = function roles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient privileges' });
    }
    next();
  };
};
