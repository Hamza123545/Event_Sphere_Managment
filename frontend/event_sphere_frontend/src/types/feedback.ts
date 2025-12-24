/**
 * Feedback Types
 * Per data-model.md
 * Implements T217
 */

export type FeedbackCategory = 'suggestion' | 'bug-report' | 'support-request';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'closed';

export interface FeedbackSubmission {
  feedbackId: string;
  submitter: {
    userId: string;
    email: string;
    name: string;
  };
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  assignedTo?: {
    userId: string;
    email: string;
    name: string;
  };
  response?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface SubmitFeedbackRequest {
  category: FeedbackCategory;
  subject: string;
  message: string;
}

export interface UpdateFeedbackStatusRequest {
  status: FeedbackStatus;
}

export interface AssignFeedbackRequest {
  assignedTo: string;
}

export interface RespondToFeedbackRequest {
  response: string;
}

export interface GetFeedbackResponse {
  success: boolean;
  data: FeedbackSubmission[];
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  data: FeedbackSubmission;
}

