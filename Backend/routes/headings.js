const express = require('express');
const { body } = require('express-validator');
const headingController = require('../controllers/headingController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/groups/:id/headings
router.post('/:id/headings', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters')
], headingController.createHeading);

// GET /api/groups/:id/headings/active
router.get('/:id/headings/active', auth, headingController.getActiveHeading);

module.exports = router;
