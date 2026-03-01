/**
 * Global error handling middleware
 * Handles various types of errors and returns consistent error responses
 */

const errorHandler = (err, req, res, _next) => {
  // Log the error for debugging purposes
  console.error(err);

  // Set default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = [];

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';

    // Extract field-specific errors
    Object.keys(err.errors).forEach(key => {
      errors.push({
        field: key,
        message: err.errors[key].message
      });
    });
  }
  // Handle Mongoose Cast Error (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid input format';
    errors.push({
      field: err.path || 'unknown',
      message: `Invalid value '${err.value}' for field '${err.path}'`
    });
  }
  // Handle MongoDB duplicate key error (11000)
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    
    // Extract the field name from the error message
    const field = Object.keys(err.keyValue)[0];
    errors.push({
      field: field,
      message: `${field} already exists`
    });
  }
  // Handle JSON Web Token errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } 
  // Handle JWT token expiration
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle custom application errors
  else if (err.isOperational) {
    statusCode = err.statusCode || 400;
    message = err.message;
  }

  // Send error response in consistent format
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }), // Only include errors array if there are errors
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development
  });
};

module.exports = errorHandler;
