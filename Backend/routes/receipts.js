const express = require('express');
const receiptController = require('../controllers/priceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/headings/:headingId/receipts - Upload receipt
router.post('/:headingId/receipts', 
  auth, 
  upload.single('receipt'), 
  receiptController.uploadReceipt
);

// GET /api/headings/:headingId/receipts - Get receipts
router.get('/:headingId/receipts', auth, receiptController.getReceipts);

// POST /api/receipts/mappings/:mappingId/confirm - Confirm AI mapping
router.post('/mappings/:mappingId/confirm', auth, receiptController.confirmMapping);

module.exports = router;
