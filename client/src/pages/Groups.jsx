import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { fetchGroups } from '../store/slices/groupSlice';
import { openModal } from '../store/slices/uiSlice';
import { formatCurrency } from '../utils/helpers';

const Groups = () => {
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Manage your expense groups</p>
        </div>
        <button
          onClick={() => dispatch(openModal('createGroup'))}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search groups..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-600 mb-6">Create your first group to start splitting expenses</p>
          <button
            onClick={() => dispatch(openModal('createGroup'))}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const totalExpenses = group.expenseCount || 0;
            const totalSpent = group.totalSpent || 0;
            
            // Find current user's balance in this group
            const currentUserMember = group.members?.find(m => m._id === user?._id);
            const userBalance = currentUserMember?.balance || 0;
            
            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all"
              >
                {/* Group Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                      <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
                    </div>
                  </div>
                </div>

                {/* Group Description */}
                {group.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Group Stats */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Spent</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(totalSpent, group.baseCurrency || group.currency)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Expenses</p>
                      <p className="font-semibold text-gray-900">{totalExpenses}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Your Balance</p>
                      <p className={`font-semibold ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(Math.abs(userBalance), group.baseCurrency || group.currency)}
                      </p>
                      {userBalance !== 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {userBalance > 0 ? 'you get back' : 'you owe'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Currency Badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {group.baseCurrency || group.currency || 'INR'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Groups;
