const express = require('express');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

/**
 * Admin Routes
 * All routes in this router require authentication and 'admin' role
 */

// Global middleware for this router
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/dashboard - Admin dashboard data
router.get('/dashboard', (req, res) => {
    sendSuccess(res, {
        admin: {
            id: req.user._id,
            fullName: req.user.fullName,
            role: req.user.role
        },
        stats: {
            totalUsers: 0,
            activeCampaigns: 0,
            pendingVerifications: 0
        }
    }, 200, 'Admin dashboard statistics retrieved');
});

// GET /api/admin/users - List all users
router.get('/users', (req, res) => {
    sendSuccess(res, {
        users: [],
        message: 'User management system placeholder'
    }, 200, 'Users retrieved successfully');
});

module.exports = router;
