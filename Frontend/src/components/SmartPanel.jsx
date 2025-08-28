import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Zap, Trash2, Users, ShoppingBag } from 'lucide-react';
import { useGetOrderItemsQuery, useDeleteOrderItemMutation } from '../store/api';
import { setOrderItems } from '../store/slices/messageSlice';
import toast from 'react-hot-toast';

const SmartPanel = ({ heading, groupId, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const orderItems = useSelector((state) => state.messages.orderItems[heading._id] || []);
  
  const { data: orderItemsData, refetch } = useGetOrderItemsQuery(heading._id);
  const [deleteOrderItem] = useDeleteOrderItemMutation();

  useEffect(() => {
    if (orderItemsData?.orderItems) {
      dispatch(setOrderItems({
        headingId: heading._id,
        items: orderItemsData.orderItems
      }));
    }
  }, [orderItemsData, heading._id, dispatch]);

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteOrderItem(itemId).unwrap();
      toast.success('Item removed');
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to remove item');
    }
  };

  // Group items by user
  const groupedItems = orderItems.reduce((acc, item) => {
    const userName = item.requestedBy.displayName;
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(item);
    return acc;
  }, {});

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueUsers = Object.keys(groupedItems).length;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500 rounded-full">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Smart Order Panel</h3>
              <p className="text-sm text-green-700">{heading.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-4 text-sm text-green-700">
              <div className="flex items-center space-x-1">
                <ShoppingBag className="h-4 w-4" />
                <span>{totalItems} items</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{uniqueUsers} people</span>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {heading.status}
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="px-4 py-2 bg-green-25 border-b border-green-100">
        <div className="flex items-center space-x-2 text-sm text-green-700">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>🤖 AI is listening for orders...</span>
          </div>
        </div>
        <div className="mt-1 text-xs text-green-600">
          Try: "2 cheese sandwich", "mera ek pizza large", "biryani order kardo"
        </div>
      </div>

      {/* Orders List */}
      <div className="max-h-80 overflow-y-auto">
        {orderItems.length === 0 ? (
          <div className="p-6 text-center text-green-600">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No orders yet. Start chatting to add items!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(groupedItems).map(([userName, userItems]) => (
              <div key={userName} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{userName}</h4>
                  <span className="text-sm text-gray-500">
                    {userItems.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>
                
                <div className="space-y-2">
                  {userItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between py-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            ×{item.quantity}
                          </span>
                        </div>
                        {item.options.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.options.join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {(item.requestedBy._id === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {orderItems.length > 0 && (
        <div className="px-4 py-3 bg-green-25 border-t border-green-100">
          <div className="text-center text-sm text-green-700">
            🎯 Keep chatting to add more items. AI will detect and organize them automatically!
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPanel;
