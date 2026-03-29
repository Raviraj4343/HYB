import axios from 'axios';

const normalizeApiPrefix = (value?: string) => {
  if (!value) return value;
  return value.replace(/(\/api\/v1)(\/api\/v1)+/g, '$1');
};

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return normalizeApiPrefix(configuredUrl);
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.error('VITE_API_URL is not configured for this deployment. Falling back to localhost API.');
  }

  return 'http://localhost:8000/api/v1';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    if (config.baseURL) {
      config.baseURL = normalizeApiPrefix(config.baseURL);
    }

    if (typeof config.url === 'string') {
      const normalizedUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url;
      config.url = normalizeApiPrefix(normalizedUrl);
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    // Extract error message
    const errorMessage = response?.data?.message || 
                         response?.data?.error || 
                         error.message || 
                         'Something went wrong';
    
    // Return rejected promise with formatted error
    return Promise.reject({
      status: response?.status,
      message: errorMessage,
      data: response?.data,
    });
  }
);

export default api;

// Helper functions for common operations
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
