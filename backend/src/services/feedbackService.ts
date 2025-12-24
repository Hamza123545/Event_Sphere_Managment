/**
 * Feedback Service
 * Handles feedback submission, queue management, and responses
 * Implements FR-037, FR-038, FR-039, T211, T214, T215
 */

import { FeedbackSubmission, IFeedbackSubmission } from '../models/FeedbackSubmission';
import { User } from '../models/User';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendFeedbackConfirmationEmail, sendFeedbackNotificationEmail } from './emailService';

export interface SubmitFeedbackInput {
  category: 'suggestion' | 'bug-report' | 'support-request';
  subject: string;
  message: string;
}

export interface FeedbackDetail {
  feedbackId: string;
  submitter: {
    userId: string;
    email: string;
    name: string;
  };
  category: 'suggestion' | 'bug-report' | 'support-request';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  assignedTo?: {
    userId: string;
    email: string;
    name: string;
  };
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Submit feedback
 * Implements T211, T214, T215
 */
export async function submitFeedback(
  userId: string,
  input: SubmitFeedbackInput
): Promise<FeedbackDetail> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    const feedback = new FeedbackSubmission({
      submitter: userId,
      category: input.category,
      subject: input.subject,
      message: input.message,
      status: 'pending',
    });

    await feedback.save();
    await feedback.populate('submitter', 'email profile.firstName profile.lastName');

    const submitter = feedback.submitter as any;
    const submitterName = `${submitter.profile?.firstName || ''} ${submitter.profile?.lastName || ''}`.trim() || submitter.email;

    // Send confirmation email to submitter (T214)
    try {
      await sendFeedbackConfirmationEmail(
        submitter.email,
        submitterName,
        feedback._id.toString(),
        input.subject,
        input.category
      );
    } catch (emailError) {
      logger.warn('Failed to send feedback confirmation email', {
        userId,
        feedbackId: feedback._id.toString(),
        error: emailError,
      });
      // Don't fail the submission if email fails
    }

    // Notify organizers/admins (T214)
    try {
      const organizers = await User.find({
        role: { $in: ['admin', 'organizer'] },
      }).select('email profile.firstName profile.lastName');

      for (const organizer of organizers) {
        const organizerName = `${organizer.profile?.firstName || ''} ${organizer.profile?.lastName || ''}`.trim() || organizer.email;
        await sendFeedbackNotificationEmail(
          organizer.email,
          organizerName,
          feedback._id.toString(),
          input.subject,
          input.category,
          submitterName
        );
      }
    } catch (emailError) {
      logger.warn('Failed to send feedback notification emails to organizers', {
        feedbackId: feedback._id.toString(),
        error: emailError,
      });
    }

    // Audit logging (T215)
    logger.info('Feedback submitted', {
      action: 'submit_feedback',
      feedbackId: feedback._id.toString(),
      userId,
      category: input.category,
      subject: input.subject,
      timestamp: new Date().toISOString(),
    });

    return formatFeedbackDetail(feedback);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in submitFeedback service:', error);
    throw new CustomError('Failed to submit feedback', 500, 'SUBMIT_FEEDBACK_ERROR');
  }
}

/**
 * Get feedback queue (for organizers/admins)
 * Implements T211, T215
 */
export async function getFeedbackQueue(
  userId: string,
  userRole: string,
  filters?: {
    status?: 'pending' | 'reviewed' | 'resolved' | 'closed';
    category?: 'suggestion' | 'bug-report' | 'support-request';
    assignedTo?: string;
  }
): Promise<FeedbackDetail[]> {
  try {
    // RBAC: Only admins and organizers can view feedback queue
    if (userRole !== 'admin' && userRole !== 'organizer') {
      throw new CustomError('Only admins and organizers can view feedback queue', 403, 'FORBIDDEN');
    }

    const query: any = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.category) {
      query.category = filters.category;
    }
    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    const feedbacks = await FeedbackSubmission.find(query)
      .populate('submitter', 'email profile.firstName profile.lastName')
      .populate('assignedTo', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    // Audit logging (T215)
    logger.info('Feedback queue accessed', {
      action: 'get_feedback_queue',
      userId,
      filters,
      count: feedbacks.length,
      timestamp: new Date().toISOString(),
    });

    return feedbacks.map(formatFeedbackDetail);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getFeedbackQueue service:', error);
    throw new CustomError('Failed to get feedback queue', 500, 'GET_FEEDBACK_QUEUE_ERROR');
  }
}

/**
 * Get user's own feedback submissions
 * Implements T211
 */
