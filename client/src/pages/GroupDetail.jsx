import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Receipt, TrendingUp, Plus, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchGroupDetails, fetchBalances, deleteGroup, clearCurrentGroup } from '../store/slices/groupSlice';
import { fetchExpenses } from '../store/slices/expenseSlice';
import { openModal } from '../store/slices/uiSlice';
import { formatCurrency, getRelativeTime, simplifyDebts } from '../utils/helpers';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentGroup, balances, loading } = useSelector((state) => state.groups);
  const { expensesByGroup } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (groupId) {
      // Clear the previous group data first to avoid stale data
      dispatch(clearCurrentGroup());
      dispatch(fetchGroupDetails(groupId))
        .unwrap()
        .then(() => {
          // Only fetch balances and expenses after group details are loaded
          dispatch(fetchBalances(groupId)).catch(err => {
            console.error('Failed to fetch balances:', err);
          });
          dispatch(fetchExpenses(groupId)).catch(err => {
            console.error('Failed to fetch expenses:', err);
          });
        })
        .catch(err => {
          console.error('Failed to fetch group details:', err);
        });
    }
  }, [dispatch, groupId]);

  if (loading || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupExpenses = expensesByGroup[groupId] || [];
  const groupBalances = balances[groupId] || [];
  const settlements = simplifyDebts(groupBalances);

  const totalSpent = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const userBalance = groupBalances.find(b => b.user._id === user._id)?.amount || 0;

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await dispatch(deleteGroup(groupId)).unwrap();
        toast.success('Group deleted successfully');
        navigate('/groups');
      } catch (error) {
        console.error('Failed to delete group:', error);
        toast.error(error.message || 'Failed to delete group');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentGroup.name}</h1>
            <p className="text-gray-600 mt-1">{currentGroup.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch(openModal('addMember'))}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Member</span>
          </button>
          <button
            onClick={handleDeleteGroup}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalSpent, currentGroup.baseCurrency || currentGroup.currency)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {currentGroup.members?.length || 0}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Balance</p>
              <p className={`text-2xl font-bold mt-2 ${userBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {userBalance >= 0 ? '+' : ''}{formatCurrency(userBalance, currentGroup.baseCurrency || currentGroup.currency)}
              </p>
            </div>
            <div className={`${userBalance >= 0 ? 'bg-green-50' : 'bg-red-50'} p-3 rounded-lg`}>
              <TrendingUp className={`w-6 h-6 ${userBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
            <button
              onClick={() => dispatch(openModal('addExpense'))}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          
          {groupExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {groupExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        Paid by {expense.paidBy?.name} • {getRelativeTime(expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.splitBetween?.length || expense.splits?.length} people
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Balances & Settlements - 1/3 width */}
        <div className="space-y-6">
          {/* Members */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Members</h2>
              <button
                onClick={() => dispatch(openModal('addMember'))}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            
            {!currentGroup.members || currentGroup.members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No members added yet</p>
                <button
                  onClick={() => dispatch(openModal('addMember'))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Members
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentGroup.members.map((member) => (
                  <div key={member._id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {member.name}
                        {member._id === user._id && (
                          <span className="font-normal ml-1">(me)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settlements</h2>
            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">All settled up! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">{settlement.from.name}</span>
                      <span className="text-gray-600"> pays </span>
                      <span className="font-semibold">{settlement.to.name}</span>
                    </p>
                    <p className="text-lg font-bold text-yellow-700 mt-1">
                      {formatCurrency(settlement.amount, currentGroup.baseCurrency || currentGroup.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {settlements.length > 0 && (
              <button
                onClick={() => dispatch(openModal('settleUp'))}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Settle Up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
