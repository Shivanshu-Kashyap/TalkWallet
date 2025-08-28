const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  headingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heading',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  type: {
    type: String,
    enum: ['CONSUMPTION', 'PAYMENT', 'SETTLEMENT_IN', 'SETTLEMENT_OUT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Reference to related entities
  orderItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem'
  },
  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement'
  },
  // Additional metadata
  metadata: {
    itemName: String,
    quantity: Number,
    unitPrice: Number,
    relatedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

ledgerEntrySchema.index({ userId: 1, createdAt: -1 });
ledgerEntrySchema.index({ type: 1, createdAt: -1 });
ledgerEntrySchema.index({ headingId: 1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
