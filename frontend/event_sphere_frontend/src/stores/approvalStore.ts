/**
 * Approval Zustand Store
 * Manages exhibitor application approval/rejection state
 * Implements T153
 */

import { create } from 'zustand';
import * as approvalApi from '../services/approvalApi';
import type { ExhibitorApplication } from '../types/approval';

interface ApprovalState {
  // State
  applications: ExhibitorApplication[];
  pendingApplications: ExhibitorApplication[];
  approvedApplications: ExhibitorApplication[];
  rejectedApplications: ExhibitorApplication[];
  isLoading: boolean;
  error: string | null;

  // Actions
  listApplications: (expoId: string, status?: 'pending' | 'approved' | 'rejected') => Promise<void>;
  approveExhibitor: (expoId: string, exhibitorId: string) => Promise<void>;
  rejectExhibitor: (expoId: string, exhibitorId: string, reason: string) => Promise<void>;
  clearError: () => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  // Initial state
  applications: [],
  pendingApplications: [],
  approvedApplications: [],
  rejectedApplications: [],
  isLoading: false,
  error: null,

  // List applications
  listApplications: async (expoId, status) => {
    set({ isLoading: true, error: null });
    try {
      const applications = await approvalApi.listApplications(expoId, status);
      set({
        applications,
        pendingApplications: applications.filter((app) => app.registrationStatus === 'pending'),
        approvedApplications: applications.filter((app) => app.registrationStatus === 'approved'),
        rejectedApplications: applications.filter((app) => app.registrationStatus === 'rejected'),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load applications',
        isLoading: false,
      });
    }
  },

  // Approve exhibitor
  approveExhibitor: async (expoId, exhibitorId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedApplication = await approvalApi.approveExhibitor(expoId, exhibitorId);
      set((state) => {
        const updatedApplications = state.applications.map((app) =>
          app.profileId === exhibitorId ? updatedApplication : app
        );
        return {
          applications: updatedApplications,
          pendingApplications: updatedApplications.filter((app) => app.registrationStatus === 'pending'),
          approvedApplications: updatedApplications.filter((app) => app.registrationStatus === 'approved'),
          rejectedApplications: updatedApplications.filter((app) => app.registrationStatus === 'rejected'),
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to approve exhibitor',
        isLoading: false,
      });
      throw error;
    }
  },

  // Reject exhibitor
  rejectExhibitor: async (expoId, exhibitorId, reason) => {
    set({ isLoading: true, error: null });
    try {
      const updatedApplication = await approvalApi.rejectExhibitor(expoId, exhibitorId, { reason });
      set((state) => {
        const updatedApplications = state.applications.map((app) =>
          app.profileId === exhibitorId ? updatedApplication : app
        );
        return {
          applications: updatedApplications,
          pendingApplications: updatedApplications.filter((app) => app.registrationStatus === 'pending'),
          approvedApplications: updatedApplications.filter((app) => app.registrationStatus === 'approved'),
          rejectedApplications: updatedApplications.filter((app) => app.registrationStatus === 'rejected'),
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reject exhibitor',
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

