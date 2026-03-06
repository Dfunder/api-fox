const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response');
const { sendEmail } = require('../services/email.service');
const passwordResetTemplate = require('../services/templates/passwordReset.template');
const emailVerificationTemplate = require('../services/templates/emailVerification.template');

/**
 * Logout user by invalidating refresh token
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Find the user and clear their refresh token
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    // Clear the stored refresh token
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();

    return sendSuccess(res, {}, 200, 'Logout successful');
  } catch (error) {
    return next(error);
  }
};

/**
 * Register a new user and send a verification email
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

    // Generate a secure random email verification token (32 bytes = 64 hex chars)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user with verification token fields
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await user.save();

    // Send verification email (non-blocking — registration still succeeds if email fails)
    try {
      const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email/${emailVerificationToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: emailVerificationTemplate(user.fullName, verificationLink),
      });
    } catch (emailError) {
      // Log but don't fail the registration — the token is stored and can be resent
      console.error('Failed to send verification email:', emailError.message);
    }

    // Return user info (exclude password and internal token fields)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
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
 * Verify email address using token from verification email
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with a matching, non-expired verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      const error = new Error('Invalid or expired verification token');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Mark email as verified and clear the token fields
    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return sendSuccess(
      res,
      {},
      200,
      'Email verified successfully. You can now log in.'
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

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +refreshTokenHash'
    );

    // Reject if user does not exist or has not verified their email
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
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        type: 'access',
      },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString(), type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiresIn }
    );

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
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

/**
 * Request a password reset email
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMessage =
      'If an account with that email exists, a password reset link has been sent.';

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return sendSuccess(res, {}, 200, genericMessage);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = passwordResetTemplate(user.fullName, resetLink, '1 hour');

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html,
      });
    } catch {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      const error = new Error(
        'Failed to send password reset email. Please try again later.'
      );
      error.statusCode = 500;
      error.isOperational = true;
      return next(error);
    }

    return sendSuccess(res, {}, 200, genericMessage);
  } catch (error) {
    return next(error);
  }
};

/**
 * Refresh access token using a valid refresh token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify the refresh token
    const decodedRefreshToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decodedRefreshToken.type !== 'refresh') {
      const error = new Error('Invalid token type');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    // Find the user and include the refresh token hash
    const user = await User.findById(decodedRefreshToken.sub).select(
      '+refreshTokenHash +refreshTokenExpiresAt'
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    // Check if refresh token has expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      const error = new Error('Refresh token has expired');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    // Hash the provided refresh token and compare with stored hash
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    if (user.refreshTokenHash !== refreshTokenHash) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    // Generate new access token
    const accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const newAccessToken = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        type: 'access',
      },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiresIn }
    );

    // Optionally rotate the refresh token
    const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const newRefreshToken = jwt.sign(
      { sub: user._id.toString(), type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiresIn }
    );

    // Hash the new refresh token and update user record
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    const newDecodedRefreshToken = jwt.decode(newRefreshToken);

    user.refreshTokenHash = newRefreshTokenHash;
    user.refreshTokenExpiresAt = newDecodedRefreshToken?.exp
      ? new Date(newDecodedRefreshToken.exp * 1000)
      : null;

    await user.save();

    return sendSuccess(
      res,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      200,
      'Token refreshed successfully'
    );
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      const tokenError = new Error('Invalid or expired refresh token');
      tokenError.statusCode = 403;
      tokenError.isOperational = true;
      return next(tokenError);
    }
    return next(error);
  }
};
/**
 * Change authenticated user's password
 * PATCH /api/auth/change-password
 *
 * Add this function to src/controllers/auth.controller.js
 * and include it in the module.exports object at the bottom.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // req.userId is set by the authenticate middleware (same as logout)
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    // Verify the supplied current password against the stored hash
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      error.isOperational = true;
      return next(error);
    }

    // Prevent reuse of the same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const error = new Error(
        'New password must be different from the current password'
      );
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Assign plain-text password — the User model's pre-save hook hashes it
    user.password = newPassword;

    // Invalidate all existing refresh tokens (force re-login on other devices)
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    await user.save();

    return sendSuccess(
      res,
      {},
      200,
      'Password changed successfully. Please log in again.'
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  resetPassword,
  forgotPassword,
  verifyEmail,
  refreshToken,
  changePassword,
};
