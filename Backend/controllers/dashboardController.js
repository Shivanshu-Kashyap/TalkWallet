const DashboardService = require('../services/DashboardService');

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await DashboardService.getDashboardSummary(userId);
    res.json({ summary });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const history = await DashboardService.getTransactionHistory(userId, page, limit);
    res.json(history);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSpendingAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 6;
    
    const analytics = await DashboardService.getSpendingAnalytics(userId, months);
    res.json({ analytics });
  } catch (error) {
    console.error('Spending analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardSummary,
  getTransactionHistory,
  getSpendingAnalytics
};
