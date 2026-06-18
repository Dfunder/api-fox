const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/response');

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
      return sendError(res, 403, 'You cannot delete your own account');
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Check if already deleted
    if (user.deletedAt) {
      return sendError(res, 400, 'User already deleted');
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
      return sendError(res, 404, 'User not found or not deleted');
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

/**
 * Update a user role (admin only)
 * @route PATCH /api/admin/users/:id/role
 * @access Admin only
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return sendError(res, 'Role must be either user or admin', 400);
    }

    if (req.userId === id && role === 'user') {
      return sendError(res, 'You cannot downgrade your own role', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.role = role;
    await user.save();

    return sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      200,
      'User role updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUser,
  restoreUser,
  listUsers,
  updateUserRole,
};
