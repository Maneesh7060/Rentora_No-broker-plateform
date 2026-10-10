const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} plainPassword - The password to hash
 * @returns {Promise<string>} The hashed password string
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param {string} plainPassword - The password to check
 * @param {string} hashedPassword - The stored hash to compare against
 * @returns {Promise<boolean>} True if they match, false otherwise
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
