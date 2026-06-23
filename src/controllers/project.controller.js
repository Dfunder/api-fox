const Project = require('../models/Project.model');
const { sendSuccess } = require('../utils/response');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Create a new project/campaign
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    if (req.user?.kycStatus !== 'approved') {
      const error = new Error('KYC approval is required to create a project');
      error.statusCode = 403;
      return next(error);
    }

    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      owner: req.userId,
      status: 'pending',
    });

    return sendSuccess(res, project, 201, 'Project created successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/projects/:id
 * Retrieve campaign details for a single project.
 */
const getProjectDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).populate('owner', 'fullName').exec();
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const ownerId = project.owner && project.owner._id ? project.owner._id.toString() : project.owner?.toString();
    const isOwner = req.userId && ownerId === req.userId;
    const isAdmin = req.user?.role === 'admin';
    const isPublic = project.status !== 'inactive' && project.isActive !== false;

    if (!isPublic && !isOwner && !isAdmin) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const projectData = project.toObject();
    projectData.owner = project.owner ? { fullName: project.owner.fullName } : null;

    return sendSuccess(res, { project: projectData }, 200, 'Project retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/projects
 * List public active projects
 */
const listProjects = async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10);
    const { category, search } = req.query;

    const query = {
      status: 'active',
      isActive: true,
    };

    if (category && category.trim()) {
      query.category = category.trim();
    }

    if (search && search.trim()) {
      const searchRegex = escapeRegExp(search.trim());
      query.$or = [
        { title: { $regex: searchRegex, $options: 'i' } },
        { description: { $regex: searchRegex, $options: 'i' } },
      ];
    }

    const projectsQuery = Project.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [projects, total] = await Promise.all([
      projectsQuery.exec(),
      Project.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        data: projects,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      200,
      'Projects retrieved successfully'
    );
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
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/documents/${file.filename}`,
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

module.exports = {
  createProject,
  getProjectDetails,
  listProjects,
  uploadDocuments,
};
