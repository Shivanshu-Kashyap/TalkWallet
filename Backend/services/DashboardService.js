const LedgerEntry = require('../models/LedgerEntry');
const Settlement = require('../models/Settlement');
const OrderItem = require('../models/OrderItem');
const Membership = require('../models/Membership');

class DashboardService {
  
  /**
   * Get comprehensive dashboard summary for a user
   */
  async getDashboardSummary(userId) {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      // Get all pending settlements involving this user
      const pendingSettlements = await Settlement.find({
        status: 'ACTIVE',
        $or: [
          { 'transactions.from': userId },
          { 'transactions.to': userId }
        ]
      }).populate('transactions.from transactions.to', 'displayName phoneE164');
      
      // Calculate pending amounts
      let totalYouOwe = 0;
      let totalYouAreOwed = 0;
      const pendingTransactions = [];
      
      pendingSettlements.forEach(settlement => {
        settlement.transactions.forEach(transaction => {
          if (transaction.status === 'PENDING') {
            if (transaction.from._id.toString() === userId.toString()) {
              totalYouOwe += transaction.amount;
              pendingTransactions.push({
                type: 'OUTGOING',
                amount: transaction.amount,
                user: transaction.to,
                settlementId: settlement._id,
                transactionId: transaction._id,
                headingId: settlement.headingId
              });
            } else if (transaction.to._id.toString() === userId.toString()) {
              totalYouAreOwed += transaction.amount;
              pendingTransactions.push({
                type: 'INCOMING',
                amount: transaction.amount,
                user: transaction.from,
                settlementId: settlement._id,
                transactionId: transaction._id,
                headingId: settlement.headingId
              });
            }
          }
        });
      });
      
      // Calculate this month's spending
      const monthlySpending = await LedgerEntry.aggregate([
        {
          $match: {
            userId: userId,
            type: 'CONSUMPTION',
            createdAt: { $gte: currentMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const thisMonthSpend = monthlySpending.length > 0 ? monthlySpending[0].total : 0;
      
      // Get group-wise spending breakdown
      const groupSpending = await LedgerEntry.aggregate([
        {
          $match: {
            userId: userId,
            type: 'CONSUMPTION',
            createdAt: { $gte: currentMonth }
          }
        },
        {
          $group: {
            _id: '$groupId',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'groups',
            localField: '_id',
            foreignField: '_id',
            as: 'group'
          }
        },
        {
          $unwind: '$group'
        },
        {
          $sort: { total: -1 }
        }
      ]);
      
      // Calculate total lifetime stats
      const lifetimeStats = await LedgerEntry.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      const lifetimeSpent = lifetimeStats.find(stat => stat._id === 'CONSUMPTION')?.total || 0;
      const lifetimePaid = lifetimeStats.find(stat => stat._id === 'PAYMENT')?.total || 0;
      
      return {
        pendingAmounts: {
          totalYouOwe: Math.round(totalYouOwe * 100) / 100,
          totalYouAreOwed: Math.round(totalYouAreOwed * 100) / 100,
          netBalance: Math.round((totalYouAreOwed - totalYouOwe) * 100) / 100
        },
        thisMonthSpend: Math.round(thisMonthSpend * 100) / 100,
        pendingTransactions,
        groupSpending: groupSpending.map(group => ({
          groupId: group._id,
          groupName: group.group.name,
          amount: Math.round(group.total * 100) / 100,
          transactionCount: group.count
        })),
        lifetimeStats: {
          totalSpent: Math.round(lifetimeSpent * 100) / 100,
          totalPaid: Math.round(lifetimePaid * 100) / 100,
          totalTransactions: lifetimeStats.reduce((sum, stat) => sum + stat.count, 0)
        }
      };
      
    } catch (error) {
      console.error('Dashboard summary error:', error);
      throw error;
    }
  }
  
  /**
   * Get paginated transaction history
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const transactions = await LedgerEntry.find({ userId })
        .populate('groupId', 'name')
        .populate('headingId', 'title')
        .populate('metadata.relatedUsers', 'displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const totalCount = await LedgerEntry.countDocuments({ userId });
      
      const formattedTransactions = transactions.map(transaction => ({
        _id: transaction._id,
        type: transaction.type,
        amount: Math.round(transaction.amount * 100) / 100,
        description: transaction.description,
        groupName: transaction.groupId?.name || 'Unknown Group',
        headingTitle: transaction.headingId?.title || 'Unknown Session',
        date: transaction.createdAt,
        metadata: transaction.metadata,
        relatedUsers: transaction.metadata?.relatedUsers || []
      }));
      
      return {
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: skip + limit < totalCount,
          hasPrevPage: page > 1
        }
      };
      
    } catch (error) {
      console.error('Transaction history error:', error);
      throw error;
    }
  }
  
  /**
   * Get spending analytics for charts
   */
  async getSpendingAnalytics(userId, months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      // Monthly spending trend
      const monthlyTrend = await LedgerEntry.aggregate([
        {
          $match: {
            userId: userId,
            type: 'CONSUMPTION',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
      
      // Category-wise spending (based on item names)
      const categorySpending = await LedgerEntry.aggregate([
        {
          $match: {
            userId: userId,
            type: 'CONSUMPTION',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$metadata.itemName',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { total: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      return {
        monthlyTrend: monthlyTrend.map(month => ({
          period: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          amount: Math.round(month.total * 100) / 100,
          transactionCount: month.count
        })),
        topCategories: categorySpending.map(category => ({
          name: category._id || 'Unknown',
          amount: Math.round(category.total * 100) / 100,
          count: category.count
        }))
      };
      
    } catch (error) {
      console.error('Spending analytics error:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();
