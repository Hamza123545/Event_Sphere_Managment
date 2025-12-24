/**
 * Floor Plan Store
 * Zustand store for floor plan management with real-time updates
 */

import { create } from 'zustand';
import * as floorPlanApi from '../services/floorPlanApi';
import { subscribeToExpoUpdates, leaveExpoRoom } from '../services/socket';
import type { FloorPlanDetail, CreateFloorPlanRequest, CreateBoothSpaceRequest, AssignBoothRequest, BoothSpace } from '../types/floorPlan';

interface FloorPlanState {
  // State
  floorPlan: FloorPlanDetail | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  getFloorPlan: (expoId: string) => Promise<void>;
  createFloorPlan: (expoId: string, request: CreateFloorPlanRequest) => Promise<void>;
  addBoothSpace: (expoId: string, request: CreateBoothSpaceRequest) => Promise<void>;
  assignExhibitorToBooth: (expoId: string, boothId: string, request: AssignBoothRequest) => Promise<void>;
  updateMetadata: () => void;
  clearError: () => void;
  subscribeToBoothUpdates: (expoId: string) => void;
  unsubscribeFromBoothUpdates: (expoId: string) => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  // Initial state
  floorPlan: null,
  isLoading: false,
  error: null,

  // Calculate metadata on booth changes
  updateMetadata: () => {
    const floorPlan = get().floorPlan;
    if (floorPlan) {
      const totalBooths = floorPlan.booths.length;
      const availableBooths = floorPlan.booths.filter((b) => b.status === 'available').length;
      set({
        floorPlan: {
          ...floorPlan,
          metadata: {
            ...floorPlan.metadata,
            totalBooths,
            availableBooths,
          },
        },
      });
    }
  },

  // Get floor plan
  getFloorPlan: async (expoId) => {
    set({ isLoading: true, error: null });
    try {
      const floorPlan = await floorPlanApi.getFloorPlan(expoId);
      set({ floorPlan, isLoading: false });
      
      // Update metadata
      get().updateMetadata();
      
      // Subscribe to real-time updates
      get().subscribeToBoothUpdates(expoId);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to get floor plan',
        isLoading: false,
      });
    }
  },

  // Create floor plan
  createFloorPlan: async (expoId, request) => {
    set({ isLoading: true, error: null });
    try {
      await floorPlanApi.createFloorPlan(expoId, request);
      // Refresh floor plan detail
      await get().getFloorPlan(expoId);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to create floor plan',
        isLoading: false,
      });
      throw error;
    }
  },

  // Add booth space
  addBoothSpace: async (expoId, request) => {
    set({ isLoading: true, error: null });
    try {
      await floorPlanApi.addBoothSpace(expoId, request);
      // Refresh floor plan to show new booth
      await get().getFloorPlan(expoId);
      // Update metadata
      get().updateMetadata();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to add booth space',
        isLoading: false,
      });
      throw error;
    }
  },

  // Assign exhibitor to booth
  assignExhibitorToBooth: async (expoId, boothId, request) => {
    set({ isLoading: true, error: null });
    try {
      await floorPlanApi.assignExhibitorToBooth(expoId, boothId, request);
      // Refresh floor plan to show updated booth status
      await get().getFloorPlan(expoId);
      // Update metadata
      get().updateMetadata();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to assign exhibitor to booth',
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Subscribe to real-time booth updates
  subscribeToBoothUpdates: (expoId) => {
    subscribeToExpoUpdates(expoId, {
      onBoothAllocated: (event: any) => {
        // Update booth in floor plan
        const floorPlan = get().floorPlan;
        if (floorPlan) {
          const booths = floorPlan.booths.map((booth) => {
            if (booth.boothId === event.booth.boothId) {
              return {
                ...booth,
                status: event.booth.status as BoothSpace['status'],
                exhibitor: event.booth.exhibitor,
              };
            }
            return booth;
          });
          set({ floorPlan: { ...floorPlan, booths } });
          // Update metadata after real-time update
          setTimeout(() => get().updateMetadata(), 0);
        }
      },
      onBoothReleased: (event: any) => {
        // Update booth in floor plan
        const floorPlan = get().floorPlan;
        if (floorPlan) {
          const booths = floorPlan.booths.map((booth) => {
            if (booth.boothId === event.boothId) {
              return {
                ...booth,
                status: 'available' as const,
                exhibitor: undefined,
              };
            }
            return booth;
          });
          set({ floorPlan: { ...floorPlan, booths } });
          // Update metadata after real-time update
          setTimeout(() => get().updateMetadata(), 0);
        }
      },
    });
  },

  // Unsubscribe from booth updates
  unsubscribeFromBoothUpdates: (expoId) => {
    leaveExpoRoom(expoId);
  },
}));

