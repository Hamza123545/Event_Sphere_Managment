/**
 * Attendee Store
 * Zustand store for attendee state management with real-time updates
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as attendeeApi from '../services/attendeeApi';
import { subscribeToExpoUpdates as subscribeExpo, unsubscribeFromExpoUpdates } from '../services/socket';
import type {
  ExpoDetail,
  SessionDetail,
  PersonalScheduleItem,
  ExhibitorSearchResult,
  ScheduleChangedEvent,
  SessionDeletedEvent,
} from '../types/attendee';
import type { ExpoSummary } from '../types/expo';

interface AttendeeState {
  // Expo data
  expos: ExpoSummary[];
  selectedExpo: ExpoDetail | null;
  isLoading: boolean;
  error: string | null;

  // Sessions
  sessions: SessionDetail[];
  selectedSession: SessionDetail | null;

  // Personal schedule
  personalSchedule: PersonalScheduleItem[];

  // Exhibitors
  exhibitors: ExhibitorSearchResult[];
  selectedExhibitor: ExhibitorSearchResult | null;

  // Floor plan
  floorPlan: any | null;

  // Actions
  browseExpos: (params?: {
    status?: 'upcoming' | 'active';
    category?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<void>;
  getExpoDetails: (expoId: string) => Promise<void>;
  registerForExpo: (expoId: string, preferences?: { interests?: string[]; dietaryRestrictions?: string[] }) => Promise<void>;
  getSchedule: (expoId: string, params?: { category?: string; topic?: string; date?: string }) => Promise<void>;
  bookmarkSession: (expoId: string, sessionId: string, reminderPreferences?: any) => Promise<void>;
  removeBookmark: (expoId: string, sessionId: string) => Promise<void>;
  getPersonalSchedule: () => Promise<void>;
  searchExhibitors: (expoId: string, params?: { category?: string; productKeyword?: string; companyName?: string }) => Promise<void>;
  getExhibitorProfile: (expoId: string, exhibitorId: string) => Promise<void>;
  viewFloorPlan: (expoId: string) => Promise<void>;
  clearError: () => void;
  subscribeToScheduleUpdates: (expoId: string) => void;
  unsubscribeFromScheduleUpdates: (expoId: string) => void;
}

export const useAttendeeStore = create<AttendeeState>()(
  persist(
    (set, get) => ({
      // Initial state
      expos: [],
      selectedExpo: null,
      isLoading: false,
      error: null,
      sessions: [],
      selectedSession: null,
      personalSchedule: [],
      exhibitors: [],
      selectedExhibitor: null,
      floorPlan: null,

      // Browse expos
      browseExpos: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await attendeeApi.browseExpos(params);
          set({ expos: Array.isArray(response.expos) ? response.expos : [], isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to browse expos',
            isLoading: false,
          });
        }
      },

      // Get expo details
      getExpoDetails: async (expoId) => {
        set({ isLoading: true, error: null });
        try {
          const expo = await attendeeApi.getExpoDetails(expoId);
          set({ selectedExpo: expo, isLoading: false });
          
          // Subscribe to real-time updates for this expo
          get().subscribeToScheduleUpdates(expoId);
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to get expo details',
            isLoading: false,
          });
        }
      },

      // Register for expo
      registerForExpo: async (expoId, preferences) => {
        set({ isLoading: true, error: null });
        try {
          await attendeeApi.registerForExpo(expoId, { preferences });
          // Refresh expo details to show registration status
          await get().getExpoDetails(expoId);
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to register for expo',
            isLoading: false,
          });
        }
      },

      // Get schedule
      getSchedule: async (expoId, params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await attendeeApi.getSchedule(expoId, params);
          set({ sessions: response.sessions, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to get schedule',
            isLoading: false,
          });
        }
      },

      // Bookmark session
      bookmarkSession: async (expoId, sessionId, reminderPreferences) => {
        set({ isLoading: true, error: null });
        try {
          const result = await attendeeApi.bookmarkSession(expoId, sessionId, { reminderPreferences });
          // Update session in list
          const sessions = get().sessions.map((s) =>
            s.sessionId === sessionId ? { ...result.session, isBookmarked: true } : s
          );
          set({ sessions, isLoading: false });
          
          // Refresh personal schedule
          await get().getPersonalSchedule();
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to bookmark session',
            isLoading: false,
          });
        }
      },

      // Remove bookmark
      removeBookmark: async (expoId, sessionId) => {
        set({ isLoading: true, error: null });
        try {
          await attendeeApi.removeBookmark(expoId, sessionId);
          // Update session in list
          const sessions = get().sessions.map((s) =>
            s.sessionId === sessionId ? { ...s, isBookmarked: false } : s
          );
          set({ sessions, isLoading: false });
          
          // Refresh personal schedule
          await get().getPersonalSchedule();
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to remove bookmark',
            isLoading: false,
          });
        }
      },

      // Get personal schedule
      getPersonalSchedule: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await attendeeApi.getPersonalSchedule();
          set({ personalSchedule: response.schedule, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to get personal schedule',
            isLoading: false,
          });
        }
      },

      // Search exhibitors
      searchExhibitors: async (expoId, params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await attendeeApi.searchExhibitors(expoId, params);
          set({ exhibitors: response.exhibitors, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to search exhibitors',
            isLoading: false,
          });
        }
      },

      // Get exhibitor profile
      getExhibitorProfile: async (expoId, exhibitorId) => {
        set({ isLoading: true, error: null });
        try {
          const exhibitor = await attendeeApi.getExhibitorProfile(expoId, exhibitorId);
          set({ selectedExhibitor: exhibitor, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to get exhibitor profile',
            isLoading: false,
          });
        }
      },

      // View floor plan
      viewFloorPlan: async (expoId) => {
        set({ isLoading: true, error: null });
        try {
          const floorPlan = await attendeeApi.viewFloorPlan(expoId);
          set({ floorPlan, isLoading: false });
        } catch (error: any) {
          // If floor plan doesn't exist (404), that's okay - just set it to null
          if (error.response?.status === 404 || error.response?.data?.errorCode === 'FLOOR_PLAN_NOT_FOUND') {
            set({ floorPlan: null, isLoading: false });
          } else {
            set({
              error: error.response?.data?.message || error.message || 'Failed to view floor plan',
              isLoading: false,
            });
          }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Subscribe to real-time schedule updates
      subscribeToScheduleUpdates: (expoId) => {
        subscribeExpo(expoId, {
          onScheduleChanged: (event: ScheduleChangedEvent) => {
            // Update session in list if it exists
            const sessions = get().sessions.map((s) => {
              if (s.sessionId === event.session.sessionId) {
                return {
                  ...s,
                  schedule: {
                    startTime: event.session.schedule.startTime,
                    endTime: event.session.schedule.endTime,
                    duration: event.session.schedule.duration,
                  },
                  location: event.session.location,
                  currentAttendees: event.session.currentAttendees,
                  capacity: event.session.capacity,
                };
              }
              return s;
            });
            set({ sessions });
            
            // Refresh personal schedule if user has bookmarked this session
            const hasBookmark = get().personalSchedule.some(
              (item) => item.sessionId === event.session.sessionId
            );
            if (hasBookmark) {
              get().getPersonalSchedule();
            }
          },
          onSessionDeleted: (event: SessionDeletedEvent) => {
            // Remove session from list
            const sessions = get().sessions.filter((s) => s.sessionId !== event.sessionId);
            set({ sessions });
            
            // Refresh personal schedule
            get().getPersonalSchedule();
          },
        });
      },

      // Unsubscribe from schedule updates
      unsubscribeFromScheduleUpdates: (expoId) => {
        unsubscribeFromExpoUpdates(expoId);
      },
    }),
    {
      name: 'attendee-storage',
      partialize: (state) => ({
        // Only persist selected expo and personal schedule
        selectedExpo: state.selectedExpo,
        personalSchedule: state.personalSchedule,
      }),
    }
  )
);

