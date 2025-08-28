const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  headingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heading',
    required: true,
    unique: true,
    index: true
  },
  computedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The optimized payment plan using minimum cash flow algorithm
  transactions: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED'],
      default: 'PENDING'
    },
    paidAt: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  computedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

settlementSchema.index({ 'transactions.from': 1 });
settlementSchema.index({ 'transactions.to': 1 });
settlementSchema.index({ status: 1 });

// Virtual to check if settlement is fully paid
settlementSchema.virtual('isFullyPaid').get(function() {
  return this.transactions.every(t => t.status === 'PAID');
});

module.exports = mongoose.model('Settlement', settlementSchema);
