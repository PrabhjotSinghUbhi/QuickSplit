import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchCurrentUser } from './store/slices/authSlice';
import { fetchGroups } from './store/slices/groupSlice';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import TempUserPage from './pages/TempUserPage';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import AllExpenses from './pages/AllExpenses';
import Settings from './pages/Settings';

// Modals
import CreateGroupModal from './components/CreateGroupModal';
import AddExpenseModal from './components/AddExpenseModal';
import AddMemberModal from './components/AddMemberModal';

import './index.css';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchGroups());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <div className="App">
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={12}
          toastOptions={{
            // Default options
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '500px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            // Success toast
            success: {
              duration: 3000,
              style: {
                background: '#d1fae5',
                color: '#065f46',
                border: '2px solid #34d399',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            // Error toast
            error: {
              duration: 4000,
              style: {
                background: '#fee2e2',
                color: '#7f1d1d',
                border: '2px solid #f87171',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            // Loading toast
            loading: {
              style: {
                background: '#dbeafe',
                color: '#1e3a8a',
                border: '2px solid #60a5fa',
              },
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:groupId" element={<GroupDetail />} />
            <Route path="expenses" element={<AllExpenses />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Modals */}
        <CreateGroupModal />
        <AddExpenseModal />
        <AddMemberModal />
      </div>
    </Router>
  );
}

export default App;
