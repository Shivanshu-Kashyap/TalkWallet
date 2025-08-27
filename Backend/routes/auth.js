const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/otp/start
router.post('/otp/start', [
  body('phoneE164')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format')
], authController.startOTP);

// POST /api/auth/otp/verify
router.post('/otp/verify', [
  body('phoneE164')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format'),
  body('otp')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1-50 characters')
], authController.verifyOTP);

// GET /api/auth/profile
router.get('/profile', auth, authController.getProfile);

module.exports = router;
