const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `kyc-${req.userId || 'anonymous'}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      'Invalid file type. Only PDF, JPG, and PNG are allowed.'
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
  },
});

// Wrap multer to convert its errors into operational errors your errorHandler understands
const handleKycUpload = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'The file must be 5MB or smaller.';
      err.statusCode = 400;
      err.isOperational = true;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      err.message = 'Unexpected field name. Use "document" as the field name.';
      err.statusCode = 400;
      err.isOperational = true;
    } else if (!err.statusCode) {
      err.statusCode = 400;
      err.isOperational = true;
    }

    return next(err);
  });
};

module.exports = { handleKycUpload };
