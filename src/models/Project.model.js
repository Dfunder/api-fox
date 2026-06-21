const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename:     { type: String, required: true }, // stored name on disk
    mimetype:     { type: String, required: true },
    size:         { type: Number, required: true }, // bytes
    url:          { type: String, required: true }, // public URL path
    uploadedAt:   { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:    { type: Boolean, default: true },
    documents:   { type: [documentSchema], default: [] },
    // ... add your other project fields here
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);