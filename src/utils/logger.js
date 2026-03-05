/**
 * Logger utility for HTTP request logging
 * Provides a stream interface for Morgan middleware
 */

/**
 * Returns a stream interface for Morgan middleware
 * @returns {Object} Stream object with write method
 */
const getLoggerStream = () => {
  return {
    write: message => {
      if (message && typeof message === 'string') {
        console.log(message.trim());
      }
    },
  };
};

/**
 * Logs an informational message
 * @param {...any} args - Message and optional metadata
 */
const info = (...args) => {
  console.log(...args);
};

/**
 * Logs an error message
 * @param {...any} args - Message and optional metadata
 */
const error = (...args) => {
  console.error(...args);
};

module.exports = { getLoggerStream, info, error };
