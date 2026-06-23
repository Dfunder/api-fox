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
    category: { type: String, trim: true, default: null },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:    { type: Boolean, default: true },
    documents:   { type: [documentSchema], default: [] },
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
    // ... add your other project fields here
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1 });

module.exports = mongoose.model('Project', projectSchema);
