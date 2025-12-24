/**
 * Expo Zustand Store
 * Manages expo state, CRUD operations, and real-time updates
 * Per User Story 1 requirements
 */

import { create } from 'zustand';
import type {
  ExpoSummary,
  ExpoDetail,
  CreateExpoRequest,
  UpdateExpoRequest,
  ExpoUpdatedEvent,
} from '../types/expo';
import * as expoApi from '../services/expoApi';
import { joinExpoRoom, leaveExpoRoom, getSocket } from '../services/socket';

interface ExpoState {
  // State
  expos: ExpoSummary[];
  selectedExpo: ExpoDetail | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;

  // Actions
  listExpos: (options?: { status?: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'; page?: number; limit?: number }) => Promise<void>;
  getExpo: (expoId: string) => Promise<void>;
  createExpo: (data: CreateExpoRequest) => Promise<ExpoDetail>;
  updateExpo: (expoId: string, data: UpdateExpoRequest) => Promise<void>;
  deleteExpo: (expoId: string) => Promise<void>;
  setSelectedExpo: (expo: ExpoDetail | null) => void;
  clearError: () => void;
  subscribeToExpoUpdates: (expoId: string) => void;
  unsubscribeFromExpoUpdates: (expoId: string) => void;
}

export const useExpoStore = create<ExpoState>((set) => ({
  // Initial state
  expos: [],
  selectedExpo: null,
  isLoading: false,
  error: null,
  pagination: null,

  // List expos
  listExpos: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expoApi.listExpos(options);
      set({
        expos: response.expos,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load expos',
        isLoading: false,
      });
    }
  },

  // Get expo by ID
  getExpo: async (expoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const expo = await expoApi.getExpo(expoId);
      set({ selectedExpo: expo, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load expo',
        isLoading: false,
      });
    }
  },

  // Create expo
  createExpo: async (data: CreateExpoRequest) => {
    set({ isLoading: true, error: null });
    try {
      const expo = await expoApi.createExpo(data);
      // Add to expos list
      set((state) => ({
        expos: [expo as ExpoSummary, ...state.expos],
        isLoading: false,
      }));
      return expo;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create expo';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update expo
  updateExpo: async (expoId: string, data: UpdateExpoRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedExpo = await expoApi.updateExpo(expoId, data);
      
      // Update in expos list
      set((state) => ({
        expos: state.expos.map((expo) =>
          expo.expoId === expoId ? (updatedExpo as ExpoSummary) : expo
        ),
        selectedExpo: state.selectedExpo?.expoId === expoId ? updatedExpo : state.selectedExpo,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update expo';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete expo
  deleteExpo: async (expoId: string) => {
    set({ isLoading: true, error: null });
    try {
      await expoApi.deleteExpo(expoId);
      
      // Remove from expos list
      set((state) => ({
        expos: state.expos.filter((expo) => expo.expoId !== expoId),
        selectedExpo: state.selectedExpo?.expoId === expoId ? null : state.selectedExpo,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete expo';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Set selected expo
  setSelectedExpo: (expo: ExpoDetail | null) => {
    set({ selectedExpo: expo });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Subscribe to expo updates (real-time) (T137)
  subscribeToExpoUpdates: (expoId: string) => {
    // Join expo room for real-time updates
    joinExpoRoom(expoId);

    const socketInstance = getSocket();
    if (!socketInstance) return;

    // Listen for expo-updated event
    const handleExpoUpdated = (data: ExpoUpdatedEvent) => {
      if (data.expoId === expoId) {
        set((state) => {
          // Update selected expo if it matches
          if (state.selectedExpo?.expoId === expoId) {
            return {
              selectedExpo: {
                ...state.selectedExpo,
                ...data.expo,
                expoId: data.expoId,
              } as ExpoDetail,
            };
          }
          
          // Update in expos list
          const updatedExpos = state.expos.map((expo) => {
            if (expo.expoId === expoId) {
              return {
                ...expo,
                ...data.expo,
                expoId: data.expoId,
              } as ExpoSummary;
            }
            return expo;
          });

          return { expos: updatedExpos };
        });
      }
    };

    // Listen for schedule-changed event (T137)
    const handleScheduleChanged = (data: any) => {
      if (data.expoId === expoId) {
        // Schedule updates are handled by attendeeStore, but we can log it here
        console.log('Schedule changed for expo:', expoId);
      }
    };

    // Listen for session-deleted event (T137)
    const handleSessionDeleted = (data: any) => {
      if (data.expoId === expoId) {
        // Session deletion updates are handled by attendeeStore
        console.log('Session deleted for expo:', expoId, data.sessionId);
      }
    };

    socketInstance.on('expo-updated', handleExpoUpdated as any);
    socketInstance.on('schedule-changed', handleScheduleChanged);
    socketInstance.on('session-deleted', handleSessionDeleted);

    // Store handlers for cleanup
    (socketInstance as any)._expoUpdateHandlers = {
      expoUpdated: handleExpoUpdated,
      scheduleChanged: handleScheduleChanged,
      sessionDeleted: handleSessionDeleted,
    };
  },

  // Unsubscribe from expo updates
  unsubscribeFromExpoUpdates: (expoId: string) => {
    leaveExpoRoom(expoId);
    
    // Remove event listeners (T137)
    const socketInstance = getSocket();
    if (socketInstance) {
      const handlers = (socketInstance as any)._expoUpdateHandlers;
      if (handlers) {
        socketInstance.off('expo-updated', handlers.expoUpdated);
        socketInstance.off('schedule-changed', handlers.scheduleChanged);
        socketInstance.off('session-deleted', handlers.sessionDeleted);
        delete (socketInstance as any)._expoUpdateHandlers;
      }
    }
  },
}));

