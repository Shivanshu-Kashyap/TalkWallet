const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneE164: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+[1-9]\d{1,14}$/.test(v);
      }
    }
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true
});

otpSchema.index({ phoneE164: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
