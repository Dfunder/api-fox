const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    kycSubmissionDate: {
      type: Date,
      default: null,
    },
    kycReviewNotes: {
      type: String,
      trim: true,
      default: null,
    },
    walletAddress: {
      type: String,
      trim: true,
      default: null,
    },
    // Soft delete field
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to exclude soft-deleted users from all queries
userSchema.pre('find', function () {
  this.where({ deletedAt: null });
});

userSchema.pre('findOne', function () {
  this.where({ deletedAt: null });
});

userSchema.pre('findOneAndUpdate', function () {
  this.where({ deletedAt: null });
});

userSchema.pre('countDocuments', function () {
  this.where({ deletedAt: null });
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Soft delete method
userSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return this.save();
};

// Restore soft-deleted user
userSchema.methods.restore = async function () {
  this.deletedAt = null;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
