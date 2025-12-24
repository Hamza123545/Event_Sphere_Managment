/**
 * Email Notification Service
 * Handles sending email notifications using Nodemailer
 * Implements T147
 */

import logger from '../utils/logger';

// Email configuration interface
interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
}

interface ApprovalEmailData {
  exhibitorEmail: string;
  exhibitorName: string;
  expoTitle: string;
  expoId: string;
}

interface RejectionEmailData {
  exhibitorEmail: string;
  exhibitorName: string;
  expoTitle: string;
  rejectionReason: string;
}

/**
 * Send approval email to exhibitor
 * Implements T147
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping approval email', {
        exhibitorEmail: data.exhibitorEmail,
        expoTitle: data.expoTitle,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    // For now, log the email that would be sent
    logger.info('Approval email would be sent', {
      to: data.exhibitorEmail,
      subject: `Your application for ${data.expoTitle} has been approved`,
      template: 'approval',
      data: {
        exhibitorName: data.exhibitorName,
        expoTitle: data.expoTitle,
        expoId: data.expoId,
      },
    });

    // Email template would include:
    // - Greeting with exhibitor name
    // - Approval confirmation
    // - Expo details
    // - Next steps (booth selection)
    // - Link to dashboard
  } catch (error) {
    logger.error('Error sending approval email:', error);
    throw error;
  }
}

/**
 * Send rejection email to exhibitor
 * Implements T147
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping rejection email', {
        exhibitorEmail: data.exhibitorEmail,
        expoTitle: data.expoTitle,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    // For now, log the email that would be sent
    logger.info('Rejection email would be sent', {
      to: data.exhibitorEmail,
      subject: `Update on your application for ${data.expoTitle}`,
      template: 'rejection',
      data: {
        exhibitorName: data.exhibitorName,
        expoTitle: data.expoTitle,
        rejectionReason: data.rejectionReason,
      },
    });

    // Email template would include:
    // - Greeting with exhibitor name
    // - Rejection notification
    // - Rejection reason
    // - Expo details
    // - Encouragement to apply for future events
  } catch (error) {
    logger.error('Error sending rejection email:', error);
    throw error;
  }
}

/**
 * Send session reminder email
 * Implements T197
 */
export async function sendSessionReminderEmail(
  recipientEmail: string,
  recipientName: string,
  sessionTitle: string,
  startTime: Date,
  location: string,
  expoTitle: string,
  minutesBefore: number
): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping session reminder email', {
        recipientEmail,
        sessionTitle,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    logger.info('Session reminder email would be sent', {
      to: recipientEmail,
      subject: `Reminder: ${sessionTitle} starts in ${minutesBefore} minutes`,
      template: 'session-reminder',
      data: {
        recipientName,
        sessionTitle,
        startTime,
        location,
        expoTitle,
        minutesBefore,
      },
    });
  } catch (error) {
    logger.error('Error sending session reminder email:', error);
  }
}

/**
 * Send schedule change email
 * Implements T198
 */
export async function sendScheduleChangeEmail(
  recipientEmail: string,
  recipientName: string,
  sessionTitle: string,
  oldSchedule: { startTime: Date; endTime: Date } | undefined,
  newSchedule: { startTime: Date; endTime: Date },
  oldLocation: { room: string; building?: string } | undefined,
  newLocation: { room: string; building?: string },
  expoTitle: string,
  reason?: string
): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping schedule change email', {
        recipientEmail,
        sessionTitle,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    logger.info('Schedule change email would be sent', {
      to: recipientEmail,
      subject: `Schedule Update: ${sessionTitle}`,
      template: 'schedule-change',
      data: {
        recipientName,
        sessionTitle,
        oldSchedule,
        newSchedule,
        oldLocation,
        newLocation,
        expoTitle,
        reason,
      },
    });
  } catch (error) {
    logger.error('Error sending schedule change email:', error);
  }
}

/**
 * Send expo update email
 * Implements T197
 */
export async function sendExpoUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  expoTitle: string,
  updateType: 'cancelled' | 'status-changed' | 'details-updated',
  updateDetails?: string
): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping expo update email', {
        recipientEmail,
        expoTitle,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    logger.info('Expo update email would be sent', {
      to: recipientEmail,
      subject: `Update: ${expoTitle}`,
      template: 'expo-update',
      data: {
        recipientName,
        expoTitle,
        updateType,
        updateDetails,
      },
    });
  } catch (error) {
    logger.error('Error sending expo update email:', error);
  }
}

/**
 * Send feedback confirmation email to submitter
 * Implements T214
 */
export async function sendFeedbackConfirmationEmail(
  recipientEmail: string,
  recipientName: string,
  feedbackId: string,
  subject: string,
  category: 'suggestion' | 'bug-report' | 'support-request'
): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping feedback confirmation email', {
        recipientEmail,
        feedbackId,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    logger.info('Feedback confirmation email would be sent', {
      to: recipientEmail,
      subject: `Feedback Received: ${subject}`,
      template: 'feedback-confirmation',
      data: {
        recipientName,
        feedbackId,
        subject,
        category,
      },
    });
  } catch (error) {
    logger.error('Error sending feedback confirmation email:', error);
  }
}

/**
 * Send feedback notification email to organizers/admins
 * Implements T214
 */
export async function sendFeedbackNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  feedbackId: string,
  subject: string,
  category: 'suggestion' | 'bug-report' | 'support-request',
  submitterName: string
): Promise<void> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
      logger.debug('Email service disabled, skipping feedback notification email', {
        recipientEmail,
        feedbackId,
      });
      return;
    }

    // TODO: Implement actual email sending with Nodemailer
    logger.info('Feedback notification email would be sent', {
      to: recipientEmail,
      subject: `New Feedback: ${subject}`,
      template: 'feedback-notification',
      data: {
        recipientName,
        feedbackId,
        subject,
        category,
        submitterName,
      },
    });
  } catch (error) {
    logger.error('Error sending feedback notification email:', error);
  }
}

