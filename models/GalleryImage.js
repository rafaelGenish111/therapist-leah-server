const mongoose = require('mongoose');

const GalleryImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'clinic', 'treatments', 'equipment']
  },
  size: {
    type: Number
  },
  mimeType: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isVisible: {
    type: Boolean,
    default: true
  }
});

// Index for sorting
GalleryImageSchema.index({ uploadedAt: -1 });
GalleryImageSchema.index({ category: 1, uploadedAt: -1 });

module.exports = mongoose.model('GalleryImage', GalleryImageSchema);