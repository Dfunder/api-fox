const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login - Login an existing user
router.post('/login', validate(loginSchema), login);

// POST /api/auth/logout - Logout user (requires authentication)
router.post('/logout', authenticate, logout);

module.exports = router;
