const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const { handleUpload } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate');
const { createProjectSchema } = require('../validators/project.validators');
const { createProject, uploadDocuments } = require('../controllers/project.controller');

/**
 * POST /api/projects
 * Create a project (KYC-approved users only)
 */
router.post('/', authenticate, validate(createProjectSchema), createProject);

/**
 * POST /api/projects/:id/documents
 * Upload supporting documents to a project (owner only)
 */
router.post('/:id/documents', authenticate, handleUpload, uploadDocuments);

module.exports = router;
