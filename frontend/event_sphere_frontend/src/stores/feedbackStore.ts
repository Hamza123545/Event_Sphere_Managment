/**
 * Feedback Store
 * Manages feedback submissions and queue
 * Implements T216
 */

import { create } from 'zustand';
import type { FeedbackSubmission, SubmitFeedbackRequest } from '../types/feedback';
import * as feedbackApi from '../services/feedbackApi';
import { parseApiError } from '../utils/errorHandler';

interface FeedbackState {
  // User's own feedback submissions
  myFeedback: FeedbackSubmission[];
  
  // Feedback queue (for organizers/admins)
  feedbackQueue: FeedbackSubmission[];
  
  isLoading: boolean;
  error: string | null;

  // Actions
  submitFeedback: (data: SubmitFeedbackRequest) => Promise<FeedbackSubmission>;
  getMyFeedback: () => Promise<void>;
  getFeedbackQueue: (filters?: {
    status?: 'pending' | 'reviewed' | 'resolved' | 'closed';
    category?: 'suggestion' | 'bug-report' | 'support-request';
    assignedTo?: string;
  }) => Promise<void>;
  updateFeedbackStatus: (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved' | 'closed') => Promise<void>;
  assignFeedback: (feedbackId: string, assignedTo: string) => Promise<void>;
  respondToFeedback: (feedbackId: string, response: string) => Promise<void>;
  clearError: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  myFeedback: [],
  feedbackQueue: [],
  isLoading: false,
  error: null,

  submitFeedback: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const feedback = await feedbackApi.submitFeedback(data);
      // Add to my feedback list
      set((state) => ({
        myFeedback: [feedback, ...state.myFeedback],
        isLoading: false,
      }));
      return feedback;
    } catch (error) {
      const errorMessage = parseApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getMyFeedback: async () => {
    set({ isLoading: true, error: null });
    try {
      const feedback = await feedbackApi.getFeedback();
      set({ myFeedback: feedback, isLoading: false });
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false });
    }
  },

  getFeedbackQueue: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const queue = await feedbackApi.getFeedback(filters);
      set({ feedbackQueue: queue, isLoading: false });
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false });
    }
  },

  updateFeedbackStatus: async (feedbackId, status) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await feedbackApi.updateFeedbackStatus(feedbackId, { status });
      // Update in queue
      set((state) => ({
        feedbackQueue: state.feedbackQueue.map((f) =>
          f.feedbackId === feedbackId ? updated : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false });
      throw error;
    }
  },

  assignFeedback: async (feedbackId, assignedTo) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await feedbackApi.assignFeedback(feedbackId, { assignedTo });
      // Update in queue
      set((state) => ({
        feedbackQueue: state.feedbackQueue.map((f) =>
          f.feedbackId === feedbackId ? updated : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false });
      throw error;
    }
  },

  respondToFeedback: async (feedbackId, response) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await feedbackApi.respondToFeedback(feedbackId, { response });
      // Update in queue
      set((state) => ({
        feedbackQueue: state.feedbackQueue.map((f) =>
          f.feedbackId === feedbackId ? updated : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

