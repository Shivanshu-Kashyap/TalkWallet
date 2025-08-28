const SettlementEngine = require('../services/SettlementEngine');
const Settlement = require('../models/Settlement');
const Membership = require('../models/Membership');
const Heading = require('../models/Heading');

const calculateSettlement = async (req, res) => {
  try {
    const { headingId } = req.params;
    const userId = req.user._id;

    // Verify heading exists and user has admin access
    const heading = await Heading.findById(headingId).populate('groupId');
    if (!heading) {
      return res.status(404).json({ message: 'Heading not found' });
    }

    if (heading.status !== 'OPEN') {
      return res.status(400).json({ message: 'Heading is not open for settlement' });
    }

    // Check if user is admin of the group
    const membership = await Membership.findOne({
      userId,
      groupId: heading.groupId._id,
      role: 'admin',
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only group admins can calculate settlement' });
    }

    // Check if settlement already exists
    const existingSettlement = await Settlement.findOne({ headingId });
    if (existingSettlement) {
      return res.status(400).json({ message: 'Settlement already calculated for this heading' });
    }

    const settlement = await SettlementEngine.calculateSettlement(headingId, userId);

    res.json({
      message: 'Settlement calculated successfully',
      settlement
    });

    // Broadcast settlement to group
    if (req.io) {
      req.io.to(`group_${heading.groupId._id}`).emit('settlement_calculated', {
        settlement
      });
    }

  } catch (error) {
    console.error('Calculate settlement error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to calculate settlement' 
    });
  }
};

const getSettlement = async (req, res) => {
  try {
    const { headingId } = req.params;
    const userId = req.user._id;

    const heading = await Heading.findById(headingId);
    if (!heading) {
      return res.status(404).json({ message: 'Heading not found' });
    }

    // Check if user is member of the group
    const membership = await Membership.findOne({
      userId,
      groupId: heading.groupId,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const settlement = await Settlement.findOne({ headingId })
      .populate('transactions.from', 'displayName phoneE164')
      .populate('transactions.to', 'displayName phoneE164')
      .populate('computedBy', 'displayName');

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    res.json({ settlement });

  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { settlementId, transactionId } = req.params;
    const userId = req.user._id;

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    const transaction = settlement.transactions.id(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only the receiver can confirm payment
    if (transaction.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the receiver can confirm payment' });
    }

    const updatedSettlement = await SettlementEngine.confirmPayment(
      settlementId, 
      transactionId, 
      userId
    );

    res.json({
      message: 'Payment confirmed successfully',
      settlement: updatedSettlement
    });

    // Broadcast update
    if (req.io) {
      const heading = await Heading.findById(settlement.headingId);
      req.io.to(`group_${heading.groupId}`).emit('payment_confirmed', {
        settlement: updatedSettlement,
        transactionId
      });
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to confirm payment' 
    });
  }
};

const getUserSettlements = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = 'ACTIVE' } = req.query;

    const settlements = await Settlement.find({
      status,
      $or: [
        { 'transactions.from': userId },
        { 'transactions.to': userId }
      ]
    })
    .populate('headingId', 'title')
    .populate('transactions.from', 'displayName phoneE164')
    .populate('transactions.to', 'displayName phoneE164')
    .sort({ createdAt: -1 });

    // Filter transactions relevant to this user
    const userSettlements = settlements.map(settlement => ({
      ...settlement.toObject(),
      transactions: settlement.transactions.filter(t => 
        t.from._id.toString() === userId.toString() || 
        t.to._id.toString() === userId.toString()
      )
    }));

    res.json({ settlements: userSettlements });

  } catch (error) {
    console.error('Get user settlements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  calculateSettlement,
  getSettlement,
  confirmPayment,
  getUserSettlements
};
