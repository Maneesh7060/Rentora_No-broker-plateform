const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../models/userModel');
const { sendError } = require('../utils/responseHandler');

/**
 * protectRoute middleware
 * Verifies the JWT from the Authorization header.
 * On success, attaches decoded user payload to req.user.
 * On failure, sends 401 Unauthorized.
 */
const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await findUserById(decoded.id);
    if (!user) {
      return sendError(res, 401, 'The account associated with this token no longer exists.');
    }

    if (user.account_status === 'SUSPENDED') {
      return sendError(
        res,
        403,
        'Your account has been suspended by the administrator. Please contact support.'
      );
    }

    req.user = user; // Attach safe user object (no password_hash)
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Please log in again.');
    }
    console.error('protectRoute error:', err);
    return sendError(res, 500, 'Authentication failed.', err.message);
  }
};

/**
 * optionalAuth middleware
 * If a Bearer token is provided, decodes and attaches user to req.user.
 * If not provided or invalid, continues without error.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore invalid token for optional auth
  }
  next();
};

module.exports = { protectRoute, optionalAuth };

