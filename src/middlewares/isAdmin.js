const { sendError } = require('../utils/response');

/**
 * Middleware to check if the authenticated user is an admin
 * This should be used after the authenticate middleware
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (req.user.role !== 'admin') {
    return sendError(res, 'Admin access required', 403);
  }

  next();
};

module.exports = isAdmin;
