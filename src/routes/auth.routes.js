const express = require('express');
const { register, login, resetPassword } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, resetPasswordSchema } = require('../validators/auth.validators');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login - Login an existing user
router.post('/login', validate(loginSchema), login);

// PATCH /api/auth/reset-password/:token - Reset user password with token
router.patch('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

module.exports = router;
