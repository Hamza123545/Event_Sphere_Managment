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
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Clear auth store state (non-blocking)
      import('../stores/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      }).catch(() => {
        // Store might not be available, that's okay
      });
      
      // Only redirect if not already on login/register page
      // Use a simple check to avoid redirect loops and conflicts with React Router
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || 
                         currentPath === '/register' || 
                         currentPath.startsWith('/login') || 
                         currentPath.startsWith('/register') ||
                         currentPath === '/forgot-password' ||
                         currentPath.startsWith('/reset-password');
      
      if (!isAuthPage) {
        // Use window.location.href for reliable redirect
        // This works correctly with React Router on Vercel
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 404 errors gracefully
    // Suppress console errors for expected 404s (like missing floor plans, resources)
    if (error.response?.status === 404) {
      const errorCode = (error.response.data as any)?.errorCode;
      // Suppress expected "not found" errors - these are handled gracefully in the UI
      const expected404Codes = [
        'FLOOR_PLAN_NOT_FOUND',
        'EXPO_NOT_FOUND',
        'NOT_FOUND',
        'RESOURCE_NOT_FOUND',
        'PROFILE_NOT_FOUND',
        'BOOTH_NOT_FOUND',
      ];
      
      if (errorCode && expected404Codes.includes(errorCode)) {
        // Don't log these to console - they're expected conditions
        // Return the error so components can handle it appropriately
        return Promise.reject(error);
      }
      
      // For route 404s (actual page not found), log but don't redirect
      // The route handler will show 404 page
      console.warn('404 Not Found:', error.response.data);
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

