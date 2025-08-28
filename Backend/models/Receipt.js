const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  headingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heading',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: String, // For Cloudinary
  ocrRawText: String,
  ocrParsedLines: [{
    text: String,
    price: Number,
    confidence: Number
  }],
  status: {
    type: String,
    enum: ['UPLOADING', 'PROCESSING', 'NEEDS_REVIEW', 'COMPLETED', 'FAILED'],
    default: 'UPLOADING'
  },
  errorMessage: String,
  // AI mapping results
  aiMappings: [{
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem'
    },
    matchedReceiptLine: String,
    extractedPrice: Number,
    confidenceScore: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Receipt', receiptSchema);
