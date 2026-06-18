const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response');

/**
 * Get current authenticated user's profile
 * @route GET /api/users/me
 * @access Private (requires authentication)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user.toObject();

    delete user.password;
    delete user.refreshTokenHash;
    delete user.resetPasswordToken;
    delete user.emailVerificationToken;

    return sendSuccess(res, user, 200, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCurrentUserKyc = async (req, res, next) => {
  try {
    const hasSubmittedKyc =
      Boolean(req.user.kycSubmissionDate) || req.user.kycStatus !== 'pending';

    if (!hasSubmittedKyc) {
      const error = new Error('No KYC submission found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const kyc = {
      status: req.user.kycStatus,
      submissionDate: req.user.kycSubmissionDate,
      reviewNotes: req.user.kycReviewNotes || null,
    };

    return sendSuccess(res, kyc, 200, 'KYC status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated user's profile
 * @route PATCH /api/users/me
 * @access Private (requires authentication)
 */
const updateCurrentUser = async (req, res, next) => {
  try {
    const { fullName, walletAddress } = req.body;

    // Build update object with only allowed fields
    const allowedUpdates = {};
    if (fullName !== undefined) allowedUpdates.fullName = fullName;
    if (walletAddress !== undefined) allowedUpdates.walletAddress = walletAddress;

    // Update and return the new document
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenHash -resetPasswordToken -emailVerificationToken');

    return sendSuccess(res, updatedUser, 200, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  getCurrentUserKyc,
  updateCurrentUser,
};  