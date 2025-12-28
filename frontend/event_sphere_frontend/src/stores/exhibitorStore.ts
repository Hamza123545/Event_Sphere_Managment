/**
 * Exhibitor Zustand Store
 * Manages exhibitor state, profiles, booth, floor plan, and real-time updates
 * Per User Story 2 requirements
 */

import { create } from 'zustand';
import type {
  ExhibitorProfile,
  FloorPlan,
  BoothDetails,
  RegisterForExpoRequest,
  UpdateProfileRequest,
  UpdateBoothDetailsRequest,
  BoothAllocatedEvent,
  BoothReleasedEvent,
  ExpoSummary,
} from '../types/exhibitor';
import type { ExhibitorApprovedEvent, ExhibitorRejectedEvent } from '../types/approval';
import * as exhibitorApi from '../services/exhibitorApi';
import { joinExpoRoom, leaveExpoRoom, getSocket, onSocketEvent, offSocketEvent, joinExhibitorRoom } from '../services/socket';

interface ExhibitorState {
  // State
  profiles: ExhibitorProfile[];
  selectedProfile: ExhibitorProfile | null;
  availableExpos: ExpoSummary[];
  floorPlan: FloorPlan | null;
  selectedBooth: BoothDetails | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  browseExpos: (options?: { status?: 'upcoming' | 'active'; category?: string }) => Promise<void>;
  registerForExpo: (expoId: string, data: RegisterForExpoRequest) => Promise<ExhibitorProfile>;
  getProfiles: () => Promise<void>;
  getProfile: (profileId: string) => Promise<void>;
  updateProfile: (profileId: string, data: UpdateProfileRequest) => Promise<void>;
  viewFloorPlan: (expoId: string) => Promise<void>;
  reserveBooth: (expoId: string, boothId: string, profileId: string) => Promise<void>;
  getAssignedBooth: (profileId: string) => Promise<void>;
  updateBoothDetails: (profileId: string, data: UpdateBoothDetailsRequest) => Promise<void>;
  setSelectedProfile: (profile: ExhibitorProfile | null) => void;
  setSelectedBooth: (booth: BoothDetails | null) => void;
  clearError: () => void;
  subscribeToBoothUpdates: (expoId: string) => void;
  unsubscribeFromBoothUpdates: (expoId: string) => void;
  subscribeToApprovalUpdates: (userId: string) => void;
  unsubscribeFromApprovalUpdates: () => void;
  approvalNotification: { type: 'approved' | 'rejected'; message: string; expoTitle: string; reason?: string } | null;
  clearApprovalNotification: () => void;
}

