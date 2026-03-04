const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

// GET /api/protected/profile - Protected route example
router.get('/profile', authMiddleware, (req, res) => {
  sendSuccess(res, { 
    user: req.user,
    message: 'Access granted to protected resource' 
  }, 200, 'Protected data retrieved successfully');
});

// GET /api/protected/dashboard - Another protected route example
router.get('/dashboard', authMiddleware, (req, res) => {
  sendSuccess(res, { 
    user: req.user,
    dashboardData: {
      stats: 'User dashboard statistics',
      lastLogin: new Date().toISOString()
    }
  }, 200, 'Dashboard data retrieved successfully');
});

module.exports = router;
