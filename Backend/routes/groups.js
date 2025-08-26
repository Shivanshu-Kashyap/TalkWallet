const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/groups
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], groupController.createGroup);

// GET /api/groups
router.get('/', auth, groupController.getUserGroups);

// POST /api/groups/:id/members
router.post('/:id/members', [
  auth,
  body('phoneE164')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format')
], groupController.addMember);

// GET /api/groups/:id/members
router.get('/:id/members', auth, groupController.getGroupMembers);

module.exports = router;
