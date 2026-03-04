const express = require('express');
const { register, login, verifyEmail } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login - Login an existing user
router.post('/login', validate(loginSchema), login);

// GET /api/auth/verify-email/:token - Verify user email
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
