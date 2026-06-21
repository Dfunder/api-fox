const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate'); // your existing auth middleware
const { handleUpload } = require('../middlewares/upload.middleware');
const { uploadDocuments } = require('../controllers/project.controller');

/**
 * POST /api/projects/:id/documents
 * Upload supporting documents to a project (owner only)
 */
router.post('/:id/documents', authenticate, handleUpload, uploadDocuments);

module.exports = router;