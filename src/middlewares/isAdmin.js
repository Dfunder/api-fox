const { sendError } = require('../utils/response');

/**
 * Middleware to check if the authenticated user is an admin
 * This should be used after the authenticate middleware
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  next();
};

module.exports = isAdmin;
