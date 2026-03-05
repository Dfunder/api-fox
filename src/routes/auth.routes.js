const express = require('express');
const {
  register,
  login,
  logout,
  resetPassword,
  forgotPassword,
  verifyEmail,
} = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} = require('../validators/auth.validators');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login - Login an existing user
router.post('/login', validate(loginSchema), login);

// POST /api/auth/logout - Logout user (requires authentication)
router.post('/logout', authenticate, logout);

// POST /api/auth/forgot-password - Request a password reset email
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// PATCH /api/auth/reset-password/:token - Reset user password with token
router.patch('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// GET /api/auth/verify-email/:token - Verify email address using token from verification email
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
