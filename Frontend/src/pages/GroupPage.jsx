import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Send, DollarSign, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  useGetMessagesQuery, 
  useGetActiveHeadingQuery,
  useCreateHeadingMutation,
  useGetGroupMembersQuery 
} from '../store/api';
import socketService from '../services/socketService';
import LoadingSpinner from '../components/LoadingSpinner';
import SmartPanel from '../components/SmartPanel';
import AddMemberModal from '../components/AddMemberModal';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState('');
  const [showSmartPanel, setShowSmartPanel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { data: messagesData, refetch: refetchMessages } = useGetMessagesQuery({ groupId });
  const { data: headingData, refetch: refetchHeading } = useGetActiveHeadingQuery(groupId);
  const { data: membersData } = useGetGroupMembersQuery(groupId);
  const [createHeading] = useCreateHeadingMutation();
  
  const messages = useSelector((state) => state.messages.messages[groupId] || []);
  const activeHeading = useSelector((state) => state.messages.activeHeadings[groupId]);

  useEffect(() => {
    if (groupId) {
      socketService.joinGroup(groupId);
      refetchMessages();
      refetchHeading();
    }
  }, [groupId, refetchMessages, refetchHeading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (headingData?.heading) {
      setShowSmartPanel(true);
    }
  }, [headingData]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    socketService.sendMessage(groupId, message);
    setMessage('');
  };

  const handleStartBillSplit = async (title) => {
    try {
      const response = await createHeading({ 
        groupId, 
        headingData: { title } 
      }).unwrap();
      
      setShowSmartPanel(true);
      socketService.emitHeadingOpened(groupId, response.heading._id);
      toast.success('Bill-splitting session started!');
    } catch (error) {
      toast.error(error.data?.message || 'Failed to start bill-splitting session');
    }
  };

  const currentGroup = membersData?.members?.find(m => m.userId._id === user?.id)?.groupId;
  const members = membersData?.members || [];

  if (!messagesData) {
    return <LoadingSpinner />;
  }

  const allMessages = [...(messagesData.messages || []), ...messages];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {currentGroup?.name || 'Group Chat'}
              </h1>
              <p className="text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add member"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Group info"
            >
              <Users className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Smart Panel */}
      {showSmartPanel && (activeHeading || headingData?.heading) && (
        <SmartPanel
          heading={activeHeading || headingData?.heading}
          groupId={groupId}
          onClose={() => setShowSmartPanel(false)}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {allMessages.map((msg, index) => (
          <div
            key={msg._id || index}
            className={`flex ${msg.senderId._id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId._id === user?.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border'
              }`}
            >
              {msg.senderId._id !== user?.id && (
                <p className="text-xs text-gray-500 mb-1">
                  {msg.senderId.displayName}
                </p>
              )}
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${
                msg.senderId._id === user?.id ? 'text-primary-100' : 'text-gray-400'
              }`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center space-x-3">
          {!showSmartPanel && (
            <BillSplitButton onStart={handleStartBillSplit} />
          )}
          
          <form onSubmit={handleSendMessage} className="flex-1 flex space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
};

const BillSplitButton = ({ onStart }) => {
  const [showInput, setShowInput] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onStart(title);
    setTitle('');
    setShowInput(false);
  };

  if (showInput) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter bill title (e.g., Lunch Order)"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => {
            setShowInput(false);
            setTitle('');
          }}
          className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
      title="Start Bill Splitting"
    >
      <DollarSign className="h-5 w-5" />
    </button>
  );
};

export default GroupPage;
