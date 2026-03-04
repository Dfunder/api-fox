const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // User's full name with validation
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Unique email address, normalized to lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Hashed password with minimum length requirement
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    // User role for access control
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Email verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Email verification token
    verificationToken: {
      type: String,
      default: null,
    },
    // Token expiration date
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    // Hashed refresh token for session management
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    // Refresh token expiration date
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
    // Password reset token for password recovery
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    // Password reset token expiration date
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // KYC verification status for compliance
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Stellar wallet address for blockchain integration
    walletAddress: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    // Auto-generate createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  // Skip if password hasn't been modified
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

const User = mongoose.model('User', userSchema);

module.exports = User;
