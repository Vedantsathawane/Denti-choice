import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
