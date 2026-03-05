/**
 * Middleware to restrict access by user role
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (req.user must be populated by auth middleware)
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    // Check if user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Access forbidden: insufficient permissions');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    // User is authorized
    next();
  };
};

module.exports = authorize;
