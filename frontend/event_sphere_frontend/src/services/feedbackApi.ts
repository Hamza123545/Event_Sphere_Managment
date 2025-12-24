/**
 * Feedback API Service
 * API calls for feedback submission and management
 * Implements T218
 */

import api from './api';
import type {
  FeedbackSubmission,
  SubmitFeedbackRequest,
  UpdateFeedbackStatusRequest,
  AssignFeedbackRequest,
  RespondToFeedbackRequest,
  GetFeedbackResponse,
  SubmitFeedbackResponse,
} from '../types/feedback';

/**
 * Submit feedback
 */
export async function submitFeedback(data: SubmitFeedbackRequest): Promise<FeedbackSubmission> {
  const response = await api.post<SubmitFeedbackResponse>('/feedback', data);
  return response.data.data;
}

/**
 * Get feedback queue (for organizers/admins) or user's own feedback
 */
export async function getFeedback(filters?: {
  status?: 'pending' | 'reviewed' | 'resolved' | 'closed';
  category?: 'suggestion' | 'bug-report' | 'support-request';
  assignedTo?: string;
}): Promise<FeedbackSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

  const response = await api.get<GetFeedbackResponse>(
    `/feedback${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.data;
}

/**
 * Get single feedback detail
 */
export async function getFeedbackById(feedbackId: string): Promise<FeedbackSubmission> {
  const response = await api.get<{ success: boolean; data: FeedbackSubmission }>(
    `/feedback/${feedbackId}`
  );
  return response.data.data;
}

/**
 * Update feedback status (organizers/admins only)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  data: UpdateFeedbackStatusRequest
): Promise<FeedbackSubmission> {
  const response = await api.put<{ success: boolean; data: FeedbackSubmission }>(
    `/feedback/${feedbackId}/status`,
    data
  );
  return response.data.data;
}

/**
 * Assign feedback to staff member (organizers/admins only)
 */
export async function assignFeedback(
  feedbackId: string,
  data: AssignFeedbackRequest
): Promise<FeedbackSubmission> {
  const response = await api.post<{ success: boolean; data: FeedbackSubmission }>(
    `/feedback/${feedbackId}/assign`,
    data
  );
  return response.data.data;
}

/**
 * Respond to feedback (organizers/admins only)
 */
export async function respondToFeedback(
  feedbackId: string,
  data: RespondToFeedbackRequest
): Promise<FeedbackSubmission> {
  const response = await api.post<{ success: boolean; data: FeedbackSubmission }>(
    `/feedback/${feedbackId}/respond`,
    data
  );
  return response.data.data;
}

