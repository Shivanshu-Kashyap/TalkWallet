import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Plus, 
  Users, 
  MessageCircle, 
  LogOut, 
  Phone,
  TrendingUp,
  TrendingDown,
  Wallet,
  History,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  useGetUserGroupsQuery, 
  useCreateGroupMutation,
  useGetDashboardSummaryQuery,
  useGetUserSettlementsQuery 
} from '../store/api';
import { logout } from '../store/slices/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateGroupModal from '../components/CreateGroupModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: groupsData, isLoading: groupsLoading, refetch } = useGetUserGroupsQuery();
  const { data: summaryData, isLoading: summaryLoading } = useGetDashboardSummaryQuery();
  const { data: settlementsData } = useGetUserSettlementsQuery();
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

  if (groupsLoading || summaryLoading) {
    return <LoadingSpinner />;
  }

  const groups = groupsData?.groups || [];
  const summary = summaryData?.summary;
  const settlements = settlementsData?.settlements || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">₹</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TalkWallet</h1>
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

          {/* Navigation Tabs */}
          <div className="flex space-x-6 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settlements'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settlements
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab summary={summary} />
        )}

        {activeTab === 'groups' && (
          <GroupsTab 
            groups={groups}
            onCreateGroup={() => setShowCreateModal(true)}
            formatTime={formatTime}
            navigate={navigate}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementsTab settlements={settlements} />
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

const OverviewTab = ({ summary }) => {
  if (!summary) {
    return <div>Loading summary...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">You Owe</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{summary.pendingAmounts.totalYouOwe}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">You're Owed</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.pendingAmounts.totalYouAreOwed}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${
                summary.pendingAmounts.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{Math.abs(summary.pendingAmounts.netBalance)}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary.thisMonthSpend}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Pending Transactions */}
      {summary.pendingTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Pending Settlements</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {summary.pendingTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.type === 'OUTGOING' ? 'Pay' : 'Receive from'} {transaction.user.displayName}
                      </p>
                      <p className="text-sm text-gray-500">₹{transaction.amount}</p>
                    </div>
                  </div>
                  
                  {transaction.type === 'OUTGOING' && (
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1">
                      <ExternalLink className="h-3 w-3" />
                      <span>Pay Now</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group Spending Breakdown */}
      {summary.groupSpending.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Group Spending This Month</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {summary.groupSpending.map((group) => (
                <div key={group.groupId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{group.groupName}</p>
                    <p className="text-sm text-gray-500">{group.transactionCount} transactions</p>
                  </div>
                  <p className="font-semibold text-gray-900">₹{group.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupsTab = ({ groups, onCreateGroup, formatTime, navigate }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
        <button
          onClick={onCreateGroup}
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
            onClick={onCreateGroup}
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
    </div>
  );
};

const SettlementsTab = ({ settlements }) => {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No settlements yet</h3>
        <p className="text-gray-500">Your settlement history will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settlement History</h2>
      
      <div className="space-y-4">
        {settlements.map((settlement) => (
          <div key={settlement._id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {settlement.headingId.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Total: ₹{settlement.totalAmount} • {settlement.transactions.length} transactions
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                settlement.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {settlement.status}
              </span>
            </div>
            
            <div className="space-y-2">
              {settlement.transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.from.displayName} → {transaction.to.displayName}
                      </p>
                      <p className="text-sm text-gray-500">₹{transaction.amount}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
