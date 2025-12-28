/**
 * Analytics Service
 * Handles analytics calculations and aggregations for expo events
 * Implements FR-014, T178, T179, T182, T183
 */

import { AttendeeRegistration } from '../models/AttendeeRegistration';
import { Session } from '../models/Session';
import { SessionBookmark } from '../models/SessionBookmark';
import { ExpoEvent } from '../models/ExpoEvent';
import { BoothSpace } from '../models/BoothSpace';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Simple in-memory cache (T182)
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

interface AttendeeCountMetrics {
  total: number;
  registered: number;
  checkedIn: number;
  noShow: number;
}

interface SessionPopularityMetrics {
  sessions: Array<{
    sessionId: string;
    title: string;
    registrations: number;
    capacity: number;
    utilizationRate: number; // percentage
  }>;
}

interface BoothTrafficMetrics {
  totalBooths: number;
  reservedBooths: number;
  availableBooths: number;
  occupancyRate: number; // percentage
}

interface EngagementRateMetrics {
  totalAttendees: number;
  attendeesWithBookmarks: number;
  averageBookmarksPerAttendee: number;
  engagementRate: number; // percentage
}

export interface AnalyticsResult {
  expoId: string;
  expoTitle: string;
  attendeeCount?: AttendeeCountMetrics;
  sessionPopularity?: SessionPopularityMetrics;
  boothTraffic?: BoothTrafficMetrics;
  engagementRate?: EngagementRateMetrics;
  generatedAt: string; // Changed to string for JSON serialization
}

/**
 * Get analytics for an expo (with caching)
 * Implements T178, T179, T182, T183
 */
