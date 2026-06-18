const express = require('express');
const authenticate = require('../middlewares/auth');
const {
  getCurrentUser,
  getCurrentUserKyc,
  updateCurrentUser,
} = require('../controllers/users.controller');
const { updateProfileSchema } = require('../validators/auth.validators');
const validate = require('../middlewares/validate');

const router = express.Router();

// GET /api/users/me - Get current authenticated user's profile
router.get('/me', authenticate, getCurrentUser);

// GET /api/users/me/kyc - Get current authenticated user's KYC status
router.get('/me/kyc', authenticate, getCurrentUserKyc);

// PATCH /api/users/me - Update current authenticated user's profile
router.patch('/me', authenticate, validate(updateProfileSchema), updateCurrentUser);

module.exports = router;