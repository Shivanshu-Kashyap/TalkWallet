const mongoose = require('mongoose');

const headingSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['OPEN', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN'
  }
}, {
  timestamps: true
});

headingSchema.index({ groupId: 1, status: 1 });

module.exports = mongoose.model('Heading', headingSchema);
