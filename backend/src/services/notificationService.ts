/**
 * Notification Service
 * Handles sending notifications for session reminders, schedule changes, and expo updates
 * Implements FR-016, T193, T200
 */

import { SessionBookmark } from '../models/SessionBookmark';
import { ExpoEvent } from '../models/ExpoEvent';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendSessionReminderEmail, sendScheduleChangeEmail, sendExpoUpdateEmail } from './emailService';
import { broadcastToUser } from './realtime';

export interface SessionReminderData {
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: Date;
      endTime: Date;
    };
    location: {
      room: string;
      building?: string;
    };
  };
  expo: {
    expoId: string;
    title: string;
  };
  minutesUntilStart: number;
  user: {
    userId: string;
    email: string;
    name: string;
  };
}

export interface ScheduleChangeData {
  session: {
    sessionId: string;
    title: string;
    oldSchedule?: {
      startTime: Date;
      endTime: Date;
    };
    newSchedule: {
      startTime: Date;
      endTime: Date;
    };
    oldLocation?: {
      room: string;
      building?: string;
    };
    newLocation: {
      room: string;
      building?: string;
    };
    changeType: 'time' | 'location' | 'speaker' | 'cancellation';
  };
  expo: {
    expoId: string;
    title: string;
  };
  reason?: string;
  affectedUsers: Array<{
    userId: string;
    email: string;
    name: string;
  }>;
}

/**
 * Send session reminder notification
 * Implements T193, T200
 */
export async function sendSessionReminder(bookmarkId: string): Promise<void> {
  try {
    const bookmark = await SessionBookmark.findById(bookmarkId)
      .populate('session')
      .populate('user', 'email profile.firstName profile.lastName');

    if (!bookmark) {
      throw new CustomError('Bookmark not found', 404, 'BOOKMARK_NOT_FOUND');
    }

    const session = bookmark.session as any;
    const user = bookmark.user as any;

    if (!session || !user) {
      throw new CustomError('Session or user not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get expo info
    await session.populate('expo', 'title');
    const expo = session.expo as any;

    const reminderData: SessionReminderData = {
      session: {
        sessionId: session._id.toString(),
        title: session.title,
        schedule: {
          startTime: session.schedule.startTime,
          endTime: session.schedule.endTime,
        },
        location: {
          room: session.location.room,
          building: session.location.building,
        },
      },
      expo: {
        expoId: expo._id.toString(),
        title: expo.title,
      },
      minutesUntilStart: bookmark.reminderPreferences.reminderTime || 60,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
      },
    };

    // Send via configured channels
    const channels = bookmark.reminderPreferences.channels || ['email', 'in-app'];

    // Email notification (T197)
    if (channels.includes('email')) {
      try {
        await sendSessionReminderEmail(
          user.email,
          reminderData.user.name,
          reminderData.session.title,
          reminderData.session.schedule.startTime,
          reminderData.session.location.room,
          reminderData.expo.title,
          reminderData.minutesUntilStart
        );
      } catch (emailError) {
        logger.warn('Failed to send session reminder email', {
          userId: user._id.toString(),
          sessionId: session._id.toString(),
          error: emailError,
        });
        // Don't fail the entire operation if email fails
      }
    }

    // In-app notification via WebSocket (T196)
    if (channels.includes('in-app')) {
      broadcastToUser(user._id.toString(), 'session-reminder', {
        type: 'session-reminder',
        session: {
          sessionId: reminderData.session.sessionId,
          title: reminderData.session.title,
          schedule: {
            startTime: reminderData.session.schedule.startTime.toISOString(),
            endTime: reminderData.session.schedule.endTime.toISOString(),
          },
          location: reminderData.session.location,
        },
        expo: reminderData.expo,
        minutesUntilStart: reminderData.minutesUntilStart,
        timestamp: new Date().toISOString(),
      });
    }

    // Audit logging (T200)
    logger.info('Session reminder sent', {
      action: 'send_session_reminder',
      bookmarkId: bookmark._id.toString(),
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      channels,
      minutesUntilStart: reminderData.minutesUntilStart,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in sendSessionReminder:', error);
    throw new CustomError('Failed to send session reminder', 500, 'REMINDER_ERROR');
  }
}

/**
 * Send schedule change notification
 * Implements T193, T200
 */
export async function sendScheduleChangeNotification(
  data: ScheduleChangeData
): Promise<void> {
  try {
    // Send notifications to all affected users
    for (const user of data.affectedUsers) {
      // Email notification (T198)
      try {
        await sendScheduleChangeEmail(
          user.email,
          user.name,
          data.session.title,
          data.session.oldSchedule,
          data.session.newSchedule,
          data.session.oldLocation,
          data.session.newLocation,
          data.expo.title,
          data.reason
        );
      } catch (emailError) {
        logger.warn('Failed to send schedule change email', {
          userId: user.userId,
          sessionId: data.session.sessionId,
          error: emailError,
        });
      }

      // In-app notification via WebSocket
      broadcastToUser(user.userId, 'schedule-changed', {
        type: 'schedule-changed',
        expoId: data.expo.expoId,
        session: {
          sessionId: data.session.sessionId,
          title: data.session.title,
          schedule: {
            startTime: data.session.newSchedule.startTime.toISOString(),
            endTime: data.session.newSchedule.endTime.toISOString(),
          },
          location: data.session.newLocation,
          changeType: data.session.changeType,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Audit logging (T200)
    logger.info('Schedule change notifications sent', {
      action: 'send_schedule_change_notification',
      sessionId: data.session.sessionId,
      expoId: data.expo.expoId,
      changeType: data.session.changeType,
      affectedUsersCount: data.affectedUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in sendScheduleChangeNotification:', error);
    throw new CustomError('Failed to send schedule change notifications', 500, 'NOTIFICATION_ERROR');
  }
}

/**
 * Send expo update notification
 * Implements T193, T200
 */
export async function sendExpoUpdateNotification(
  expoId: string,
  updateType: 'cancelled' | 'status-changed' | 'details-updated',
  updateDetails?: string
): Promise<void> {
  try {
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Get all registered attendees
    const { AttendeeRegistration } = await import('../models/AttendeeRegistration');
    const registrations = await AttendeeRegistration.find({ expo: expoId }).populate('user', 'email profile.firstName profile.lastName');

    // Send notifications to all registered attendees
    for (const registration of registrations) {
      const user = registration.user as any;
      if (!user) continue;

      const userName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email;

      // Email notification
      try {
        await sendExpoUpdateEmail(
          user.email,
          userName,
          expo.title,
          updateType,
          updateDetails
        );
      } catch (emailError) {
        logger.warn('Failed to send expo update email', {
          userId: user._id.toString(),
          expoId,
          error: emailError,
        });
      }

      // In-app notification via WebSocket
      broadcastToUser(user._id.toString(), 'expo-updated', {
        type: 'expo-updated',
        expoId: expo._id.toString(),
        expoTitle: expo.title,
        updateType,
        updateDetails,
        timestamp: new Date().toISOString(),
      });
    }

    // Audit logging (T200)
    logger.info('Expo update notifications sent', {
      action: 'send_expo_update_notification',
      expoId: expo._id.toString(),
      updateType,
      affectedUsersCount: registrations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in sendExpoUpdateNotification:', error);
    throw new CustomError('Failed to send expo update notifications', 500, 'NOTIFICATION_ERROR');
  }
}

