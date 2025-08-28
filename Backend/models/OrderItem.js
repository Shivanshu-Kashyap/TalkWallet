const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  headingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heading',
    required: true,
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  options: [{
    type: String,
    trim: true
  }],
  rawTextMessage: {
    type: String,
    required: true
  },
  // New pricing fields
  price: {
    type: Number,
    min: 0
  },
  isPriceConfirmed: {
    type: Boolean,
    default: false
  },
  paidBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  // OCR mapping fields
  matchedReceiptLine: String,
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

orderItemSchema.index({ headingId: 1, requestedBy: 1 });

// Calculate total paid amount
orderItemSchema.virtual('totalPaid').get(function() {
  return this.paidBy.reduce((sum, payment) => sum + payment.amount, 0);
});

// Check if item is fully paid
orderItemSchema.virtual('isFullyPaid').get(function() {
  return this.price && this.totalPaid >= this.price;
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
