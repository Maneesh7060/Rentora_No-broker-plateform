const { sendError } = require('../utils/responseHandler');

/**
 * requireRole middleware factory
 * Creates a middleware that only allows users with one of the specified roles.
 *
 * Usage:
 *   router.get('/admin-only', protectRoute, requireRole('admin'), handler)
 *   router.get('/owner-or-agent', protectRoute, requireRole('owner', 'agent'), handler)
 *
 * @param {...string} roles - Allowed role strings
 * @returns {Function} Express middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`
      );
    }

    next();
  };
};

module.exports = { requireRole };
