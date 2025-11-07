import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, UtensilsCrossed, Car, Film, ShoppingBag, Home, Zap, Heart, Plane, GraduationCap, Dumbbell, ArrowRightLeft, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { createExpense, fetchExpenses } from '../store/slices/expenseSlice';
import { closeModal } from '../store/slices/uiSlice';
import { expenseAPI } from '../services/api';

// Category icon mapping
const categoryIcons = {
  'UtensilsCrossed': UtensilsCrossed,
  'Car': Car,
  'Film': Film,
  'ShoppingBag': ShoppingBag,
  'Home': Home,
  'Zap': Zap,
  'Heart': Heart,
  'Plane': Plane,
  'GraduationCap': GraduationCap,
  'Dumbbell': Dumbbell,
  'ArrowRightLeft': ArrowRightLeft,
  'MoreHorizontal': MoreHorizontal
};

const AddExpenseModal = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state) => state.ui);
  const { groups, currentGroup } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);
  
  // Ensure groups is always an array
  const groupsList = Array.isArray(groups) ? groups : [];
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'INR',
    groupId: '',
    paidBy: '',
    splitType: 'equal',
    category: 'Other',
    splits: [],
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [error, setError] = useState('');
  const categoryDropdownRef = useRef(null);

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await expenseAPI.getCategories();
        setCategories(response.data.payload || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories if fetch fails
        setCategories([
          'Food',
          'Transportation',
          'Entertainment',
          'Shopping',
          'Housing',
          'Utilities',
          'Healthcare',
          'Travel',
          'Education',
          'Fitness',
          'Other'
        ]);
      }
    };
    
    if (modals.addExpense) {
      fetchCategories();
    }
  }, [modals.addExpense]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modals.addExpense) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modals.addExpense]);

  useEffect(() => {
    if (currentGroup) {
      setFormData((prev) => ({
        ...prev,
        groupId: currentGroup._id,
        currency: currentGroup.baseCurrency || 'INR',
        paidBy: user._id,
        splits: currentGroup.members?.map((member) => ({
          user: member._id,
          amount: 0,
          userName: member.name,
        })) || [],
      }));
    }
  }, [currentGroup, user]);

  useEffect(() => {
    if (formData.splitType === 'equal' && formData.amount && formData.splits.length > 0) {
      const splitAmount = (parseFloat(formData.amount) / formData.splits.length).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        splits: prev.splits.map((split) => ({
          ...split,
          amount: parseFloat(splitAmount),
        })),
      }));
    }
  }, [formData.amount, formData.splitType, formData.splits.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if no groups exist
    if (groupsList.length === 0) {
      setError('Please create a group first before adding expenses');
      return;
    }
    
    // Check if no group is selected
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }

    // Validate amount is greater than 0
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0');
      toast.error('Amount must be greater than 0');
      return;
    }

    // Validate custom split amounts add up to total
    if (formData.splitType === 'custom') {
      const totalSplit = formData.splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
      const difference = Math.abs(totalSplit - amount);
      
      if (difference > 0.01) { // Allow for small floating point differences
        setError(`Split amounts must add up to ${amount.toFixed(2)}. Current total: ${totalSplit.toFixed(2)}`);
        toast.error(`Split amounts must equal total amount`);
        return;
      }
    }
    
    setLoading(true);
    try {
      // Build splitBetween array (all users in the split)
      const splitBetween = formData.splits.map(split => split.user);
      
      // Build splitDetails for custom splits
      const splitDetails = formData.splitType === 'custom' 
        ? formData.splits.map(split => ({
            userId: split.user,
            amount: split.amount
          }))
        : undefined;

      await dispatch(
        createExpense({
          groupId: formData.groupId,
          expenseData: {
            description: formData.description,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
            paidBy: formData.paidBy,
            splitBetween: splitBetween,
            splitType: formData.splitType,
            splitDetails: splitDetails,
            category: formData.category,
          },
        })
      ).unwrap();
      
      // Refresh expenses list if on group detail page
      if (currentGroup && currentGroup._id === formData.groupId) {
        await dispatch(fetchExpenses(formData.groupId));
      }
      
      toast.success('Expense created successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to create expense:', error);
      setError(error.message || 'Failed to create expense. Please try again.');
      toast.error(error.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      amount: '',
      currency: 'INR',
      groupId: '',
      paidBy: '',
      splitType: 'equal',
      category: 'Other',
      splits: [],
    });
    setError('');
    dispatch(closeModal('addExpense'));
  };

  const handleSplitAmountChange = (userId, amount) => {
    // Allow empty string for editing, but convert to 0 if empty
    const numAmount = amount === '' ? 0 : parseFloat(amount);
    
    setFormData((prev) => ({
      ...prev,
      splits: prev.splits.map((split) =>
        split.user === userId ? { ...split, amount: numAmount } : split
      ),
    }));
  };

  const selectedGroup = groupsList.find((g) => g._id === formData.groupId);

  if (!modals.addExpense) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Expense</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* No Groups Warning */}
        {groupsList.length === 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-3 rounded-lg">
            <p className="font-medium">No groups available</p>
            <p className="text-sm mt-1">Please create a group first before adding expenses.</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group *
            </label>
            <select
              required
              value={formData.groupId}
              onChange={(e) => {
                const group = groupsList.find((g) => g._id === e.target.value);
                setFormData({
                  ...formData,
                  groupId: e.target.value,
                  currency: group?.baseCurrency || 'INR',
                  paidBy: user._id,
                  splits: group?.members?.map((member) => ({
                    user: member._id,
                    amount: 0,
                    userName: member.name,
                  })) || [],
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a group</option>
              {groupsList.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid By *
            </label>
            <select
              required
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {selectedGroup?.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span>{formData.category}</span>
                </div>
              </button>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {(() => {
                  const selectedCategory = categories.find(cat => 
                    (typeof cat === 'string' ? cat : cat.name) === formData.category
                  );
                  const iconName = typeof selectedCategory === 'object' ? selectedCategory.icon : 'MoreHorizontal';
                  const IconComponent = categoryIcons[iconName] || MoreHorizontal;
                  return <IconComponent className="w-4 h-4 text-gray-500" />;
                })()}
              </div>
              
              {/* Custom Dropdown */}
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {categories.map((category) => {
                    const categoryName = typeof category === 'string' ? category : category.name;
                    const iconName = typeof category === 'object' ? category.icon : 'MoreHorizontal';
                    const IconComponent = categoryIcons[iconName] || MoreHorizontal;
                    
                    return (
                      <button
                        key={categoryName}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: categoryName });
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                          formData.category === categoryName ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span>{categoryName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={formData.splitType === 'equal'}
                  onChange={(e) => setFormData({ ...formData, splitType: e.target.value })}
                  className="mr-2"
                />
                <span>Equal Split</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={formData.splitType === 'custom'}
                  onChange={(e) => setFormData({ ...formData, splitType: e.target.value })}
                  className="mr-2"
                />
                <span>Custom Split</span>
              </label>
            </div>
          </div>

          {/* Split Details */}
          {formData.splits.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Details
                {formData.splitType === 'custom' && formData.amount && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Remaining: {(parseFloat(formData.amount) - formData.splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0)).toFixed(2)} / Total: {parseFloat(formData.amount).toFixed(2)})
                  </span>
                )}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.splits.map((split) => (
                  <div key={split.user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{split.userName}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={split.amount}
                      onChange={(e) => handleSplitAmountChange(split.user, e.target.value)}
                      disabled={formData.splitType === 'equal'}
                      className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.groupId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default AddExpenseModal;
