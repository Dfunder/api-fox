const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    if (!authHeader.startsWith('Bearer ')) {
      const error = new Error('Invalid token format');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const token = authHeader.substring(7);
    if (!token) {
      const error = new Error('Token missing');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      const error = new Error('Invalid token type');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

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

module.exports = authenticateOptional;
