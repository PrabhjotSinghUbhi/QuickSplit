import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Home, Users, Receipt, Settings, LogOut, ChevronLeft, Plus } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar, openModal } from '../store/slices/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { groups } = useSelector((state) => state.groups);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/expenses', icon: Receipt, label: 'All Expenses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">QS</span>
          </div>
          <span className="text-xl font-bold text-gray-800">QuickSplit</span>
        </div>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Groups Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Your Groups
            </span>
            <button
              onClick={() => dispatch(openModal('createGroup'))}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-500">No groups yet</p>
            ) : (
              groups.map((group) => (
                <NavLink
                  key={group._id}
                  to={`/groups/${group._id}`}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm truncate">{group.name}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
