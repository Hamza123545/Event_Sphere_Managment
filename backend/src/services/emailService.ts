/**
 * Email Notification Service
 * Handles sending email notifications using Nodemailer
 * Implements T147
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger';

/**
 * Get email transporter based on environment configuration
 */
function getEmailTransporter() {
  // Check if email is enabled
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    return null;
  }

  // Get email configuration from environment
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const emailSecure = process.env.EMAIL_SECURE === 'true';
  const emailUser = process.env.EMAIL_USER || process.env.EMAIL_FROM || 'i.t@deenseed.com';
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || emailUser;
  const emailFromName = process.env.EMAIL_FROM_NAME || 'EventSphere';

  if (!emailHost || !emailUser || !emailPassword) {
    logger.warn('Email configuration incomplete. Email sending disabled.', {
      hasHost: !!emailHost,
      hasUser: !!emailUser,
      hasPassword: !!emailPassword,
    });
    return null;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  return { transporter, from: emailFrom, fromName: emailFromName };
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
 * Send password reset email
 * Implements FR-004
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string,
  resetToken: string
): Promise<void> {
  try {
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping password reset email', {
        recipientEmail,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://eventsphere.edvo.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: 'Reset Your EventSphere Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${recipientName || 'User'},</p>
            <p>We received a request to reset your password for your EventSphere account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #8b5cf6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #8b5cf6;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${recipientName || 'User'},
        
        We received a request to reset your password for your EventSphere account.
        
        Click this link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        
        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent successfully', {
      to: recipientEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    // Don't throw error to prevent revealing email issues to user
    throw error;
  }
}

