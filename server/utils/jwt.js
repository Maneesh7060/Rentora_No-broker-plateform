const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user payload.
 * @param {Object} payload - Data to embed in the token (e.g. { id, email, role })
 * @returns {string} Signed JWT token string
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verifies a JWT token and returns its decoded payload.
 * Throws an error if the token is invalid or expired.
 * @param {string} token - The JWT string to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
