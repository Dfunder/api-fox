const express = require('express');
const authenticate = require('../middlewares/auth');
const { getCurrentUser } = require('../controllers/users.controller');

const router = express.Router();

// GET /api/users/me - Get current authenticated user's profile
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
