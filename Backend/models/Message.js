const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'system', 'heading'],
    default: 'text'
  }
}, {
  timestamps: true
});

messageSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
