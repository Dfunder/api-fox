const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

/**
 * Login user and issue access + refresh tokens
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshTokenHash');
    if (!user || !user.isVerified) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    const accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString(), type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiresIn }
    );
  
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const decodedRefreshToken = jwt.decode(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = decodedRefreshToken?.exp
      ? new Date(decodedRefreshToken.exp * 1000)
      : null;
    await user.save();

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
      },
      200,
      'Login successful'
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Reset user password using token from reset email
 * PATCH /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching reset token and include reset fields
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
    }).select('+resetPasswordToken +resetPasswordExpires');

    // Check if user exists
    if (!user) {
      const error = new Error('Invalid reset token');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Check if token has expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      const error = new Error('Reset token has expired');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Invalidate the reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Invalidate all existing refresh tokens
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    await user.save();

    return sendSuccess(
      res,
      {},
      200,
      'Password reset successfully. Please login with your new password.'
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  resetPassword,
};
