const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get a specific user profile (admin only)
 * @route GET /api/admin/users/:id
 * @access Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
      kycSubmissionDate: user.kycSubmissionDate,
      kycReviewNotes: user.kycReviewNotes,
      walletAddress: user.walletAddress,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }, 200, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's role (admin only)
 * @route PATCH /api/admin/users/:id/role
 * @access Admin only
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Role must be either user or admin', 400);
    }

    if (id === req.userId) {
      return sendError(res, 'You cannot change your own role', 403);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      id: updatedUser._id.toString(),
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      kycStatus: updatedUser.kycStatus,
      kycSubmissionDate: updatedUser.kycSubmissionDate,
      kycReviewNotes: updatedUser.kycReviewNotes,
      walletAddress: updatedUser.walletAddress,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      deletedAt: updatedUser.deletedAt,
    }, 200, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a user by ID (admin only)
 * @route DELETE /api/admin/users/:id
 * @access Admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (id === req.userId) {
      return sendError(res, 'You cannot delete your own account', 403);
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if already deleted
    if (user.deletedAt) {
      return sendError(res, 'User already deleted', 400);
    }

    // Soft delete the user
    await user.softDelete();

    return sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      deletedAt: user.deletedAt,
    }, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a soft-deleted user (admin only)
 * @route POST /api/admin/users/:id/restore
 * @access Admin only
 */
const restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!user) {
      return sendError(res, 'User not found or not deleted', 404);
    }

    await user.restore();

    return sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    }, 200, 'User restored successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * List all users (including soft-deleted) (admin only)
 * @route GET /api/admin/users
 * @access Admin only
 */
const listUsers = async (req, res, next) => {
  try {
    const { includeDeleted } = req.query;
    const query = includeDeleted === 'true' ? {} : { deletedAt: null };

    const users = await User.find(query)
      .select('-password -refreshTokenHash -resetPasswordToken -emailVerificationToken')
      .sort({ createdAt: -1 });

    return sendSuccess(res, users, 200, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUser,
  getUserById,
  restoreUser,
  listUsers,
  updateUserRole,
};
