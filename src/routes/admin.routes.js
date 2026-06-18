const express = require('express');
const authenticate = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const {
  deleteUser,
  restoreUser,
  listUsers,
} = require('../controllers/admin.users.controller');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// GET /api/admin/users - List all users (optionally include deleted)
router.get('/users', listUsers);

// DELETE /api/admin/users/:id - Soft delete a user
router.delete('/users/:id', deleteUser);

// POST /api/admin/users/:id/restore - Restore a soft-deleted user
router.post('/users/:id/restore', restoreUser);

module.exports = router;
