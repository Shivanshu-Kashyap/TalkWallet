import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddMemberMutation } from '../store/api';

const AddMemberModal = ({ groupId, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addMember, { isLoading }] = useAddMemberMutation();

  const formatPhoneNumber = (phone) => {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('91')) return `+${phone}`;
    if (phone.length === 10) return `+91${phone}`;
    return phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await addMember({ 
        groupId, 
        phoneData: { phoneE164: formattedPhone } 
      }).unwrap();
      
      toast.success(response.message);
      onClose();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to add member');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Member</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="memberPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="memberPhone"
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter phone number"
            />
            <p className="mt-1 text-sm text-gray-500">
              The user must be registered with TalkWallet
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
