const express = require('express');
const { body } = require('express-validator');
const priceController = require('../controllers/priceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/items/:itemId/price - Manual price input
router.post('/:itemId/price', [
  auth,
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number')
], priceController.addManualPrice);

// POST /api/items/:itemId/payers - Assign payers
router.post('/:itemId/payers', [
  auth,
  body('payers')
    .isArray({ min: 1 })
    .withMessage('Payers array is required'),
  body('payers.*.userId')
    .isMongoId()
    .withMessage('Valid user ID required'),
  body('payers.*.amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be positive')
], priceController.assignPayer);

module.exports = router;
