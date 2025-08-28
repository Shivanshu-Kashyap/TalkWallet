const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/headings/:headingId/orders
router.get('/:headingId/orders', auth, orderController.getOrderItems);

// DELETE /api/orders/:itemId
router.delete('/:itemId', auth, orderController.deleteOrderItem);

module.exports = router;
