const Project = require('../models/Project.model');
const { sendSuccess } = require('../utils/response');

/**
 * Get a single project by id
 * GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('owner', 'fullName')
      .exec();

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const ownerId = project.owner && project.owner._id ? project.owner._id.toString() : project.owner?.toString();
    const isOwner = req.userId && ownerId === req.userId;
    const isAdmin = req.user?.role === 'admin';

    if (project.isActive === false && !isOwner && !isAdmin) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const responseProject = project.toObject();
    if (responseProject.owner && responseProject.owner.fullName) {
      responseProject.owner = { fullName: responseProject.owner.fullName };
    }

    return sendSuccess(res, { project: responseProject }, 200, 'Project retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * Upload supporting documents to a project
 * POST /api/projects/:id/documents
 */
const uploadDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    // Ownership check — req.userId is set by your authenticate middleware
    if (project.owner.toString() !== req.userId) {
      const error = new Error('Forbidden: you do not own this project');
      error.statusCode = 403;
      error.isOperational = true;
      return next(error);
    }

    if (!req.files || req.files.length === 0) {
      const error = new Error('No files were uploaded');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Enforce total document cap (existing + new ≤ 5)
    const MAX_TOTAL_DOCS = 5;
    if (project.documents.length + req.files.length > MAX_TOTAL_DOCS) {
      const slotsLeft = MAX_TOTAL_DOCS - project.documents.length;
      const error = new Error(
        `This project already has ${project.documents.length} document(s). ` +
        `You can only add ${slotsLeft} more (max ${MAX_TOTAL_DOCS} total).`
      );
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

    const newDocs = req.files.map((file) => ({
      originalName: file.originalname,
      filename:     file.filename,
      mimetype:     file.mimetype,
      size:         file.size,
      url:          `${baseUrl}/uploads/documents/${file.filename}`,
    }));

    project.documents.push(...newDocs);
    await project.save();

    return sendSuccess(
      res,
      { documents: project.documents },
      201,
      `${newDocs.length} document(s) uploaded successfully`
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProjectById, uploadDocuments };