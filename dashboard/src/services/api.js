import axios from 'axios';

const API_URL = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solarbot_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || 'An unknown error occurred',
    };
    return Promise.reject(customError);
  }
);

// Auth methods
const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

// Wallet methods
const getWallets = async () => {
  const response = await api.get('/api/wallets');
  return response.data;
};

const addWallet = async (walletData) => {
  const response = await api.post('/api/wallets', walletData);
  return response.data;
};

const renameWallet = async (walletId, name) => {
  const response = await api.put(`/api/wallets/${walletId}`, { name });
  return response.data;
};

const deleteWallet = async (walletId) => {
  const response = await api.delete(`/api/wallets/${walletId}`);
  return response.data;
};

const setDefaultWallet = async (walletId) => {
  const response = await api.put(`/api/wallets/${walletId}/default`);
  return response.data;
};

const refreshWalletBalance = async (walletId) => {
  const response = await api.get(`/api/wallets/${walletId}/refresh`);
  return response.data;
};

// Trading methods
const getOpportunities = async (filters = {}) => {
  const response = await api.get('/api/opportunities', { params: filters });
  return response.data;
};

const executeTrade = async (opportunity, simulationMode = true) => {
  const response = await api.post('/api/execute-trade', { opportunity, simulationMode });
  return response.data;
};

const getRecentTrades = async (limit = 10) => {
  const response = await api.get('/api/trades/recent', { params: { limit } });
  return response.data;
};

// Dashboard data
const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

const getPerformanceHistory = async (period = '7d') => {
  const response = await api.get('/api/dashboard/performance', { params: { period } });
  return response.data;
};

// Token methods
const getTokens = async () => {
  const response = await api.get('/api/tokens');
  return response.data;
};

const getTokenPairs = async () => {
  const response = await api.get('/api/token-pairs');
  return response.data;
};

// Settings
const getSettings = async () => {
  const response = await api.get('/api/settings');
  return response.data;
};

const updateSettings = async (settings) => {
  const response = await api.put('/api/settings', settings);
  return response.data;
};

// API key management
const generateApiKey = async (userId, tier, name) => {
  const response = await api.post('/api/generate-key', { userId, tier, name });
  return response.data;
};

// Health check
const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

const apiService = {
  login,
  getWallets,
  addWallet,
  renameWallet,
  deleteWallet,
  setDefaultWallet,
  refreshWalletBalance,
  getOpportunities,
  executeTrade,
  getRecentTrades,
  getDashboardStats,
  getPerformanceHistory,
  getTokens,
  getTokenPairs,
  getSettings,
  updateSettings,
  generateApiKey,
  checkHealth
};

export default apiService;