export async function getUserFeedback(userId: string): Promise<FeedbackDetail[]> {
  try {
    const feedbacks = await FeedbackSubmission.find({ submitter: userId })
      .populate('submitter', 'email profile.firstName profile.lastName')
      .populate('assignedTo', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    return feedbacks.map(formatFeedbackDetail);
  } catch (error) {
    logger.error('Error in getUserFeedback service:', error);
    throw new CustomError('Failed to get user feedback', 500, 'GET_USER_FEEDBACK_ERROR');
  }
}

/**
 * Update feedback status
 * Implements T211, T215
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  userId: string,
  userRole: string,
  status: 'pending' | 'reviewed' | 'resolved' | 'closed'
): Promise<FeedbackDetail> {
  try {
    // RBAC: Only admins and organizers can update feedback status
    if (userRole !== 'admin' && userRole !== 'organizer') {
      throw new CustomError('Only admins and organizers can update feedback status', 403, 'FORBIDDEN');
    }

    const feedback = await FeedbackSubmission.findById(feedbackId);
    if (!feedback) {
      throw new CustomError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
    }

    const oldStatus = feedback.status;
    feedback.status = status;
    await feedback.save();
    await feedback.populate('submitter', 'email profile.firstName profile.lastName');
    await feedback.populate('assignedTo', 'email profile.firstName profile.lastName');

    // Audit logging (T215)
    logger.info('Feedback status updated', {
      action: 'update_feedback_status',
      feedbackId: feedback._id.toString(),
      oldStatus,
      newStatus: status,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return formatFeedbackDetail(feedback);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateFeedbackStatus service:', error);
    throw new CustomError('Failed to update feedback status', 500, 'UPDATE_FEEDBACK_STATUS_ERROR');
  }
}

/**
 * Assign feedback to staff member
 * Implements T211, T215
 */
export async function assignFeedback(
  feedbackId: string,
  assignedToUserId: string,
  userId: string,
  userRole: string
): Promise<FeedbackDetail> {
  try {
    // RBAC: Only admins and organizers can assign feedback
    if (userRole !== 'admin' && userRole !== 'organizer') {
      throw new CustomError('Only admins and organizers can assign feedback', 403, 'FORBIDDEN');
    }

    // Verify assigned user exists and is staff
    const assignedUser = await User.findById(assignedToUserId);
    if (!assignedUser) {
      throw new CustomError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }
    if (assignedUser.role !== 'admin' && assignedUser.role !== 'organizer') {
      throw new CustomError('Can only assign feedback to admins or organizers', 400, 'VALIDATION_ERROR');
    }

    const feedback = await FeedbackSubmission.findById(feedbackId);
    if (!feedback) {
      throw new CustomError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
    }

    feedback.assignedTo = assignedToUserId;
    // Auto-update status to reviewed when assigned
    if (feedback.status === 'pending') {
      feedback.status = 'reviewed';
    }

    await feedback.save();
    await feedback.populate('submitter', 'email profile.firstName profile.lastName');
    await feedback.populate('assignedTo', 'email profile.firstName profile.lastName');

    // Audit logging (T215)
    logger.info('Feedback assigned', {
      action: 'assign_feedback',
      feedbackId: feedback._id.toString(),
      assignedTo: assignedToUserId,
      assignedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return formatFeedbackDetail(feedback);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in assignFeedback service:', error);
    throw new CustomError('Failed to assign feedback', 500, 'ASSIGN_FEEDBACK_ERROR');
  }
}

/**
 * Respond to feedback
 * Implements T211, T215
 */
export async function respondToFeedback(
  feedbackId: string,
  userId: string,
  userRole: string,
  response: string
): Promise<FeedbackDetail> {
  try {
    // RBAC: Only admins and organizers can respond to feedback
    if (userRole !== 'admin' && userRole !== 'organizer') {
      throw new CustomError('Only admins and organizers can respond to feedback', 403, 'FORBIDDEN');
    }

    const feedback = await FeedbackSubmission.findById(feedbackId);
    if (!feedback) {
      throw new CustomError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
    }

    feedback.response = response;
    feedback.status = 'resolved';
    await feedback.save();
    await feedback.populate('submitter', 'email profile.firstName profile.lastName');
    await feedback.populate('assignedTo', 'email profile.firstName profile.lastName');

    // Audit logging (T215)
    logger.info('Feedback response added', {
      action: 'respond_to_feedback',
      feedbackId: feedback._id.toString(),
      respondedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return formatFeedbackDetail(feedback);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in respondToFeedback service:', error);
    throw new CustomError('Failed to respond to feedback', 500, 'RESPOND_TO_FEEDBACK_ERROR');
  }
}

/**
 * Format feedback for API response
 */
function formatFeedbackDetail(feedback: IFeedbackSubmission & { submitter?: any; assignedTo?: any }): FeedbackDetail {
  const submitter = feedback.submitter as any;
  const assignedTo = feedback.assignedTo as any;

  return {
    feedbackId: feedback._id.toString(),
    submitter: {
      userId: submitter._id.toString(),
      email: submitter.email,
      name: `${submitter.profile?.firstName || ''} ${submitter.profile?.lastName || ''}`.trim() || submitter.email,
    },
    category: feedback.category,
    subject: feedback.subject,
    message: feedback.message,
    status: feedback.status,
    assignedTo: assignedTo
      ? {
          userId: assignedTo._id.toString(),
          email: assignedTo.email,
          name: `${assignedTo.profile?.firstName || ''} ${assignedTo.profile?.lastName || ''}`.trim() || assignedTo.email,
        }
      : undefined,
    response: feedback.response,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
  };
}

