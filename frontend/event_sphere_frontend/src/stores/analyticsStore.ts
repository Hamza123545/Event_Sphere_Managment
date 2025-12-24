/**
 * Analytics Zustand Store
 * Manages analytics data and operations
 * Implements T184
 */

import { create } from 'zustand';
import * as analyticsApi from '../services/analyticsApi';
import type { Analytics } from '../types/analytics';

interface AnalyticsState {
  // State
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  getAnalytics: (expoId: string, metricType?: string) => Promise<void>;
  exportAnalytics: (expoId: string, format: 'pdf' | 'csv' | 'json') => Promise<void>;
  clearError: () => void;
  clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Initial state
  analytics: null,
  isLoading: false,
  error: null,

  // Get analytics
  getAnalytics: async (expoId, metricType) => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await analyticsApi.getAnalytics(expoId, metricType);
      set({ analytics, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load analytics',
        isLoading: false,
      });
    }
  },

  // Export analytics
  exportAnalytics: async (expoId, format) => {
    set({ isLoading: true, error: null });
    try {
      const blob = await analyticsApi.exportAnalytics(expoId, format);

      // Create download link
      const url = format === 'json'
        ? `data:application/json;charset=utf-8,${encodeURIComponent(blob as string)}`
        : window.URL.createObjectURL(blob as Blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${expoId}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (format !== 'json') {
        window.URL.revokeObjectURL(url);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to export analytics',
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear analytics
  clearAnalytics: () => {
    set({ analytics: null });
  },
}));

