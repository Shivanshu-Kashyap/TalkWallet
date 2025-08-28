import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  X, 
  Zap, 
  Trash2, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Camera, 
  Upload,
  Check,
  Edit,
  Loader
} from 'lucide-react';
import { 
  useGetOrderItemsQuery, 
  useDeleteOrderItemMutation,
  useAddItemPriceMutation,
  useAssignPayersMutation,
  useUploadReceiptMutation,
  useGetReceiptsQuery
} from '../store/api';
import { setOrderItems } from '../store/slices/messageSlice';
import toast from 'react-hot-toast';

const SmartPanel = ({ heading, groupId, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const orderItems = useSelector((state) => state.messages.orderItems[heading._id] || []);
  
  const [activeTab, setActiveTab] = useState('orders');
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [assigningPayer, setAssigningPayer] = useState(null);
  
  const { data: orderItemsData, refetch } = useGetOrderItemsQuery(heading._id);
  const { data: receiptsData } = useGetReceiptsQuery(heading._id);
  const [deleteOrderItem] = useDeleteOrderItemMutation();
  const [addItemPrice] = useAddItemPriceMutation();
  const [assignPayers] = useAssignPayersMutation();
  const [uploadReceipt, { isLoading: uploadingReceipt }] = useUploadReceiptMutation();

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

  const handleAddPrice = async (itemId) => {
    try {
      const price = parseFloat(priceInput);
      if (!price || price <= 0) {
        toast.error('Please enter a valid price');
        return;
      }

      await addItemPrice({ itemId, price }).unwrap();
      setEditingPrice(null);
      setPriceInput('');
      toast.success('Price added successfully');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to add price');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      await uploadReceipt({ headingId: heading._id, formData }).unwrap();
      toast.success('Receipt uploaded! Processing...');
      event.target.value = ''; // Reset file input
    } catch (error) {
      toast.error(error.data?.message || 'Failed to upload receipt');
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
  const totalValue = orderItems.reduce((sum, item) => 
    sum + (item.price ? item.price * item.quantity : 0), 0
  );
  const pricedItems = orderItems.filter(item => item.isPriceConfirmed).length;
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
                <DollarSign className="h-4 w-4" />
                <span>₹{totalValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{uniqueUsers} people</span>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {pricedItems}/{totalItems} priced
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeTab === 'orders' 
                ? 'bg-green-500 text-white' 
                : 'text-green-700 hover:bg-green-100'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeTab === 'receipts' 
                ? 'bg-green-500 text-white' 
                : 'text-green-700 hover:bg-green-100'
            }`}
          >
            Receipts ({receiptsData?.receipts?.length || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'orders' && (
          <OrdersTab 
            orderItems={orderItems}
            groupedItems={groupedItems}
            user={user}
            editingPrice={editingPrice}
            setEditingPrice={setEditingPrice}
            priceInput={priceInput}
            setPriceInput={setPriceInput}
            handleAddPrice={handleAddPrice}
            handleDeleteItem={handleDeleteItem}
            assigningPayer={assigningPayer}
            setAssigningPayer={setAssigningPayer}
            assignPayers={assignPayers}
            groupId={groupId}
          />
        )}
        
        {activeTab === 'receipts' && (
          <ReceiptsTab 
            receipts={receiptsData?.receipts || []}
            handleFileUpload={handleFileUpload}
            uploadingReceipt={uploadingReceipt}
          />
        )}
      </div>

      {/* Upload Receipt Button */}
      {activeTab === 'orders' && (
        <div className="px-4 py-3 bg-green-25 border-t border-green-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">
              Add prices manually or upload receipt for automatic detection
            </div>
            <label className="flex items-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 cursor-pointer transition-colors">
              {uploadingReceipt ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>Upload Receipt</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingReceipt}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersTab = ({ 
  orderItems, 
  groupedItems, 
  user, 
  editingPrice, 
  setEditingPrice,
  priceInput,
  setPriceInput,
  handleAddPrice,
  handleDeleteItem,
  assigningPayer,
  setAssigningPayer,
  assignPayers,
  groupId
}) => {
  if (orderItems.length === 0) {
    return (
      <div className="p-6 text-center text-green-600">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No orders yet. Start chatting to add items!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {Object.entries(groupedItems).map(([userName, userItems]) => (
        <div key={userName} className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{userName}</h4>
            <span className="text-sm text-gray-500">
              {userItems.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>
          
          <div className="space-y-3">
            {userItems.map((item) => (
              <OrderItemRow
                key={item._id}
                item={item}
                user={user}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                handleAddPrice={handleAddPrice}
                handleDeleteItem={handleDeleteItem}
                assigningPayer={assigningPayer}
                setAssigningPayer={setAssigningPayer}
                assignPayers={assignPayers}
                groupId={groupId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderItemRow = ({ 
  item, 
  user, 
  editingPrice, 
  setEditingPrice,
  priceInput,
  setPriceInput,
  handleAddPrice,
  handleDeleteItem,
  assigningPayer,
  setAssigningPayer,
  assignPayers,
  groupId
}) => {
  const canDelete = item.requestedBy._id === user?.id;
  const isEditing = editingPrice === item._id;

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{item.label}</span>
            <span className="text-sm text-gray-500">×{item.quantity}</span>
            {item.isPriceConfirmed && (
              <span className="text-sm font-medium text-green-600">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            )}
          </div>
          
          {item.options.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {item.options.join(', ')}
            </div>
          )}
          
          {item.matchedReceiptLine && (
            <div className="text-xs text-blue-600 mt-1">
              Matched: {item.matchedReceiptLine}
            </div>
          )}

          {/* Price Input */}
          {!item.isPriceConfirmed && (
            <div className="mt-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="Enter price"
                    className="w-20 px-2 py-1 text-sm border rounded"
                    step="0.01"
                    min="0"
                  />
                  <button
                    onClick={() => handleAddPrice(item._id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPrice(null);
                      setPriceInput('');
                    }}
                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingPrice(item._id);
                    setPriceInput(item.price || '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Price
                </button>
              )}
            </div>
          )}

          {/* Payers */}
          {item.isPriceConfirmed && item.paidBy.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500">Paid by:</div>
              {item.paidBy.map((payer, index) => (
                <div key={index} className="text-xs text-gray-700">
                  {payer.userId.displayName}: ₹{payer.amount.toFixed(2)}
                </div>
              ))}
            </div>
          )}
          
          {item.isPriceConfirmed && item.paidBy.length === 0 && (
            <PayerAssignment 
              item={item}
              assignPayers={assignPayers}
              groupId={groupId}
            />
          )}
        </div>
        
        {canDelete && (
          <button
            onClick={() => handleDeleteItem(item._id)}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Remove item"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const PayerAssignment = ({ item, assignPayers, groupId }) => {
  const [showPayers, setShowPayers] = useState(false);
  
  return (
    <div className="mt-2">
      <button
        onClick={() => setShowPayers(!showPayers)}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Assign Payer
      </button>
      
      {showPayers && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600 mb-2">
            Who paid for this item? (₹{item.price})
          </div>
          <button
            onClick={() => {
              // Simple implementation: assign to self
              assignPayers({ 
                itemId: item._id, 
                payers: [{ 
                  userId: item.requestedBy._id, 
                  amount: item.price 
                }] 
              });
              setShowPayers(false);
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            {item.requestedBy.displayName} pays
          </button>
        </div>
      )}
    </div>
  );
};

const ReceiptsTab = ({ receipts, handleFileUpload, uploadingReceipt }) => {
  if (receipts.length === 0) {
    return (
      <div className="p-6 text-center text-green-600">
        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm mb-4">No receipts uploaded yet</p>
        <label className="inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 cursor-pointer transition-colors">
          <Camera className="h-4 w-4" />
          <span>Upload First Receipt</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploadingReceipt}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {receipts.map((receipt) => (
        <div key={receipt._id} className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-start space-x-3">
            <img
              src={receipt.imageUrl}
              alt="Receipt"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Uploaded by {receipt.uploadedBy.displayName}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  receipt.status === 'COMPLETED' 
                    ? 'bg-green-100 text-green-800'
                    : receipt.status === 'PROCESSING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : receipt.status === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {receipt.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(receipt.createdAt).toLocaleString()}
              </div>
              
              {receipt.aiMappings && receipt.aiMappings.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  {receipt.aiMappings.length} items mapped
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartPanel;
