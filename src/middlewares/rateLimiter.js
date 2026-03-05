const rateLimit = require('express-rate-limit');

// shared window for both global and auth limiters (milliseconds)
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;

function createLimiter({ max }) {
  return rateLimit({
    windowMs: WINDOW_MS,
    max,
    standardHeaders: true, // Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    handler: (req, res) => {
      // express-rate-limit will automatically set Retry-After header if
      // standardHeaders is enabled, but we send it explicitly for clarity.
      const retryAfter = Math.ceil(WINDOW_MS / 1000);
      res.set('Retry-After', String(retryAfter));

      // Using the shared response format so tests and clients are consistent
      res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        data: {},
      });
    },
  });
}

const globalLimiter = createLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
});

const authLimiter = createLimiter({
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
});

module.exports = { globalLimiter, authLimiter };
