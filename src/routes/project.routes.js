const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const { optionalAuthenticate } = require('../middlewares/auth');
const { handleUpload } = require('../middlewares/upload.middleware');
const { getProjectById, uploadDocuments } = require('../controllers/project.controller');

/**
 * GET /api/projects/:id
 * Retrieve a single project by id
 */
router.get('/:id', optionalAuthenticate, getProjectById);

/**
 * POST /api/projects/:id/documents
 * Upload supporting documents to a project (owner only)
 */
router.post('/:id/documents', authenticate, handleUpload, uploadDocuments);

module.exports = router;