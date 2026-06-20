const express = require('express');
const authenticate = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const {
  deleteUser,
  getUserById,
  restoreUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
} = require('../controllers/admin.users.controller');
const { reviewKyc } = require('../controllers/admin.kyc.controller');
const { reviewKycSchema } = require('../validators/admin.validators');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// GET /api/admin/users - List all users (optionally include deleted)
router.get('/users', listUsers);

// GET /api/admin/users/:id - Get a specific user profile
router.get('/users/:id', getUserById);

// PATCH /api/admin/users/:id/role - Update a user's role
router.patch('/users/:id/role', updateUserRole);

// DELETE /api/admin/users/:id - Soft delete a user
router.delete('/users/:id', deleteUser);

// POST /api/admin/users/:id/restore - Restore a soft-deleted user
router.post('/users/:id/restore', restoreUser);

// PATCH /api/admin/kyc/:id - Review a user's KYC submission
router.patch('/kyc/:id', validate(reviewKycSchema), reviewKyc);
// PATCH /api/admin/users/:id/status - Suspend or activate a user
router.patch('/users/:id/status', updateUserStatus);


module.exports = router;