export async function getExpoAnalytics(
  expoId: string,
  userId: string,
  userRole: string,
  metricType?: string
): Promise<AnalyticsResult> {
  try {
    // RBAC: Only organizer of the expo or admin can view analytics
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }
    const organizerId = expo.organizer?.toString ? expo.organizer.toString() : String(expo.organizer);
    if (userRole === 'organizer' && organizerId !== userId) {
      logger.warn('Access denied to analytics', { userId, organizerId, userRole, expoId });
      throw new CustomError('Forbidden: Not the organizer of this expo', 403, 'FORBIDDEN');
    }

    // Check cache (T182)
    const cacheKey = `${expoId}-${metricType || 'all'}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Returning cached analytics', { expoId, cacheKey });
      return cached.data;
    }

    const result: AnalyticsResult = {
      expoId: expo._id.toString(),
      expoTitle: expo.title,
      generatedAt: new Date().toISOString(), // Convert to ISO string for JSON serialization
    };

    // Calculate metrics based on requested type
    if (!metricType || metricType === 'attendee-count') {
      result.attendeeCount = await calculateAttendeeCount(expoId);
    }

    if (!metricType || metricType === 'session-popularity') {
      result.sessionPopularity = await calculateSessionPopularity(expoId);
    }

    if (!metricType || metricType === 'booth-traffic') {
      result.boothTraffic = await calculateBoothTraffic(expoId);
    }

    if (!metricType || metricType === 'engagement-rate') {
      result.engagementRate = await calculateEngagementRate(expoId);
    }

    // Cache the result (T182)
    analyticsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Audit logging (T183)
    logger.info('Analytics retrieved', {
      action: 'get_analytics',
      expoId,
      metricType: metricType || 'all',
      requestedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getExpoAnalytics service:', error);
    throw new CustomError('Failed to retrieve analytics', 500, 'ANALYTICS_ERROR');
  }
}

/**
 * Calculate attendee count metrics
 * Implements T178, T179
 */
export async function calculateAttendeeCount(expoId: string): Promise<AttendeeCountMetrics> {
  // MongoDB aggregation pipeline for attendee counts by status (T179)
  const pipeline = [
    { $match: { expo: expoId } },
    {
      $group: {
        _id: '$attendanceStatus',
        count: { $sum: 1 },
      },
    },
  ];

  const results = await AttendeeRegistration.aggregate(pipeline);

  const metrics: AttendeeCountMetrics = {
    total: 0,
    registered: 0,
    checkedIn: 0,
    noShow: 0,
  };

  results.forEach((item) => {
    metrics.total += item.count;
    if (item._id === 'registered') metrics.registered = item.count;
    if (item._id === 'checked-in') metrics.checkedIn = item.count;
    if (item._id === 'no-show') metrics.noShow = item.count;
  });

  return metrics;
}

/**
 * Calculate session popularity metrics
 * Implements T178, T179
 */
export async function calculateSessionPopularity(expoId: string): Promise<SessionPopularityMetrics> {
  // Get all sessions for the expo
  const sessions = await Session.find({ expo: expoId }).select('_id title capacity currentAttendees');

  // Aggregate bookmarks per session (T179)
  const bookmarkPipeline = [
    {
      $match: {
        session: { $in: sessions.map((s) => s._id) },
      },
    },
    {
      $group: {
        _id: '$session',
        registrations: { $sum: 1 },
      },
    },
  ];

  const bookmarkCounts = await SessionBookmark.aggregate(bookmarkPipeline);
  const bookmarkMap = new Map(bookmarkCounts.map((item) => [item._id.toString(), item.registrations]));

  const sessionMetrics = sessions.map((session) => {
    const registrations = bookmarkMap.get(session._id.toString()) || 0;
    const utilizationRate = session.capacity > 0 ? (registrations / session.capacity) * 100 : 0;

    return {
      sessionId: session._id.toString(),
      title: session.title,
      registrations,
      capacity: session.capacity,
      utilizationRate: Math.round(utilizationRate * 100) / 100, // Round to 2 decimal places
    };
  });

  // Sort by registrations descending
  sessionMetrics.sort((a, b) => b.registrations - a.registrations);

  return {
    sessions: sessionMetrics,
  };
}

/**
 * Calculate booth traffic metrics
 * Implements T178, T179
 */
export async function calculateBoothTraffic(expoId: string): Promise<BoothTrafficMetrics> {
  // Direct query on BoothSpace via FloorPlan
  const floorPlan = await (await import('../models/FloorPlan')).FloorPlan.findOne({ expo: expoId });
  if (!floorPlan) {
    return {
      totalBooths: 0,
      reservedBooths: 0,
      availableBooths: 0,
      occupancyRate: 0,
    };
  }

  const totalBooths = await BoothSpace.countDocuments({ floorPlan: floorPlan._id });
  const reservedBooths = await BoothSpace.countDocuments({ floorPlan: floorPlan._id, status: 'reserved' });
  const availableBooths = await BoothSpace.countDocuments({ floorPlan: floorPlan._id, status: 'available' });

  const occupancyRate = totalBooths > 0 ? (reservedBooths / totalBooths) * 100 : 0;

  return {
    totalBooths,
    reservedBooths,
    availableBooths,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
  };
}

/**
 * Calculate engagement rate metrics
 * Implements T178, T179
 */
export async function calculateEngagementRate(expoId: string): Promise<EngagementRateMetrics> {
  // Get total attendees for the expo
  const totalAttendees = await AttendeeRegistration.countDocuments({ expo: expoId });

  // Get sessions for the expo
  const sessions = await Session.find({ expo: expoId }).select('_id');
  const sessionIds = sessions.map((s) => s._id);

  // Aggregate bookmarks by user (T179)
  const bookmarkPipeline = [
    {
      $match: {
        session: { $in: sessionIds },
      },
    },
    {
      $group: {
        _id: '$user',
        bookmarkCount: { $sum: 1 },
      },
    },
  ];

  const userBookmarks = await SessionBookmark.aggregate(bookmarkPipeline);
  const attendeesWithBookmarks = userBookmarks.length;
  const totalBookmarks = userBookmarks.reduce((sum, item) => sum + item.bookmarkCount, 0);
  const averageBookmarksPerAttendee = totalAttendees > 0 ? totalBookmarks / totalAttendees : 0;
  const engagementRate = totalAttendees > 0 ? (attendeesWithBookmarks / totalAttendees) * 100 : 0;

  return {
    totalAttendees,
    attendeesWithBookmarks,
    averageBookmarksPerAttendee: Math.round(averageBookmarksPerAttendee * 100) / 100,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
}

/**
 * Invalidate cache for an expo (called when data changes)
 * Implements T182
 */
export function invalidateAnalyticsCache(expoId: string): void {
  const keysToDelete: string[] = [];
  analyticsCache.forEach((_value, key) => {
    if (key.startsWith(`${expoId}-`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => analyticsCache.delete(key));
  logger.debug('Analytics cache invalidated', { expoId, keysDeleted: keysToDelete.length });
}

