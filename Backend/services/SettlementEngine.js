const Settlement = require('../models/Settlement');
const LedgerEntry = require('../models/LedgerEntry');
const OrderItem = require('../models/OrderItem');
const Heading = require('../models/Heading');
const Membership = require('../models/Membership');

class SettlementEngine {
  
  /**
   * Main settlement function that calculates and creates optimized payment plan
   */
  async calculateSettlement(headingId, computedBy) {
    try {
      console.log(`Starting settlement calculation for heading: ${headingId}`);
      
      // 1. Lock the heading
      const heading = await Heading.findByIdAndUpdate(headingId, {
        status: 'PROCESSING'
      }, { new: true }).populate('groupId');
      
      if (!heading) {
        throw new Error('Heading not found');
      }
      
      // 2. Get all confirmed order items
      const orderItems = await OrderItem.find({
        headingId,
        isPriceConfirmed: true,
        isActive: true
      }).populate('requestedBy paidBy.userId');
      
      if (orderItems.length === 0) {
        throw new Error('No confirmed order items found');
      }
      
      // 3. Calculate user balances
      const userBalances = await this.calculateUserBalances(orderItems, heading.groupId._id);
      
      // 4. Create ledger entries for all transactions
      await this.createLedgerEntries(orderItems, headingId, heading.groupId._id);
      
      // 5. Run minimum cash flow algorithm
      const optimizedTransactions = this.minimizeCashFlow(userBalances);
      
      // 6. Calculate total settlement amount
      const totalAmount = optimizedTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // 7. Create settlement record
      const settlement = new Settlement({
        headingId,
        computedBy,
        transactions: optimizedTransactions,
        totalAmount,
        status: 'ACTIVE'
      });
      
      await settlement.save();
      
      // 8. Update heading status
      heading.status = 'SETTLED';
      await heading.save();
      
      console.log(`Settlement created with ${optimizedTransactions.length} transactions`);
      
      const populatedSettlement = await Settlement.findById(settlement._id)
        .populate('transactions.from', 'displayName phoneE164')
        .populate('transactions.to', 'displayName phoneE164')
        .populate('computedBy', 'displayName');
      
      return populatedSettlement;
      
    } catch (error) {
      console.error('Settlement calculation error:', error);
      
      // Revert heading status on error
      await Heading.findByIdAndUpdate(headingId, {
        status: 'OPEN'
      });
      
      throw error;
    }
  }
  
  /**
   * Calculate net balance for each user (what they owe or are owed)
   */
  async calculateUserBalances(orderItems, groupId) {
    const balances = new Map();
    
    // Initialize balances for all group members
    const members = await Membership.find({ 
      groupId, 
      isActive: true 
    }).populate('userId');
    
    members.forEach(member => {
      balances.set(member.userId._id.toString(), 0);
    });
    
    // Process each order item
    orderItems.forEach(item => {
      const consumerId = item.requestedBy._id.toString();
      const itemTotal = item.price * item.quantity;
      
      // Debit the consumer (they owe this amount)
      if (balances.has(consumerId)) {
        balances.set(consumerId, balances.get(consumerId) - itemTotal);
      }
      
      // Credit the payers (they paid this amount)
      item.paidBy.forEach(payment => {
        const payerId = payment.userId._id.toString();
        if (balances.has(payerId)) {
          balances.set(payerId, balances.get(payerId) + payment.amount);
        }
      });
    });
    
    console.log('User balances calculated:', Object.fromEntries(balances));
    return balances;
  }
  
