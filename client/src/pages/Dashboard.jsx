import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TrendingUp, Users, Receipt, DollarSign } from 'lucide-react';
import { fetchGroups } from '../store/slices/groupSlice';
import { formatCurrency, getRelativeTime } from '../utils/helpers';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { groups } = useSelector((state) => state.groups);
  const { expensesByGroup } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  // Calculate statistics
  const totalGroups = groups.length;
  const totalExpenses = Object.values(expensesByGroup).flat().length;
  
  const totalOwed = groups.reduce((sum, group) => {
    const balance = group.balances?.find(b => b.user === user._id)?.amount || 0;
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);

  const totalOwedTo = groups.reduce((sum, group) => {
    const balance = group.balances?.find(b => b.user === user._id)?.amount || 0;
    return balance > 0 ? sum + balance : sum;
  }, 0);

  // Recent expenses
  const recentExpenses = Object.values(expensesByGroup)
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Groups',
      value: totalGroups,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: Receipt,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'You Owe',
      value: formatCurrency(totalOwed),
      icon: TrendingUp,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'You Are Owed',
      value: formatCurrency(totalOwedTo),
      icon: DollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.name}! Here's an overview of your expenses.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Groups */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Groups</h2>
            <Link
              to="/groups"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No groups yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a group to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 5).map((group) => (
                <Link
                  key={group._id}
                  to={`/groups/${group._id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{group.name}</p>
                      <p className="text-sm text-gray-500">
                        {group.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">
                      {group.currency || 'USD'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            <Link
              to="/expenses"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No expenses yet</p>
              <p className="text-sm text-gray-400 mt-1">Add an expense to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {getRelativeTime(expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                    <p className="text-xs text-gray-500">{expense.paidBy?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-linear-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg p-4 text-left backdrop-blur-sm">
            <Users className="w-8 h-8 mb-2" />
            <p className="font-semibold">Create Group</p>
            <p className="text-sm opacity-90 mt-1">Start a new expense group</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg p-4 text-left backdrop-blur-sm">
            <Receipt className="w-8 h-8 mb-2" />
            <p className="font-semibold">Add Expense</p>
            <p className="text-sm opacity-90 mt-1">Record a new expense</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg p-4 text-left backdrop-blur-sm">
            <DollarSign className="w-8 h-8 mb-2" />
            <p className="font-semibold">Settle Up</p>
            <p className="text-sm opacity-90 mt-1">Pay your balances</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
