const express = require('express');
const { register } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema } = require('../validators/auth.validators');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', validate(registerSchema), register);

module.exports = router;
