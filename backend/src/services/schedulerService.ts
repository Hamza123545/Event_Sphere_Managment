/**
 * Scheduler Service
 * Handles background jobs for session reminders and other scheduled tasks
 * Implements T194, T195
 */

// @ts-ignore - node-cron doesn't have default export in types
import * as cron from 'node-cron';
import logger from '../utils/logger';
import { SessionBookmark } from '../models/SessionBookmark';
import { sendSessionReminder } from './notificationService';

let reminderJob: cron.ScheduledTask | null = null;

/**
 * Start all scheduled jobs
 * Implements T194
 */
export function startScheduler(): void {
  logger.info('Starting scheduler service');

  // Session reminder job - runs every 5 minutes (T195)
  reminderJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkAndSendSessionReminders();
    } catch (error) {
      logger.error('Error in session reminder job:', error);
    }
  });

  logger.info('Scheduler service started - session reminder job running every 5 minutes');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler(): void {
  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
    logger.info('Scheduler service stopped');
  }
}

/**
 * Check for sessions starting soon and send reminders
 * Implements T195
 */
async function checkAndSendSessionReminders(): Promise<void> {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Find all bookmarks with reminders enabled that haven't been sent yet
    // We need to check sessions starting within the next 5 minutes (since job runs every 5 min)
    const bookmarks = await SessionBookmark.find({
      'reminderPreferences.enabled': true,
    }).populate('session', 'schedule.startTime schedule.endTime');

    const remindersToSend: Array<{ bookmarkId: string; minutesBefore: number }> = [];

    for (const bookmark of bookmarks) {
      const session = bookmark.session as any;
      if (!session || !session.schedule) continue;

      const sessionStartTime = new Date(session.schedule.startTime);
      const reminderTime = bookmark.reminderPreferences.reminderTime || 60; // Default 60 minutes
      const reminderTriggerTime = new Date(sessionStartTime.getTime() - reminderTime * 60 * 1000);

      // Check if we're within the reminder window (between reminderTriggerTime and now + 5 minutes)
      if (reminderTriggerTime <= fiveMinutesFromNow && reminderTriggerTime >= now) {
        remindersToSend.push({
          bookmarkId: bookmark._id.toString(),
          minutesBefore: reminderTime,
        });
      }
    }

    // Send reminders
    for (const reminder of remindersToSend) {
      try {
        await sendSessionReminder(reminder.bookmarkId);
        logger.debug('Session reminder sent', {
          bookmarkId: reminder.bookmarkId,
          minutesBefore: reminder.minutesBefore,
        });
      } catch (error) {
        logger.error('Failed to send session reminder', {
          bookmarkId: reminder.bookmarkId,
          error,
        });
      }
    }

    if (remindersToSend.length > 0) {
      logger.info('Session reminder job completed', {
        remindersSent: remindersToSend.length,
      });
    }
  } catch (error) {
    logger.error('Error in checkAndSendSessionReminders:', error);
    throw error;
  }
}

