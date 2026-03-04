const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is an access token
    if (decoded.type !== 'access') {
      const error = new Error('Invalid token type');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    // Find the user
    const user = await User.findById(decoded.sub);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.message = 'Invalid token';
      error.statusCode = 401;
      error.isOperational = true;
    } else if (error.name === 'TokenExpiredError') {
      error.message = 'Token expired';
      error.statusCode = 401;
      error.isOperational = true;
    }
    next(error);
  }
};

module.exports = authenticate;