export const useExhibitorStore = create<ExhibitorState>((set) => ({
  // Initial state
  profiles: [],
  selectedProfile: null,
  availableExpos: [],
  floorPlan: null,
  selectedBooth: null,
  isLoading: false,
  error: null,
  approvalNotification: null,

  // Browse available expos
  browseExpos: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const response = await exhibitorApi.browseExpos(options);
      set({ availableExpos: response.expos, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load expos',
        isLoading: false,
      });
    }
  },

  // Register for expo
  registerForExpo: async (expoId, data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await exhibitorApi.registerForExpo(expoId, data);
      set((state) => ({
        profiles: [profile, ...state.profiles],
        isLoading: false,
      }));
      return profile;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to register for expo';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get all profiles
  getProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await exhibitorApi.getProfiles();
      set({ profiles: profiles || [], isLoading: false, error: null });
    } catch (error: any) {
      // Handle 404 gracefully - new users may not have profiles yet
      // Also handle cases where API returns empty array or null
      if (error.response?.status === 404 || error.response?.status === 200) {
        set({ profiles: [], isLoading: false, error: null });
      } else if (error.response?.status === 401) {
        // Don't set error for 401 - let the API interceptor handle it
        set({ isLoading: false });
        throw error;
      } else {
        // Only set error for unexpected errors, not for "no data" scenarios
        const errorMessage = error.response?.data?.message || 'Failed to load profiles';
        if (!errorMessage.includes('not found') && !errorMessage.includes('NOT_FOUND')) {
          set({
            error: errorMessage,
            isLoading: false,
          });
        } else {
          set({ profiles: [], isLoading: false, error: null });
        }
      }
    }
  },

  // Get single profile
  getProfile: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await exhibitorApi.getProfile(profileId);
      set({ selectedProfile: profile, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  // Update profile
  updateProfile: async (profileId, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await exhibitorApi.updateProfile(profileId, data);
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.profileId === profileId ? updatedProfile : p
        ),
        selectedProfile:
          state.selectedProfile?.profileId === profileId
            ? updatedProfile
            : state.selectedProfile,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // View floor plan
  viewFloorPlan: async (expoId) => {
    set({ isLoading: true, error: null });
    try {
      const floorPlan = await exhibitorApi.viewFloorPlan(expoId);
      set({ floorPlan, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load floor plan',
        isLoading: false,
      });
    }
  },

  // Reserve booth
  reserveBooth: async (expoId, boothId, profileId) => {
    set({ isLoading: true, error: null });
    try {
      const booth = await exhibitorApi.reserveBooth(expoId, boothId, profileId);
      
      // Update floor plan if available
      set((state) => {
        if (!state.floorPlan || state.floorPlan.expoId !== expoId) {
          return { selectedBooth: booth, isLoading: false };
        }

        const updatedBooths = state.floorPlan.booths.map((b) =>
          b.boothId === boothId ? booth : b
        );
        
        const updatedFloorPlan = {
          ...state.floorPlan,
          booths: updatedBooths,
          metadata: {
            ...state.floorPlan.metadata,
            availableBooths: updatedBooths.filter((b) => b.status === 'available').length,
          },
        };

        // Update profile if it's the selected one
        const updatedProfiles = state.profiles.map((p) =>
          p.profileId === profileId ? { ...p, booth } : p
        );

        return {
          floorPlan: updatedFloorPlan,
          selectedBooth: booth,
          profiles: updatedProfiles,
          selectedProfile:
            state.selectedProfile?.profileId === profileId
              ? { ...state.selectedProfile, booth }
              : state.selectedProfile,
          isLoading: false,
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reserve booth';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get assigned booth
  getAssignedBooth: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const booth = await exhibitorApi.getAssignedBooth(profileId);
      set({ selectedBooth: booth, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load booth',
        isLoading: false,
      });
    }
  },

  // Update booth details
  updateBoothDetails: async (profileId, data) => {
    set({ isLoading: true, error: null });
    try {
      await exhibitorApi.updateBoothDetails(profileId, data);
      
      // Update booth in state
      set((state) => ({
        selectedBooth: state.selectedBooth
          ? { ...state.selectedBooth, ...data }
          : null,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update booth details';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Set selected profile
  setSelectedProfile: (profile) => {
    set({ selectedProfile: profile });
  },

  // Set selected booth
  setSelectedBooth: (booth) => {
    set({ selectedBooth: booth });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Subscribe to real-time booth updates
  subscribeToBoothUpdates: (expoId) => {
    // Join expo room
    joinExpoRoom(expoId);

    // Handle booth-allocated event
      const handleBoothAllocated = (data: unknown) => {
      const event = data as BoothAllocatedEvent;
      if (event.expoId === expoId) {
        set((state) => {
          if (!state.floorPlan || state.floorPlan.expoId !== expoId) {
            return {};
          }

          const updatedBooths = state.floorPlan.booths.map((b) =>
            b.boothId === event.boothId
              ? { ...b, status: 'reserved' as const, exhibitor: { profileId: event.profileId, companyName: '' } }
              : b
          );

          return {
            floorPlan: {
              ...state.floorPlan,
              booths: updatedBooths,
              metadata: {
                ...state.floorPlan.metadata,
                availableBooths: updatedBooths.filter((b) => b.status === 'available').length,
              },
            },
          };
        });
      }
    };

    // Handle booth-released event
    const handleBoothReleased = (data: unknown) => {
      const event = data as BoothReleasedEvent;
      if (event.expoId === expoId) {
        set((state) => {
          if (!state.floorPlan || state.floorPlan.expoId !== expoId) {
            return {};
          }

          const updatedBooths = state.floorPlan.booths.map((b) =>
            b.boothId === event.boothId
              ? { ...b, status: 'available' as const, exhibitor: undefined }
              : b
          );

          return {
            floorPlan: {
              ...state.floorPlan,
              booths: updatedBooths,
              metadata: {
                ...state.floorPlan.metadata,
                availableBooths: updatedBooths.filter((b) => b.status === 'available').length,
              },
            },
          };
        });
      }
    };

    // Subscribe to events
    onSocketEvent('booth-allocated', handleBoothAllocated);
    onSocketEvent('booth-released', handleBoothReleased);

    // Store handlers for cleanup
    const socket = getSocket();
    if (socket) {
      (socket as any)._boothAllocatedHandler = handleBoothAllocated;
      (socket as any)._boothReleasedHandler = handleBoothReleased;
    }
  },

  // Unsubscribe from booth updates
  unsubscribeFromBoothUpdates: (expoId) => {
    leaveExpoRoom(expoId);

    // Remove event listeners
    const socket = getSocket();
    if (socket) {
      const allocatedHandler = (socket as any)._boothAllocatedHandler;
      const releasedHandler = (socket as any)._boothReleasedHandler;
      
      if (allocatedHandler) {
        offSocketEvent('booth-allocated', allocatedHandler);
        delete (socket as any)._boothAllocatedHandler;
      }
      
      if (releasedHandler) {
        offSocketEvent('booth-released', releasedHandler);
        delete (socket as any)._boothReleasedHandler;
      }
    }
  },

  // Subscribe to approval/rejection updates (T158)
  subscribeToApprovalUpdates: (userId: string) => {
    // Join exhibitor-specific room
    joinExhibitorRoom(userId);

    // Handle exhibitor-approved event
    const handleApproved = (data: unknown) => {
      const event = data as ExhibitorApprovedEvent;
      set((state) => {
        // Update profile status if it exists in the store
        const updatedProfiles = state.profiles.map((profile) =>
          profile.profileId === event.profileId || profile.profileId === event.exhibitorProfileId
            ? { ...profile, registrationStatus: 'approved' as const }
            : profile
        );

        // Update selected profile if it matches
        const updatedSelectedProfile =
          state.selectedProfile?.profileId === event.profileId ||
          state.selectedProfile?.profileId === event.exhibitorProfileId
            ? { ...state.selectedProfile, registrationStatus: 'approved' as const }
            : state.selectedProfile;

        // Set notification for UI display
        return {
          profiles: updatedProfiles,
          selectedProfile: updatedSelectedProfile,
          approvalNotification: {
            type: 'approved',
            message: `Your application for ${event.expoTitle} has been approved!`,
            expoTitle: event.expoTitle,
          },
        };
      });
    };

    // Handle exhibitor-rejected event
    const handleRejected = (data: unknown) => {
      const event = data as ExhibitorRejectedEvent;
      set((state) => {
        // Update profile status if it exists in the store
        const updatedProfiles = state.profiles.map((profile) =>
          profile.profileId === event.profileId || profile.profileId === event.exhibitorProfileId
            ? {
                ...profile,
                registrationStatus: 'rejected' as const,
                rejectionReason: event.reason,
              }
            : profile
        );

        // Update selected profile if it matches
        const updatedSelectedProfile =
          state.selectedProfile?.profileId === event.profileId ||
          state.selectedProfile?.profileId === event.exhibitorProfileId
            ? {
                ...state.selectedProfile,
                registrationStatus: 'rejected' as const,
                rejectionReason: event.reason,
              }
            : state.selectedProfile;

        // Set notification for UI display
        return {
          profiles: updatedProfiles,
          selectedProfile: updatedSelectedProfile,
          approvalNotification: {
            type: 'rejected',
            message: `Your application for ${event.expoTitle} has been rejected.`,
            expoTitle: event.expoTitle,
            reason: event.reason,
          },
        };
      });
    };

    // Subscribe to events
    onSocketEvent('exhibitor-approved', handleApproved);
    onSocketEvent('exhibitor-rejected', handleRejected);

    // Store handlers for cleanup
    const socket = getSocket();
    if (socket) {
      (socket as any)._approvalApprovedHandler = handleApproved;
      (socket as any)._approvalRejectedHandler = handleRejected;
    }
  },

  // Unsubscribe from approval updates
  unsubscribeFromApprovalUpdates: () => {
    // Get user ID from auth store or current user
    // For now, we'll leave the room using a general approach
    // The leaveExhibitorRoom should be called with userId, but we'll handle cleanup here
    const socket = getSocket();
    if (socket) {
      const approvedHandler = (socket as any)._approvalApprovedHandler;
      const rejectedHandler = (socket as any)._approvalRejectedHandler;

      if (approvedHandler) {
        offSocketEvent('exhibitor-approved', approvedHandler);
        delete (socket as any)._approvalApprovedHandler;
      }

      if (rejectedHandler) {
        offSocketEvent('exhibitor-rejected', rejectedHandler);
        delete (socket as any)._approvalRejectedHandler;
      }
    }
  },

  // Clear approval notification
  clearApprovalNotification: () => {
    set({ approvalNotification: null });
  },
}));

