import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  settleExpense: (groupId, settlementData) => api.post(`/groups/${groupId}/settle`, settlementData),
};

// Currency API
export const currencyAPI = {
  getExchangeRates: () => api.get('/currency/rates'),
  convertAmount: (amount, from, to) => api.get(`/currency/convert?amount=${amount}&from=${from}&to=${to}`),
};

export default api;
