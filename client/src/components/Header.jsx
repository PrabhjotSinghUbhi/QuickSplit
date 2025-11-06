import { useSelector, useDispatch } from 'react-redux';
import { Menu, Bell, Plus } from 'lucide-react';
import { toggleSidebar, openModal } from '../store/slices/uiSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { notifications } = useSelector((state) => state.ui);
  const { groups } = useSelector((state) => state.groups);
  
  const hasGroups = groups && groups.length > 0;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {!sidebarOpen && (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome to QuickSplit
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Add Expense Button */}
          <button
            onClick={() => dispatch(openModal('addExpense'))}
            disabled={!hasGroups}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasGroups ? 'Create a group first' : 'Add Expense'}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Expense</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
