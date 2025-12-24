/**
 * Analytics TypeScript Types
 * Type definitions for analytics functionality per contracts/expo-api.yaml
 */

export interface AttendeeCountMetrics {
  total: number;
  registered: number;
  checkedIn: number;
  noShow: number;
}

export interface SessionPopularityMetrics {
  sessions: Array<{
    sessionId: string;
    title: string;
    registrations: number;
    capacity: number;
    utilizationRate: number;
  }>;
}

export interface BoothTrafficMetrics {
  totalBooths: number;
  reservedBooths: number;
  availableBooths: number;
  occupancyRate: number;
}

export interface EngagementRateMetrics {
  totalAttendees: number;
  attendeesWithBookmarks: number;
  averageBookmarksPerAttendee: number;
  engagementRate: number;
}

export interface Analytics {
  expoId: string;
  expoTitle: string;
  attendeeCount?: AttendeeCountMetrics;
  sessionPopularity?: SessionPopularityMetrics;
  boothTraffic?: BoothTrafficMetrics;
  engagementRate?: EngagementRateMetrics;
  generatedAt: string;
}

export interface GetAnalyticsResponse {
  success: boolean;
  data: Analytics;
}

