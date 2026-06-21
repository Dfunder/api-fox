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
const authenticateOptional = require('../middlewares/auth.optional');
const { handleUpload } = require('../middlewares/upload.middleware');
const { uploadDocuments, getProjectDetails } = require('../controllers/project.controller');

/**
 * GET /api/projects/:id
 * Retrieve campaign details for a single project.
 */
router.get('/:id', authenticateOptional, getProjectDetails);

/**
 * POST /api/projects/:id/documents
 * Upload supporting documents to a project (owner only)
 */
router.post('/:id/documents', authenticate, handleUpload, uploadDocuments);

module.exports = router;