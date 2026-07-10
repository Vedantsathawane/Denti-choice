import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: (() => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const url = new URL(envUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = window.location.hostname;
      }
      return url.toString();
    } catch (e) {
      return envUrl;
    }
  })(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore canceled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      // Only redirect on auth failure for protected routes
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.', { toastId: 'rate-limit-error' });
    }

    if (!error.response) {
      toast.error('Network error. Please check your connection.', { toastId: 'network-error' });
    }

    return Promise.reject(error);
  }
);

export const toastError = (message, error) => {
  if (error && (!error.response || error.response.status === 401 || error.response.status === 429 || axios.isCancel(error))) {
    return;
  }
  toast.error(message);
};

export default api;
