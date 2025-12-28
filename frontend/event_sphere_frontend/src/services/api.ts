import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Axios API client with interceptors
 * Implements constitutional requirements for secure communication and error handling
 * Base URL from environment, JWT token injection, error handling
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://hamza057-eventsphere-backend.hf.space/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Inject JWT token from localStorage
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle errors globally
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Suppress console errors for expected 404s (like missing floor plans)
    // These are handled gracefully in the UI
    if (error.response?.status === 404) {
      const errorCode = (error.response.data as any)?.errorCode;
      // Only suppress expected "not found" errors, not route 404s
      if (errorCode === 'FLOOR_PLAN_NOT_FOUND' || errorCode === 'EXPO_NOT_FOUND') {
        // Don't log these to console - they're expected conditions
        return Promise.reject(error);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

