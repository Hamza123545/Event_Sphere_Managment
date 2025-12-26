/**
 * Attendee TypeScript Types
 * Type definitions for attendee functionality per contracts/attendee-api.yaml
 */

import type { ExpoSummary } from './expo';

export interface ExpoDetail {
  expoId: string;
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  location: {
    venueName: string;
    address?: string;
    city: string;
    country: string;
  };
  status: string;
  registrationStatus?: 'registered' | 'not-registered';
}

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
    startTime: string;
    endTime: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface SessionBookmark {
  bookmarkId: string;
  sessionId: string;
  userId: string;
  bookmarkDate: string;
  reminderPreferences: {
    enabled: boolean;
    reminderTime?: number;
    channels?: ('email' | 'in-app')[];
  };
  attended?: boolean;
}

export interface AttendeeRegistration {
  registrationId: string;
  expoId: string;
  userId: string;
  registrationDate: string;
  attendanceStatus: 'registered' | 'checked-in' | 'no-show';
  preferences: {
    interests: string[];
    dietaryRestrictions?: string[];
  };
}

export interface ExhibitorSearchResult {
  profileId: string;
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  booth?: {
    boothId: string;
    identifier: string;
    location: {
      x: number;
      y: number;
    };
  };
}

export interface PersonalScheduleItem {
  sessionId: string;
  title: string;
  schedule: {
    startTime: string;
    endTime: string;
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
  startTime: string;
  endTime: string;
}

export interface BookmarkSessionRequest {
  reminderPreferences?: {
    enabled?: boolean;
    reminderTime?: number;
    channels?: ('email' | 'in-app')[];
  };
}

export interface RegisterForExpoRequest {
  preferences?: {
    interests?: string[];
    dietaryRestrictions?: string[];
  };
}

export interface ExpoListResponse {
  expos: ExpoSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SessionListResponse {
  sessions: SessionDetail[];
}

export interface ExhibitorListResponse {
  exhibitors: ExhibitorSearchResult[];
}

export interface PersonalScheduleResponse {
  schedule: PersonalScheduleItem[];
}

export interface ScheduleChangedEvent {
  type: 'schedule-changed';
  expoId: string;
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: string;
      endTime: string;
      duration: number;
    };
    location: {
      room: string;
      building?: string;
    };
    currentAttendees: number;
    capacity: number;
  };
  timestamp: string;
}

export interface SessionDeletedEvent {
  type: 'session-deleted';
  expoId: string;
  sessionId: string;
  sessionTitle: string;
  timestamp: string;
}

