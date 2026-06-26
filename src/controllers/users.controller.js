const User = require('../models/User.model');
const KYC = require('../models/KYC.model');
const { sendSuccess } = require('../utils/response');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only jpeg and png
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

// Create multer upload instance with 2MB limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

/**
 * Get current authenticated user's profile
 * @route GET /api/users/me
 * @access Private (requires authentication)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user.toObject();

    delete user.password;
    delete user.refreshTokenHash;
    delete user.resetPasswordToken;
    delete user.emailVerificationToken;

    return sendSuccess(res, user, 200, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCurrentUserKyc = async (req, res, next) => {
  try {
    const hasSubmittedKyc =
      Boolean(req.user.kycSubmissionDate) || req.user.kycStatus !== 'pending';

    if (!hasSubmittedKyc) {
      const error = new Error('No KYC submission found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    const kyc = {
      status: req.user.kycStatus,
      submissionDate: req.user.kycSubmissionDate,
      reviewNotes: req.user.kycReviewNotes || null,
    };

    return sendSuccess(res, kyc, 200, 'KYC status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated user's profile
 * @route PATCH /api/users/me
 * @access Private (requires authentication)
 */
const updateCurrentUser = async (req, res, next) => {
  try {
    const { fullName, walletAddress } = req.body;

    // Build update object with only allowed fields
    const allowedUpdates = {};
    if (fullName !== undefined) allowedUpdates.fullName = fullName;
    if (walletAddress !== undefined) allowedUpdates.walletAddress = walletAddress;

    // Update and return the new document
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenHash -resetPasswordToken -emailVerificationToken');

    return sendSuccess(res, updatedUser, 200, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture/avatar for current authenticated user
 * @route POST /api/users/me/avatar
 * @access Private (requires authentication)
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Delete old avatar if it exists
    if (req.user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../', req.user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Store relative path in database
    const avatarPath = `uploads/avatars/${req.file.filename}`;

    // Update user with new avatar path
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { avatar: avatarPath } },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenHash -resetPasswordToken -emailVerificationToken');

    return sendSuccess(res, updatedUser, 200, 'Profile picture uploaded successfully');
  } catch (error) {
    // If there's a multer error (file size, invalid type), set appropriate status
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 400;
        error.message = 'File too large. Maximum size is 2MB.';
      } else {
        error.statusCode = 400;
      }
      error.isOperational = true;
    }
    next(error);
  }
};

/**
 * Submit KYC documents
 * @route POST /api/users/me/kyc
 * @access Private (requires authentication)
 */
const submitKyc = async (req, res, next) => {
  try {
    // 1. Check if user already has a pending or approved KYC submission
    if (req.user.kycStatus === 'pending' || req.user.kycStatus === 'approved') {
      const error = new Error('KYC submission already exists or is already approved');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // 2. Ensure a file was uploaded
    if (!req.file) {
      const error = new Error('KYC document file is required');
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    const { documentType } = req.body;

    // 3. Create document URL/relative path
    const documentUrl = `uploads/kyc/${req.file.filename}`;

    // 4. Create the KYC record
    const kyc = await KYC.create({
      userId: req.userId,
      documentType,
      documentUrl,
      status: 'pending',
      submittedAt: new Date(),
    });

    // 5. Update the User's KYC status fields
    req.user.kycStatus = 'pending';
    req.user.kycSubmissionDate = kyc.submittedAt;
    req.user.kycReviewNotes = null;
    await req.user.save();

    // 6. Return response
    return sendSuccess(res, kyc, 201, 'KYC document submitted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  getCurrentUserKyc,
  updateCurrentUser,
  uploadAvatar,
  submitKyc,
  upload // Export multer upload middleware
};