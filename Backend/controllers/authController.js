const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const otpService = require('../services/otpService');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const startOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneE164 } = req.body;
    const result = await otpService.sendOTP(phoneE164);

    if (result.success) {
      res.json({
        message: result.message,
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Start OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneE164, otp, displayName } = req.body;
    const result = await otpService.verifyOTP(phoneE164, otp);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    let user = await User.findOne({ phoneE164 });

    if (!user) {
      if (!displayName) {
        return res.status(400).json({ message: 'Display name is required for new users' });
      }
      user = new User({
        phoneE164,
        displayName: displayName.trim(),
        phoneVerifiedAt: new Date()
      });
    } else {
      user.phoneVerifiedAt = new Date();
      user.lastActiveAt = new Date();
      if (displayName && displayName.trim()) {
        user.displayName = displayName.trim();
      }
    }

    await user.save();

    // ✅ Mark OTP as used only after successful user save
    await OTP.updateOne({ _id: result.otpRecord._id }, { $set: { used: true } });

    const tokens = generateTokens(user._id);

    res.json({
      message: 'Authentication successful',
      user: {
        id: user._id,
        phoneE164: user.phoneE164,
        displayName: user.displayName,
        phoneVerifiedAt: user.phoneVerifiedAt
      },
      tokens
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  startOTP,
  verifyOTP,
  getProfile
};
