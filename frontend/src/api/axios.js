import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('toastkart_token');
  const activeStoreId = localStorage.getItem('toastkart_active_store_id');
  
  // Public GET endpoints that do not require auth and should avoid CORS preflight OPTIONS requests
  const isPublicGet = config.method === 'get' && (
    config.url.startsWith('/stores') || 
    config.url.startsWith('/products') || 
    config.url.startsWith('/categories') ||
    config.url.match(/^\/stores\/[a-zA-Z0-9-]+$/)
  );

  if (token && !isPublicGet) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeStoreId && !isPublicGet) {
    config.headers['X-Store-Id'] = activeStoreId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
