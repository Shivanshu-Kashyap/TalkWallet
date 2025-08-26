const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneE164: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: 'Phone number must be in E.164 format'
    }
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phoneVerifiedAt: {
    type: Date,
    default: null
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ phoneE164: 1 });

module.exports = mongoose.model('User', userSchema);