  /**
   * Create comprehensive ledger entries for audit trail
   */
  async createLedgerEntries(orderItems, headingId, groupId) {
    const ledgerEntries = [];
    
    for (const item of orderItems) {
      const itemTotal = item.price * item.quantity;
      
      // Create consumption entry
      ledgerEntries.push({
        userId: item.requestedBy._id,
        headingId,
        groupId,
        type: 'CONSUMPTION',
        amount: itemTotal,
        description: `Consumed: ${item.quantity}x ${item.label}`,
        orderItemId: item._id,
        metadata: {
          itemName: item.label,
          quantity: item.quantity,
          unitPrice: item.price,
          relatedUsers: item.paidBy.map(p => p.userId._id)
        }
      });
      
      // Create payment entries
      item.paidBy.forEach(payment => {
        ledgerEntries.push({
          userId: payment.userId._id,
          headingId,
          groupId,
          type: 'PAYMENT',
          amount: payment.amount,
          description: `Paid for: ${item.label} (${item.requestedBy.displayName})`,
          orderItemId: item._id,
          metadata: {
            itemName: item.label,
            quantity: item.quantity,
            unitPrice: item.price,
            relatedUsers: [item.requestedBy._id]
          }
        });
      });
    }
    
    await LedgerEntry.insertMany(ledgerEntries);
    console.log(`Created ${ledgerEntries.length} ledger entries`);
  }
  
  /**
   * Minimum Cash Flow Algorithm - Core optimization logic
   */
  minimizeCashFlow(userBalances) {
    const transactions = [];
    
    // Convert Map to arrays for processing
    const debtors = []; // People who owe money (negative balance)
    const creditors = []; // People who are owed money (positive balance)
    
    userBalances.forEach((balance, userId) => {
      if (balance < -0.01) { // Small epsilon for floating point
        debtors.push({ userId, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ userId, amount: balance });
      }
    });
    
    // Sort by amount (highest first) for optimal matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    let debtorIndex = 0;
    let creditorIndex = 0;
    
    // Greedily match highest debtor with highest creditor
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      
      // Calculate transfer amount (minimum of debt and credit)
      const transferAmount = Math.min(debtor.amount, creditor.amount);
      
      // Create transaction
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(transferAmount * 100) / 100, // Round to 2 decimal places
        status: 'PENDING'
      });
      
      // Update remaining amounts
      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
      
      // Move to next if current is settled
      if (debtor.amount < 0.01) debtorIndex++;
      if (creditor.amount < 0.01) creditorIndex++;
    }
    
    console.log(`Optimized to ${transactions.length} transactions`);
    return transactions;
  }
  
  /**
   * Confirm a payment transaction
   */
  async confirmPayment(settlementId, transactionId, confirmedBy) {
    try {
      const settlement = await Settlement.findById(settlementId);
      if (!settlement) {
        throw new Error('Settlement not found');
      }
      
      const transaction = settlement.transactions.id(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.status === 'PAID') {
        throw new Error('Transaction already confirmed');
      }
      
      // Update transaction status
      transaction.status = 'PAID';
      transaction.paidAt = new Date();
      transaction.confirmedBy = confirmedBy;
      
      await settlement.save();
      
      // Create settlement ledger entries
      await this.createSettlementLedgerEntries(settlement, transaction);
      
      // Check if all transactions are paid
      if (settlement.isFullyPaid) {
        settlement.status = 'COMPLETED';
        await settlement.save();
        
        // Update heading to final status
        await Heading.findByIdAndUpdate(settlement.headingId, {
          status: 'COMPLETED'
        });
      }
      
      const populatedSettlement = await Settlement.findById(settlementId)
        .populate('transactions.from', 'displayName phoneE164')
        .populate('transactions.to', 'displayName phoneE164');
      
      return populatedSettlement;
      
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }
  
  /**
   * Create ledger entries for settlement transactions
   */
  async createSettlementLedgerEntries(settlement, transaction) {
    const heading = await Heading.findById(settlement.headingId);
    
    const ledgerEntries = [
      // Outgoing settlement for payer
      {
        userId: transaction.from,
        headingId: settlement.headingId,
        groupId: heading.groupId,
        type: 'SETTLEMENT_OUT',
        amount: transaction.amount,
        description: `Settlement payment to user`,
        settlementId: settlement._id,
        metadata: {
          relatedUsers: [transaction.to]
        }
      },
      // Incoming settlement for receiver
      {
        userId: transaction.to,
        headingId: settlement.headingId,
        groupId: heading.groupId,
        type: 'SETTLEMENT_IN',
        amount: transaction.amount,
        description: `Settlement received from user`,
        settlementId: settlement._id,
        metadata: {
          relatedUsers: [transaction.from]
        }
      }
    ];
    
    await LedgerEntry.insertMany(ledgerEntries);
  }
}

module.exports = new SettlementEngine();
