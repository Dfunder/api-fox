const crypto = require('crypto');
const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    // Check for existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      error.isOperational = true;
      return next(error);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    // Return user info (exclude password)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      verificationToken,
      createdAt: user.createdAt,
    };

    return sendSuccess(
      res,
      { user: userResponse },
      201,
      'User registered successfully. Please verify your email.'
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
};
