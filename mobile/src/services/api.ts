import axios from 'axios';

// Fallback to localhost or local network IP during Android Emulator/iOS Simulator debugging
const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost alias

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Statically hold the token in-memory or load from Secure Store MMKV mock
let userToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userToken = token;
};

api.interceptors.request.use(
  async (config) => {
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    console.warn('[Mobile API Error]:', message);
    return Promise.reject(error);
  }
);

export default api;
