const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    goalAmount: { type: Number, required: true, min: 0 },
    raisedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'XLM', trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stellarAddress: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'rejected', 'completed'],
      default: 'draft',
    },
    coverImage: { type: String, trim: true },
    documents: { type: [documentSchema], default: [] },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });

module.exports = mongoose.model('Project', projectSchema);
