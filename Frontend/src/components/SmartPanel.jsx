import React from 'react';
import { X, Zap } from 'lucide-react';

const SmartPanel = ({ heading, groupId, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500 rounded-full">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Smart Panel Active</h3>
            <p className="text-sm text-green-700">{heading.title}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
      
      <div className="mt-3 text-sm text-green-700">
        🤖 AI is now listening to your messages for bill-splitting opportunities...
        <div className="mt-1 text-xs text-green-600">
          Try saying things like "I ordered pizza for $25" or "Split the Uber fare"
        </div>
      </div>
    </div>
  );
};

export default SmartPanel;
