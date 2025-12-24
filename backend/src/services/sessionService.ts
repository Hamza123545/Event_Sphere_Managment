/**
 * Session Service
 * Handles session scheduling, bookmarking, and conflict detection
 * Implements FR-010, FR-015, FR-031, FR-034, T199
 */

import { Session, ISession } from '../models/Session';
import { SessionBookmark } from '../models/SessionBookmark';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToExpo } from './realtime';
import { sendScheduleChangeNotification } from './notificationService';

export interface SessionDetail {
  sessionId: string;
  expoId: string;
  title: string;
  description: string;
  speakers: Array<{
    name: string;
    title?: string;
    bio?: string;
  }>;
  schedule: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  location: {
    room: string;
    building?: string;
  };
  capacity: number;
  currentAttendees: number;
  topic: string;
  category: string;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalScheduleItem {
  sessionId: string;
  title: string;
  schedule: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  location: {
    room: string;
    building?: string;
  };
  topic: string;
  category: string;
  conflicts: string[]; // Array of conflicting session IDs
}

export interface ScheduleConflict {
  sessionId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Get expo schedule (all sessions)
 * Implements FR-015
 */
export async function getExpoSchedule(
  expoId: string,
  userId?: string,
  options?: {
    category?: string;
    topic?: string;
    date?: string;
  }
): Promise<SessionDetail[]> {
  try {
    const query: any = { expo: expoId };

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.topic) {
      query.topic = { $regex: options.topic, $options: 'i' };
    }

    if (options?.date) {
      const dateStart = new Date(options.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(options.date);
      dateEnd.setHours(23, 59, 59, 999);

      query['schedule.startTime'] = {
        $gte: dateStart,
        $lte: dateEnd,
      };
    }

    const sessions = await Session.find(query).sort({ 'schedule.startTime': 1 });

    // If userId provided, check bookmark status
    let bookmarks: Set<string> = new Set();
    if (userId) {
      const userBookmarks = await SessionBookmark.find({
        user: userId,
        session: { $in: sessions.map((s) => s._id) },
      });
      bookmarks = new Set(userBookmarks.map((b) => b.session.toString()));
    }

    return sessions.map((session: any) => ({
      sessionId: session._id.toString(),
      expoId,
      title: session.title,
      description: session.description,
      speakers: session.speakers,
      schedule: {
        startTime: session.schedule.startTime,
        endTime: session.schedule.endTime,
        duration: session.schedule.duration,
      },
      location: session.location,
      capacity: session.capacity,
      currentAttendees: session.currentAttendees,
      topic: session.topic,
      category: session.category,
      isBookmarked: userId ? bookmarks.has(session._id.toString()) : false,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  } catch (error) {
    logger.error('Error in getExpoSchedule service:', error);
    throw new CustomError('Failed to get expo schedule', 500, 'GET_SCHEDULE_ERROR');
  }
}

/**
 * Bookmark session with capacity check
 * Implements FR-015, FR-031 (capacity tracking)
 */
export async function bookmarkSession(
  sessionId: string,
  userId: string,
  reminderPreferences?: {
    enabled?: boolean;
    reminderTime?: number;
  }
): Promise<SessionDetail> {
  try {
    // Get session
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new CustomError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    // Check if already bookmarked
    const existingBookmark = await SessionBookmark.findOne({ user: userId, session: sessionId });
    if (existingBookmark) {
      throw new CustomError('Session already bookmarked', 409, 'ALREADY_BOOKMARKED');
    }

    // Check capacity
    if (session.currentAttendees >= session.capacity) {
      throw new CustomError('Session is full', 400, 'SESSION_FULL');
    }

    // Create bookmark
    const bookmark = new SessionBookmark({
      user: userId,
      session: sessionId,
      reminderPreferences: {
        enabled: reminderPreferences?.enabled || false,
        reminderTime: reminderPreferences?.reminderTime,
      },
    });

    await bookmark.save();

    // Increment currentAttendees
    session.currentAttendees += 1;
    await session.save();

    logger.info('Session bookmarked', {
      userId,
      sessionId,
      currentAttendees: session.currentAttendees,
      capacity: session.capacity,
    });

    // Broadcast real-time update
    broadcastToExpo(session.expo.toString(), 'schedule-changed', {
      type: 'schedule-changed',
      expoId: session.expo.toString(),
      session: {
        sessionId: session._id.toString(),
        title: session.title,
        schedule: {
          startTime: session.schedule.startTime.toISOString(),
          endTime: session.schedule.endTime.toISOString(),
          duration: session.schedule.duration,
        },
        location: session.location,
        currentAttendees: session.currentAttendees,
        capacity: session.capacity,
      },
      timestamp: new Date().toISOString(),
    });

    return formatSessionDetail(session, userId);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in bookmarkSession service:', error);
    throw new CustomError('Failed to bookmark session', 500, 'BOOKMARK_SESSION_ERROR');
  }
}

/**
 * Remove bookmark
 * Implements FR-015
 */
export async function removeBookmark(sessionId: string, userId: string): Promise<void> {
  try {
    const bookmark = await SessionBookmark.findOne({ user: userId, session: sessionId });
    if (!bookmark) {
      throw new CustomError('Bookmark not found', 404, 'BOOKMARK_NOT_FOUND');
    }

    // Decrement currentAttendees
    const session = await Session.findById(sessionId);
    if (session && session.currentAttendees > 0) {
      session.currentAttendees -= 1;
      await session.save();

      // Broadcast real-time update
      broadcastToExpo(session.expo.toString(), 'schedule-changed', {
        type: 'schedule-changed',
        expoId: session.expo.toString(),
        session: {
          sessionId: session._id.toString(),
          title: session.title,
          schedule: {
            startTime: session.schedule.startTime.toISOString(),
            endTime: session.schedule.endTime.toISOString(),
            duration: session.schedule.duration,
          },
          location: session.location,
          currentAttendees: session.currentAttendees,
          capacity: session.capacity,
        },
        timestamp: new Date().toISOString(),
      });
    }

    await SessionBookmark.findByIdAndDelete(bookmark._id);

    logger.info('Bookmark removed', { userId, sessionId });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in removeBookmark service:', error);
    throw new CustomError('Failed to remove bookmark', 500, 'REMOVE_BOOKMARK_ERROR');
  }
}

/**
 * Get personal schedule with conflict detection
 * Implements FR-015, FR-097 (scheduling conflict detection)
 */
export async function getPersonalSchedule(userId: string): Promise<PersonalScheduleItem[]> {
  try {
    const bookmarks = await SessionBookmark.find({ user: userId })
      .populate('session')
      .sort({ bookmarkDate: 1 });

    const sessions = bookmarks.map((bookmark) => bookmark.session as any as ISession);

    // Detect conflicts
    const scheduleItems: PersonalScheduleItem[] = sessions.map((session, index) => {
      const conflicts: string[] = [];

      // Check for overlapping sessions
      sessions.forEach((otherSession, otherIndex) => {
        if (index !== otherIndex) {
          const sessionStart = new Date(session.schedule.startTime).getTime();
          const sessionEnd = new Date(session.schedule.endTime).getTime();
          const otherStart = new Date(otherSession.schedule.startTime).getTime();
          const otherEnd = new Date(otherSession.schedule.endTime).getTime();

          // Check if sessions overlap
          if (
            (sessionStart >= otherStart && sessionStart < otherEnd) ||
            (sessionEnd > otherStart && sessionEnd <= otherEnd) ||
            (sessionStart <= otherStart && sessionEnd >= otherEnd)
          ) {
            conflicts.push(otherSession._id.toString());
          }
        }
      });

      return {
        sessionId: session._id.toString(),
        title: session.title,
        schedule: {
          startTime: session.schedule.startTime,
          endTime: session.schedule.endTime,
          duration: session.schedule.duration,
        },
        location: session.location,
        topic: session.topic,
        category: session.category,
        conflicts,
      };
    });

    return scheduleItems;
  } catch (error) {
    logger.error('Error in getPersonalSchedule service:', error);
    throw new CustomError('Failed to get personal schedule', 500, 'GET_PERSONAL_SCHEDULE_ERROR');
  }
}

/**
 * Check scheduling conflicts before bookmarking
 * Implements FR-097
 */
export async function checkSchedulingConflicts(
  sessionId: string,
  userId: string
): Promise<ScheduleConflict[]> {
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new CustomError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const userBookmarks = await SessionBookmark.find({ user: userId })
      .populate('session')
      .select('session');

    const conflicts: ScheduleConflict[] = [];

    const sessionStart = new Date(session.schedule.startTime).getTime();
    const sessionEnd = new Date(session.schedule.endTime).getTime();

    for (const bookmark of userBookmarks) {
      const otherSession = bookmark.session as any as ISession;
      if (otherSession._id.toString() === sessionId) continue;

      const otherStart = new Date(otherSession.schedule.startTime).getTime();
      const otherEnd = new Date(otherSession.schedule.endTime).getTime();

      // Check if sessions overlap
      if (
        (sessionStart >= otherStart && sessionStart < otherEnd) ||
        (sessionEnd > otherStart && sessionEnd <= otherEnd) ||
        (sessionStart <= otherStart && sessionEnd >= otherEnd)
      ) {
        conflicts.push({
          sessionId: otherSession._id.toString(),
          title: otherSession.title,
          startTime: otherSession.schedule.startTime,
          endTime: otherSession.schedule.endTime,
        });
      }
    }

    return conflicts;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in checkSchedulingConflicts service:', error);
    throw new CustomError('Failed to check scheduling conflicts', 500, 'CHECK_CONFLICTS_ERROR');
  }
}

/**
 * Format session for API response
 */
async function formatSessionDetail(session: ISession, userId?: string): Promise<SessionDetail> {
  let isBookmarked = false;
  if (userId) {
    const bookmark = await SessionBookmark.findOne({ user: userId, session: session._id });
    isBookmarked = !!bookmark;
  }

  return {
    sessionId: session._id.toString(),
    expoId: session.expo.toString(),
    title: session.title,
    description: session.description,
    speakers: session.speakers,
    schedule: {
      startTime: session.schedule.startTime,
      endTime: session.schedule.endTime,
      duration: session.schedule.duration,
    },
    location: session.location,
    capacity: session.capacity,
    currentAttendees: session.currentAttendees,
    topic: session.topic,
    category: session.category,
    isBookmarked,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Delete session
 * Implements FR-015, T132
 * Deletes session and cancels all bookmarks, then broadcasts session-deleted event
 */
export async function deleteSession(
  sessionId: string,
  expoId: string,
  userId: string,
  userRole: string
): Promise<void> {
  try {
    // Verify user is organizer or admin
    if (userRole !== 'organizer' && userRole !== 'admin') {
      throw new CustomError('Only organizers can delete sessions', 403, 'FORBIDDEN');
    }

    // Get session and verify it belongs to expo
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new CustomError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.expo.toString() !== expoId) {
      throw new CustomError('Session does not belong to this expo', 400, 'VALIDATION_ERROR');
    }

    // Verify organizer owns the expo (via ExpoEvent check)
    const { ExpoEvent } = await import('../models/ExpoEvent');
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can delete sessions', 403, 'FORBIDDEN');
    }

    const sessionTitle = session.title;
    const sessionExpoId = session.expo.toString();

    // Delete all bookmarks for this session (cascade delete)
    await SessionBookmark.deleteMany({ session: sessionId });

    // Delete the session
    await Session.findByIdAndDelete(sessionId);

    logger.info('Session deleted successfully', {
      action: 'delete_session',
      sessionId,
      expoId: sessionExpoId,
      title: sessionTitle,
      deletedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Broadcast session-deleted event (T132)
    broadcastToExpo(sessionExpoId, 'session-deleted', {
      type: 'session-deleted',
      expoId: sessionExpoId,
      sessionId,
      sessionTitle,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in deleteSession service:', error);
    throw new CustomError('Failed to delete session', 500, 'DELETE_SESSION_ERROR');
  }
}

/**
 * Update session
 * Implements T199 - Triggers schedule change notifications when session updated
 */
export interface UpdateSessionInput {
  title?: string;
  description?: string;
  speakers?: Array<{
    name: string;
    title?: string;
    bio?: string;
  }>;
  schedule?: {
    startTime: Date;
    endTime: Date;
  };
  location?: {
    room: string;
    building?: string;
  };
  capacity?: number;
  topic?: string;
  category?: string;
}

export async function updateSession(
  sessionId: string,
  expoId: string,
  userId: string,
  userRole: string,
  updates: UpdateSessionInput,
  reason?: string
): Promise<SessionDetail> {
  try {
    // Verify user is organizer or admin
    if (userRole !== 'organizer' && userRole !== 'admin') {
      throw new CustomError('Only organizers can update sessions', 403, 'FORBIDDEN');
    }

    // Get session and verify it belongs to expo
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new CustomError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.expo.toString() !== expoId) {
      throw new CustomError('Session does not belong to this expo', 400, 'VALIDATION_ERROR');
    }

    // Verify organizer owns the expo (via ExpoEvent check)
    const { ExpoEvent } = await import('../models/ExpoEvent');
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can update sessions', 403, 'FORBIDDEN');
    }

    // Store original values for change detection
    const originalSchedule = {
      startTime: session.schedule.startTime,
      endTime: session.schedule.endTime,
    };
    const originalLocation = {
      room: session.location.room,
      building: session.location.building,
    };

    // Detect if schedule or location changed
    const scheduleChanged =
      updates.schedule &&
      (new Date(updates.schedule.startTime).getTime() !== originalSchedule.startTime.getTime() ||
        new Date(updates.schedule.endTime).getTime() !== originalSchedule.endTime.getTime());
    const locationChanged =
      updates.location &&
      (updates.location.room !== originalLocation.room ||
        updates.location.building !== originalLocation.building);

    // Update session fields
    if (updates.title) session.title = updates.title;
    if (updates.description) session.description = updates.description;
    if (updates.speakers) session.speakers = updates.speakers;
    if (updates.schedule) {
      session.schedule.startTime = new Date(updates.schedule.startTime);
      session.schedule.endTime = new Date(updates.schedule.endTime);
      session.schedule.duration =
        Math.abs(new Date(updates.schedule.endTime).getTime() - new Date(updates.schedule.startTime).getTime()) /
        (1000 * 60); // Duration in minutes
    }
    if (updates.location) {
      session.location.room = updates.location.room;
      if (updates.location.building !== undefined) {
        session.location.building = updates.location.building;
      }
    }
    if (updates.capacity !== undefined) {
      // Ensure capacity is not less than current attendees
      if (updates.capacity < session.currentAttendees) {
        throw new CustomError(
          'Capacity cannot be less than current number of attendees',
          400,
          'VALIDATION_ERROR'
        );
      }
      session.capacity = updates.capacity;
    }
    if (updates.topic) session.topic = updates.topic;
    if (updates.category) session.category = updates.category;

    await session.save();

    logger.info('Session updated successfully', {
      action: 'update_session',
      sessionId,
      expoId,
      updatedBy: userId,
      changes: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    // Broadcast real-time update
    broadcastToExpo(expoId, 'schedule-changed', {
      type: 'schedule-changed',
      expoId,
      session: {
        sessionId: session._id.toString(),
        title: session.title,
        schedule: {
          startTime: session.schedule.startTime.toISOString(),
          endTime: session.schedule.endTime.toISOString(),
          duration: session.schedule.duration,
        },
        location: session.location,
        changeType: scheduleChanged ? 'time' : locationChanged ? 'location' : 'speaker',
      },
      timestamp: new Date().toISOString(),
    });

    // Send schedule change notifications if schedule or location changed (T199)
    if (scheduleChanged || locationChanged) {
      try {
        // Get all users who bookmarked this session
        const bookmarks = await SessionBookmark.find({ session: sessionId }).populate('user', 'email profile.firstName profile.lastName');

        // Prepare affected users list
        const affectedUsers = bookmarks
          .map((bookmark) => {
            const user = bookmark.user as any;
            if (!user) return null;
            return {
              userId: user._id.toString(),
              email: user.email,
              name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
            };
          })
          .filter((user): user is { userId: string; email: string; name: string } => user !== null);

        if (affectedUsers.length > 0) {
          await sendScheduleChangeNotification({
            session: {
              sessionId: session._id.toString(),
              title: session.title,
              oldSchedule: scheduleChanged ? originalSchedule : undefined,
              newSchedule: updates.schedule || session.schedule,
              oldLocation: locationChanged ? originalLocation : undefined,
              newLocation: updates.location || session.location,
              changeType: scheduleChanged ? 'time' : locationChanged ? 'location' : 'speaker',
            },
            expo: {
              expoId: expo._id.toString(),
              title: expo.title,
            },
            reason,
            affectedUsers,
          });

          logger.info('Schedule change notifications sent', {
            sessionId,
            expoId,
            affectedUsersCount: affectedUsers.length,
          });
        }
      } catch (notificationError) {
        // Log error but don't fail the update
        logger.error('Failed to send schedule change notifications', {
          sessionId,
          expoId,
          error: notificationError,
        });
      }
    }

    return formatSessionDetail(session, userId);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateSession service:', error);
    throw new CustomError('Failed to update session', 500, 'UPDATE_SESSION_ERROR');
  }
}

