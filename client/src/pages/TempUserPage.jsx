import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Mail, AtSign, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const TempUserPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-linear-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-linear-to-br from-teal-500 via-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50 animate-pulse">
            <span className="text-white font-bold text-3xl">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-white via-cyan-200 to-teal-200 bg-clip-text text-transparent mb-2">
            Welcome to QuickSplit!
          </h1>
          <p className="text-gray-400">
            Your account details
          </p>
        </div>

        {/* User Information Cards */}
        <div className="space-y-4 mb-8">
          {/* Full Name */}
          <div className="bg-linear-to-r from-gray-700/50 to-teal-900/30 rounded-xl p-4 border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Full Name</p>
                <p className="text-lg font-semibold text-white">
                  {user?.name || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-linear-to-r from-gray-700/50 to-cyan-900/30 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Email</p>
                <p className="text-lg font-semibold text-white break-all">
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="bg-linear-to-r from-gray-700/50 to-teal-900/30 rounded-xl p-4 border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                <AtSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Username</p>
                <p className="text-lg font-semibold text-white">
                  {user?.username || user?.email?.split('@')[0] || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-linear-to-r from-teal-500 via-cyan-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:via-cyan-600 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg shadow-cyan-500/30 transform hover:scale-[1.02]"
          >
            Continue to Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-3 border border-red-600 bg-linear-to-r from-red-900/20 to-red-800/20 text-red-400 rounded-lg hover:from-red-900/40 hover:to-red-800/40 transition-all duration-300 font-medium flex items-center justify-center space-x-2 transform hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Debug Info (Optional - can be removed) */}
        {user && (
          <div className="mt-6 p-4 bg-linear-to-r from-gray-900/50 to-gray-800/50 border border-cyan-500/20 rounded-lg">
            <p className="text-xs text-cyan-400 mb-2 font-semibold">
              Debug Info (User Object):
            </p>
            <pre className="text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempUserPage;
