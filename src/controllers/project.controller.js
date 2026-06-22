const Project = require('../models/Project.model');
const { sendSuccess } = require('../utils/response');

/**
 * Create a new project/campaign
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    if (req.user.kycStatus !== 'approved') {
      const error = new Error('KYC approval is required to create a project');
      error.statusCode = 403;
      
 * GET /api/projects/:id
 * Retrieve campaign details for a single project.
 */
const getProjectDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).populate('owner', 'fullName');
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
    const isActive = project.status !== 'inactive';
    const isOwner = req.userId && project.owner && project.owner._id?.toString() === req.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isActive && !isOwner && !isAdmin) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
  
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      owner: req.userId,
      status: 'pending',
    });

    return sendSuccess(res, project, 201, 'Project created successfully');

    const responseProject = project.toObject();
    if (responseProject.owner && responseProject.owner.fullName) {
      responseProject.owner = { fullName: responseProject.owner.fullName };
    }

    return sendSuccess(res, { project: responseProject }, 200, 'Project retrieved successfully');
    const projectData = project.toObject({ getters: true });
    projectData.owner = project.owner ? { fullName: project.owner.fullName } : null;

    return sendSuccess(res, projectData, 200, 'Project details retrieved successfully');                                                                                     
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

module.exports = { createProject, uploadDocuments };
module.exports = { getProjectById, uploadDocuments };
module.exports = { getProjectDetails, uploadDocuments };
