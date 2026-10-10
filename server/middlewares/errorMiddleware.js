/**
 * Centralized Express error handling middleware.
 * Must be registered as the LAST middleware in server.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.detail }),
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.detail }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // Default 500 error
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.stack }),
  });
};

module.exports = { errorHandler };
