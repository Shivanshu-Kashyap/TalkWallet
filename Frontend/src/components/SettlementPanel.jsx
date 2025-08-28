import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Calculator, 
  Check, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  useCalculateSettlementMutation,
  useGetSettlementQuery,
  useConfirmPaymentMutation 
} from '../store/api';
import toast from 'react-hot-toast';

const SettlementPanel = ({ heading, groupId, userRole }) => {
  const { user } = useSelector((state) => state.auth);
  const [calculating, setCalculating] = useState(false);
  
  const { data: settlementData, refetch } = useGetSettlementQuery(heading._id);
  const [calculateSettlement] = useCalculateSettlementMutation();
  const [confirmPayment] = useConfirmPaymentMutation();

  const settlement = settlementData?.settlement;

  const handleCalculateSettlement = async () => {
    try {
      setCalculating(true);
      await calculateSettlement(heading._id).unwrap();
      toast.success('Settlement calculated successfully!');
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to calculate settlement');
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirmPayment = async (settlementId, transactionId) => {
    try {
      await confirmPayment({ settlementId, transactionId }).unwrap();
      toast.success('Payment confirmed successfully!');
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to confirm payment');
    }
  };

  const generateUPILink = (amount, recipientName, transactionNote) => {
    // This would be replaced with actual UPI ID lookup
    const upiId = `${recipientName.toLowerCase().replace(/\s+/g, '')}@paytm`;
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    return upiLink;
  };

  if (!settlement && userRole !== 'admin') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <Clock className="h-5 w-5" />
          <span className="font-medium">Waiting for settlement calculation...</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Group admin will calculate the final settlement soon.
        </p>
      </div>
    );
  }

  if (!settlement && userRole === 'admin') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-800">
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Ready to Calculate Settlement</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              All items have been priced. Calculate the optimized payment plan.
            </p>
          </div>
          <button
            onClick={handleCalculateSettlement}
            disabled={calculating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {calculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                <span>Calculate Settlement</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Settlement exists - show settlement details
  const userTransactions = settlement.transactions.filter(t => 
    t.from._id === user?.id || t.to._id === user?.id
  );

  const outgoingTransactions = userTransactions.filter(t => t.from._id === user?.id);
  const incomingTransactions = userTransactions.filter(t => t.to._id === user?.id);

  const totalOwed = outgoingTransactions
    .filter(t => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceiving = incomingTransactions
    .filter(t => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500 rounded-full">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-purple-900">Settlement Summary</h3>
              <p className="text-sm text-purple-700">{heading.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-purple-700">
              ₹{settlement.totalAmount} total
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              settlement.status === 'COMPLETED' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {settlement.status}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-sm text-gray-600">You owe</div>
            <div className="text-lg font-semibold text-red-600">
              ₹{totalOwed.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-sm text-gray-600">You receive</div>
            <div className="text-lg font-semibold text-green-600">
              ₹{totalReceiving.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Outgoing Payments */}
        {outgoingTransactions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">You need to pay:</h4>
            <div className="space-y-2">
              {outgoingTransactions.map((transaction) => (
                <div key={transaction._id} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.to.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {transaction.status === 'PAID' ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Paid</span>
                        </div>
                      ) : (
                        <a
                          href={generateUPILink(
                            transaction.amount,
                            transaction.to.displayName,
                            `Payment for ${heading.title}`
                          )}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Pay Now</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming Payments */}
        {incomingTransactions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">You will receive:</h4>
            <div className="space-y-2">
              {incomingTransactions.map((transaction) => (
                <div key={transaction._id} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.from.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {transaction.status === 'PAID' ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Received</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmPayment(settlement._id, transaction._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                        >
                          <Check className="h-3 w-3" />
                          <span>Mark Received</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All settled message */}
        {totalOwed === 0 && totalReceiving === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">All settlements complete!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementPanel;