/**
 * Send approval email to exhibitor
 * Implements T147
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<void> {
  try {
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping approval email', {
        exhibitorEmail: data.exhibitorEmail,
        expoTitle: data.expoTitle,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://eventsphere.edvo.app';
    const dashboardUrl = `${frontendUrl}/exhibitor`;

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: data.exhibitorEmail,
      subject: `Your application for ${data.expoTitle} has been approved`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Application Approved!</h2>
            <p>Hello ${data.exhibitorName},</p>
            <p>Great news! Your application for <strong>${data.expoTitle}</strong> has been approved.</p>
            <p>You can now:</p>
            <ul>
              <li>Select your booth space</li>
              <li>Update your exhibitor profile</li>
              <li>Manage your booth details</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background: #8b5cf6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Approval email sent successfully', {
      to: data.exhibitorEmail,
      expoTitle: data.expoTitle,
    });
  } catch (error) {
    logger.error('Error sending approval email:', error);
    // Don't fail the approval if email fails
  }
}

/**
 * Send rejection email to exhibitor
 * Implements T147
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<void> {
  try {
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping rejection email', {
        exhibitorEmail: data.exhibitorEmail,
        expoTitle: data.expoTitle,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://eventsphere.edvo.app';
    const dashboardUrl = `${frontendUrl}/exhibitor`;

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: data.exhibitorEmail,
      subject: `Update on your application for ${data.expoTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Application Update</h2>
            <p>Hello ${data.exhibitorName},</p>
            <p>Thank you for your interest in <strong>${data.expoTitle}</strong>. After careful review, we regret to inform you that your application has not been approved at this time.</p>
            ${data.rejectionReason ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${data.rejectionReason}</p>
            </div>
            ` : ''}
            <p>We encourage you to apply for future events. Your participation is valuable to us, and we look forward to working with you in the future.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background: #8b5cf6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Dashboard</a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Application Update

        Hello ${data.exhibitorName},

        Thank you for your interest in ${data.expoTitle}. After careful review, we regret to inform you that your application has not been approved at this time.

        ${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}

        We encourage you to apply for future events. Your participation is valuable to us, and we look forward to working with you in the future.

        View your dashboard: ${dashboardUrl}

        If you have any questions, please don't hesitate to contact our support team.

        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Rejection email sent successfully', {
      to: data.exhibitorEmail,
      expoTitle: data.expoTitle,
    });
  } catch (error) {
    logger.error('Error sending rejection email:', error);
    // Don't throw error to prevent blocking the rejection process
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
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping session reminder email', {
        recipientEmail,
        sessionTitle,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const formattedTime = startTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: `Reminder: ${sessionTitle} starts in ${minutesBefore} minutes`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Session Reminder</h2>
            <p>Hello ${recipientName},</p>
            <p>This is a reminder that <strong>${sessionTitle}</strong> starts in <strong>${minutesBefore} minutes</strong>.</p>
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${expoTitle}</p>
              <p style="margin: 5px 0;"><strong>Session:</strong> ${sessionTitle}</p>
              <p style="margin: 5px 0;"><strong>Start Time:</strong> ${formattedTime}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            </div>
            <p>We look forward to seeing you there!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated reminder from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Session Reminder

        Hello ${recipientName},

        This is a reminder that ${sessionTitle} starts in ${minutesBefore} minutes.

        Event: ${expoTitle}
        Session: ${sessionTitle}
        Start Time: ${formattedTime}
        Location: ${location}

        We look forward to seeing you there!

        This is an automated reminder from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Session reminder email sent successfully', {
      to: recipientEmail,
      sessionTitle,
      minutesBefore,
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
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping schedule change email', {
        recipientEmail,
        sessionTitle,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const formatDateTime = (date: Date) => date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formatLocation = (loc: { room: string; building?: string }) => 
      loc.building ? `${loc.room}, ${loc.building}` : loc.room;

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: `Schedule Update: ${sessionTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Schedule Update</h2>
            <p>Hello ${recipientName},</p>
            <p>The schedule for <strong>${sessionTitle}</strong> at <strong>${expoTitle}</strong> has been updated.</p>
            ${oldSchedule ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; color: #856404;"><strong>Previous Schedule:</strong></p>
              <p style="margin: 5px 0; color: #856404;">Start: ${formatDateTime(oldSchedule.startTime)}</p>
              <p style="margin: 5px 0; color: #856404;">End: ${formatDateTime(oldSchedule.endTime)}</p>
              ${oldLocation ? `<p style="margin: 5px 0; color: #856404;">Location: ${formatLocation(oldLocation)}</p>` : ''}
            </div>
            ` : ''}
            <div style="background: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; color: #0c5460;"><strong>New Schedule:</strong></p>
              <p style="margin: 5px 0; color: #0c5460;">Start: ${formatDateTime(newSchedule.startTime)}</p>
              <p style="margin: 5px 0; color: #0c5460;">End: ${formatDateTime(newSchedule.endTime)}</p>
              <p style="margin: 5px 0; color: #0c5460;">Location: ${formatLocation(newLocation)}</p>
            </div>
            ${reason ? `
            <p style="color: #666; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
            ` : ''}
            <p>Please update your calendar accordingly. We apologize for any inconvenience.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Schedule Update

        Hello ${recipientName},

        The schedule for ${sessionTitle} at ${expoTitle} has been updated.

        ${oldSchedule ? `
        Previous Schedule:
        Start: ${formatDateTime(oldSchedule.startTime)}
        End: ${formatDateTime(oldSchedule.endTime)}
        ${oldLocation ? `Location: ${formatLocation(oldLocation)}` : ''}
        ` : ''}

        New Schedule:
        Start: ${formatDateTime(newSchedule.startTime)}
        End: ${formatDateTime(newSchedule.endTime)}
        Location: ${formatLocation(newLocation)}

        ${reason ? `Reason: ${reason}` : ''}

        Please update your calendar accordingly. We apologize for any inconvenience.

        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Schedule change email sent successfully', {
      to: recipientEmail,
      sessionTitle,
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
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping expo update email', {
        recipientEmail,
        expoTitle,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://eventsphere.edvo.app';
    const expoUrl = `${frontendUrl}/attendee/expos`;

    const getUpdateMessage = () => {
      switch (updateType) {
        case 'cancelled':
          return 'has been cancelled';
        case 'status-changed':
          return 'status has been updated';
        case 'details-updated':
          return 'details have been updated';
        default:
          return 'has been updated';
      }
    };

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: `Update: ${expoTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Expo Update</h2>
            <p>Hello ${recipientName},</p>
            <p>The expo <strong>${expoTitle}</strong> ${getUpdateMessage()}.</p>
            ${updateDetails ? `
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">${updateDetails}</p>
            </div>
            ` : ''}
            ${updateType === 'cancelled' ? `
            <p style="color: #dc3545; font-weight: bold;">We apologize for any inconvenience this may cause.</p>
            ` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${expoUrl}" style="background: #8b5cf6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Expo Details</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Expo Update

        Hello ${recipientName},

        The expo ${expoTitle} ${getUpdateMessage()}.

        ${updateDetails ? updateDetails : ''}

        ${updateType === 'cancelled' ? 'We apologize for any inconvenience this may cause.' : ''}

        View expo details: ${expoUrl}

        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Expo update email sent successfully', {
      to: recipientEmail,
      expoTitle,
      updateType,
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
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping feedback confirmation email', {
        recipientEmail,
        feedbackId,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const categoryLabel = category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: `Feedback Received: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Feedback Received</h2>
            <p>Hello ${recipientName},</p>
            <p>Thank you for submitting your feedback. We have received it and will review it shortly.</p>
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Feedback ID:</strong> ${feedbackId}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${categoryLabel}</p>
            </div>
            <p>We appreciate your input and will get back to you if we need any additional information.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Feedback Received

        Hello ${recipientName},

        Thank you for submitting your feedback. We have received it and will review it shortly.

        Feedback ID: ${feedbackId}
        Subject: ${subject}
        Category: ${categoryLabel}

        We appreciate your input and will get back to you if we need any additional information.

        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Feedback confirmation email sent successfully', {
      to: recipientEmail,
      feedbackId,
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
    const emailConfig = getEmailTransporter();
    if (!emailConfig) {
      logger.debug('Email service disabled, skipping feedback notification email', {
        recipientEmail,
        feedbackId,
      });
      return;
    }

    const { transporter, from, fromName } = emailConfig;
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://eventsphere.edvo.app';
    const feedbackUrl = `${frontendUrl}/organizer/feedback`;
    const categoryLabel = category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: recipientEmail,
      subject: `New Feedback: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">EventSphere</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">New Feedback Received</h2>
            <p>Hello ${recipientName},</p>
            <p>A new feedback submission has been received and requires your attention.</p>
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Feedback ID:</strong> ${feedbackId}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${categoryLabel}</p>
              <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${submitterName}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}" style="background: #8b5cf6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Feedback</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from EventSphere Management Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        New Feedback Received

        Hello ${recipientName},

        A new feedback submission has been received and requires your attention.

        Feedback ID: ${feedbackId}
        Subject: ${subject}
        Category: ${categoryLabel}
        Submitted by: ${submitterName}

        View feedback: ${feedbackUrl}

        This is an automated email from EventSphere Management Platform.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Feedback notification email sent successfully', {
      to: recipientEmail,
      feedbackId,
    });
  } catch (error) {
    logger.error('Error sending feedback notification email:', error);
  }
}

