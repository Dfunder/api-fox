const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response');

/**
 * Get current authenticated user's profile
 * @route GET /api/users/me
 * @access Private (requires authentication)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // The authenticate middleware already attaches the user to req.user
    // We need to exclude sensitive fields before sending the response
    const user = req.user.toObject();

    // Remove sensitive fields
    delete user.password;
    delete user.refreshTokenHash;
    delete user.resetPasswordToken;
    delete user.emailVerificationToken;

    return sendSuccess(res, user, 200, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
};
