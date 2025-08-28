const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', auth, dashboardController.getDashboardSummary);

// GET /api/dashboard/history
router.get('/history', auth, dashboardController.getTransactionHistory);

// GET /api/dashboard/analytics
router.get('/analytics', auth, dashboardController.getSpendingAnalytics);

module.exports = router;
