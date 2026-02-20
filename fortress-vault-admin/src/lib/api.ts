import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('admin_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ detail?: string; message?: string; error?: string }>) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      // Clear tokens and redirect to login
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      toast.error('Access forbidden. You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      toast.error('Resource not found.');
      return Promise.reject(error);
    }

    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          error.response.data?.error ||
                          'Invalid request. Please check your input.';
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection and try again.');
      return Promise.reject(error);
    }

    // Generic error handler
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.response?.data?.error ||
                        'An unexpected error occurred.';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api;
