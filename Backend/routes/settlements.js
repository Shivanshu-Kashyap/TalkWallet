const express = require('express');
const settlementController = require('../controllers/settlementController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/headings/:headingId/settle
router.post('/:headingId/settle', auth, settlementController.calculateSettlement);

// GET /api/headings/:headingId/settlement
router.get('/:headingId/settlement', auth, settlementController.getSettlement);

// POST /api/settlements/:settlementId/transactions/:transactionId/confirm
router.post('/:settlementId/transactions/:transactionId/confirm', 
  auth, 
  settlementController.confirmPayment
);

// GET /api/settlements/user - Get user's settlements
router.get('/user', auth, settlementController.getUserSettlements);

module.exports = router;
