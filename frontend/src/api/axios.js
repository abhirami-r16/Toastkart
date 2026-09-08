import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('toastkart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeStoreId = localStorage.getItem('toastkart_active_store_id');
  if (activeStoreId) {
    config.headers['X-Store-Id'] = activeStoreId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
