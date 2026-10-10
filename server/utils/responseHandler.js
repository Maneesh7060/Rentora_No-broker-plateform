/**
 * Send a standardized success JSON response.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload (optional)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error JSON response.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {string} message - Human-readable error message
 * @param {*} error - Error details (optional, omitted in production)
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
  const response = { success: false, message };
  if (error !== null && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
