import toast from 'react-hot-toast';

// Custom toast variants matching the design
export const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        background: '#d1fae5',
        color: '#065f46',
        border: '2px solid #34d399',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    });
  },

  info: (message) => {
    toast(message, {
      icon: '💡',
      style: {
        background: '#dbeafe',
        color: '#1e3a8a',
        border: '2px solid #60a5fa',
      },
    });
  },

  warning: (message) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#78350f',
        border: '2px solid #fbbf24',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      style: {
        background: '#fee2e2',
        color: '#7f1d1d',
        border: '2px solid #f87171',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: '#dbeafe',
        color: '#1e3a8a',
        border: '2px solid #60a5fa',
      },
    });
  },

  // Dismiss a specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;
