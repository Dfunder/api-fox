const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

const KYC = mongoose.model('KYC', kycSchema);

module.exports = KYC;
