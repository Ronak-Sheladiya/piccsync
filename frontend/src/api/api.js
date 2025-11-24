import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
console.log('🔍 API_BASE_URL:', API_BASE_URL);
console.log('🔍 Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  MODE: import.meta.env.MODE
});

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('supabase_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;