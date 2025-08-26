import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Users, MessageCircle, LogOut, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetUserGroupsQuery, useCreateGroupMutation } from '../store/api';
import { logout } from '../store/slices/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateGroupModal from '../components/CreateGroupModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: groupsData, isLoading, refetch } = useGetUserGroupsQuery();
  const [createGroup] = useCreateGroupMutation();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const response = await createGroup(groupData).unwrap();
      toast.success(response.message);
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to create group');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const groups = groupsData?.groups || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">₹</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SmartSplit</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.displayName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{user?.phoneE164}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Group</span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-500 mb-6">Create your first group to start splitting bills with friends!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => navigate(`/group/${group._id}`)}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                    {group.description && (
                      <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>Chat</span>
                      </div>
                      <span className="text-xs">
                        Created {formatTime(group.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {group.userRole === 'admin' && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default DashboardPage;
