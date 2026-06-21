const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      'Invalid file type. Only PDF, DOCX, JPG, and PNG are allowed.'
    );
    error.statusCode = 400;
    error.isOperational = true;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Wrap multer to convert its errors into operational errors your errorHandler understands
const handleUpload = (req, res, next) => {
  upload.array('documents', MAX_FILES)(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'Each file must be 10MB or smaller.';
      err.statusCode = 400;
      err.isOperational = true;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      err.message = `You may upload at most ${MAX_FILES} files at a time.`;
      err.statusCode = 400;
      err.isOperational = true;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      err.message = 'Unexpected field name. Use "documents" as the field name.';
      err.statusCode = 400;
      err.isOperational = true;
    }

    return next(err);
  });
};

module.exports = { handleUpload };