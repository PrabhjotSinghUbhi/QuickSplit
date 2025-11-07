import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Receipt, Filter, Search, Calendar, UtensilsCrossed, Car, Film, ShoppingBag, Home, Zap, Heart, Plane, GraduationCap, Dumbbell, ArrowRightLeft, MoreHorizontal } from 'lucide-react';
import { fetchGroups } from '../store/slices/groupSlice';
import { setSelectedExpense } from '../store/slices/expenseSlice';
import { openModal } from '../store/slices/uiSlice';
import { formatCurrency, getRelativeTime } from '../utils/helpers';

// Category icon mapping
const categoryIcons = {
  'Food': UtensilsCrossed,
  'Transportation': Car,
  'Entertainment': Film,
  'Shopping': ShoppingBag,
  'Housing': Home,
  'Utilities': Zap,
  'Healthcare': Heart,
  'Travel': Plane,
  'Education': GraduationCap,
  'Fitness': Dumbbell,
  'Settlement': ArrowRightLeft,
  'Other': MoreHorizontal
};

const AllExpenses = () => {
  const dispatch = useDispatch();
  const { expensesByGroup } = useSelector((state) => state.expenses);
  const { groups } = useSelector((state) => state.groups);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  // Flatten all expenses
  const allExpenses = Object.values(expensesByGroup)
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleExpenseClick = (expense) => {
    dispatch(setSelectedExpense(expense));
    dispatch(openModal('expenseDetail'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
        <p className="text-gray-600 mt-1">View and manage all your expenses across groups</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {allExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
            <p className="text-gray-600">Start adding expenses to track your spending</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allExpenses.map((expense) => {
              const group = groups.find(g => g._id === expense.group);
              const category = expense.category || 'Other';
              const IconComponent = categoryIcons[category] || Receipt;
              
              return (
                <div
                  key={expense._id}
                  onClick={() => handleExpenseClick(expense)}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {expense.description}
                          </h3>
                          {group && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {group.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>Paid by {expense.paidBy?.name}</span>
                          <span>•</span>
                          <span>{getRelativeTime(expense.createdAt)}</span>
                          <span>•</span>
                          <span>{expense.splitBetween?.length || expense.splits?.length} people</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{expense.currency}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllExpenses;
