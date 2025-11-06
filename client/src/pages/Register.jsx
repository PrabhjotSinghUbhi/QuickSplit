import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register, clearError } from '../store/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');
  const [validationField, setValidationField] = useState('');

  // Clear errors when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      dispatch(clearError());
      setValidationError('');
      setValidationField('');
    };
  }, [dispatch]);

  // Determine which field the error belongs to
  const getFieldError = (fieldName) => {
    // Check validation errors first
    if (validationError && validationField === fieldName) {
      return validationError;
    }
    
    // Check API errors
    if (!error) return null;
    
    const errorLower = error.toLowerCase();
    
    if (fieldName === 'name') {
      if (errorLower.includes('name')) {
        return error;
      }
    }
    
    if (fieldName === 'email') {
      if (errorLower.includes('email') || errorLower.includes('already exists') || errorLower.includes('already registered')) {
        return error;
      }
    }
    
    if (fieldName === 'password') {
      if (errorLower.includes('password') && !errorLower.includes('confirm')) {
        return error;
      }
    }
    
    return null;
  };

  // Check if error is generic (not field-specific)
  const isGenericError = () => {
    if (validationError && !validationField) return true;
    if (!error) return false;
    return !getFieldError('name') && !getFieldError('email') && !getFieldError('password');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setValidationField('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      setValidationField('password');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      setValidationField('password');
      return;
    }

    try {
      await dispatch(register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })).unwrap();
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      // Toast for error is shown via field-specific errors in UI
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-cyan-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-linear-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-cyan-500/20">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-teal-500 via-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
            <span className="text-white font-bold text-2xl">QS</span>
          </div>
          <h2 className="text-3xl font-extrabold bg-linear-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Start managing your shared expenses today
          </p>
        </div>

        {/* Generic Error Messages (only if not field-specific) */}
        {isGenericError() && (
          <div className="bg-linear-to-r from-red-900/20 to-red-800/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
            {error || validationError}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  getFieldError('name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                } bg-gray-700/50 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:bg-gray-700 transition-all`}
                placeholder="John Doe"
              />
              {getFieldError('name') && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <span className="mr-1">⚠</span> {getFieldError('name')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  getFieldError('email') ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                } bg-gray-700/50 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:bg-gray-700 transition-all`}
                placeholder="you@example.com"
              />
              {getFieldError('email') && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <span className="mr-1">⚠</span> {getFieldError('email')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  getFieldError('password') ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                } bg-gray-700/50 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:bg-gray-700 transition-all`}
                placeholder="••••••••"
              />
              {getFieldError('password') && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <span className="mr-1">⚠</span> {getFieldError('password')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700/50 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-gray-700 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-teal-500 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
              I agree to the{' '}
              <a href="#" className="text-cyan-400 hover:text-teal-400">
                Terms and Conditions
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-cyan-500/30 text-sm font-medium text-white bg-linear-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-600 hover:via-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-cyan-400 hover:text-teal-400">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
