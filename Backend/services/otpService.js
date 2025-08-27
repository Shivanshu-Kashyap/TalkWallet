const twilio = require('twilio');
const OTP = require('../models/OTP');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phoneE164) {
    try {
      // Clean up expired OTPs manually
      await OTP.deleteMany({ expiresAt: { $lt: new Date() } });

      const existingOTP = await OTP.findOne({
        phoneE164,
        used: false,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 3 }
      });

      if (existingOTP) {
        return { success: false, message: 'OTP already sent. Please wait before requesting again.' };
      }

      const otp = this.generateOTP();

      await OTP.create({
        phoneE164,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // valid for 5 min
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${phoneE164}: ${otp}`);
        return { success: true, message: 'OTP sent successfully', otp };
      } else {
        await client.messages.create({
          body: `Your SmartSplit verification code is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneE164
        });
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('OTP send error:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  async verifyOTP(phoneE164, inputOTP) {
    try {
      const otpRecord = await OTP.findOne({
        phoneE164,
        used: false,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 3 }
      });

      if (!otpRecord) {
        return { success: false, message: 'OTP expired or not found' };
      }

      if (otpRecord.otp !== inputOTP) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return { success: false, message: 'Invalid OTP' };
      }

      // ✅ Do not mark used here. Let controller do it after user creation succeeds
      return { success: true, message: 'OTP verified successfully', otpRecord };
    } catch (error) {
      console.error('OTP verify error:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }
}

module.exports = new OTPService();
