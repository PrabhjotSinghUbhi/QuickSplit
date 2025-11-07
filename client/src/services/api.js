import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login/register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  checkUserExists: (email) => api.get('/auth/check', { params: { email } }),
};

// Group API
export const groupAPI = {
  getGroups: () => api.get('/groups'),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  createGroup: (groupData) => api.post('/groups', groupData),
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
  addMember: (groupId, memberData) => api.post(`/groups/${groupId}/members`, memberData),
  removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
  getBalances: (groupId) => api.get(`/groups/${groupId}/balances`),
};

// Expense API
export const expenseAPI = {
  getExpenses: (groupId) => api.get(`/groups/${groupId}/expenses`),
  getExpenseById: (expenseId) => api.get(`/expenses/${expenseId}`),
  createExpense: (groupId, expenseData) => api.post(`/groups/${groupId}/expenses`, expenseData),
  updateExpense: (expenseId, expenseData) => api.put(`/expenses/${expenseId}`, expenseData),
  deleteExpense: (expenseId) => api.delete(`/expenses/${expenseId}`),
  getCategories: () => api.get('/expenses/categories'),
};

// Currency API
export const currencyAPI = {
  getExchangeRates: () => api.get('/currency/rates'),
  convertAmount: (amount, from, to) => api.get(`/currency/convert?amount=${amount}&from=${from}&to=${to}`),
};

// Chat API
export const chatAPI = {
  getMessages: (roomId, limit = 50, skip = 0) => api.get(`/chat/${roomId}?limit=${limit}&skip=${skip}`),
  sendMessage: (messageData) => api.post('/chat/send', messageData),
  markAsRead: (roomId) => api.put(`/chat/${roomId}/read`),
  getUnreadCount: (roomId) => api.get(`/chat/${roomId}/unread`),
};

export default api;
