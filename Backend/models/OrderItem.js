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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

orderItemSchema.index({ headingId: 1, requestedBy: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
