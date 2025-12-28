/**
 * Notification Types
 * Per contracts/realtime-events.md
 * Implements T202
 */

export type NotificationType = 'session-reminder' | 'schedule-changed' | 'expo-updated' | 'exhibitor-approved' | 'exhibitor-rejected';

export interface SessionReminderNotification {
  type: 'session-reminder';
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: string; // ISO 8601
      endTime: string;
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
  timestamp: string; // ISO 8601
}

export interface ScheduleChangeNotification {
  type: 'schedule-changed';
  expoId: string;
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: string; // ISO 8601
      endTime: string;
    };
    location: {
      room: string;
      building?: string;
    };
    changeType: 'time' | 'location' | 'speaker' | 'cancellation';
  };
  timestamp: string; // ISO 8601
}

export interface ExpoUpdateNotification {
  type: 'expo-updated';
  expoId: string;
  expoTitle: string;
  updateType: 'cancelled' | 'status-changed' | 'details-updated';
  updateDetails?: string;
  timestamp: string; // ISO 8601
}

export interface ExhibitorApprovalNotification {
  type: 'exhibitor-approved';
  expoId: string;
  expoTitle: string;
  exhibitorProfileId: string;
  timestamp: string;
}

export interface ExhibitorRejectionNotification {
  type: 'exhibitor-rejected';
  expoId: string;
  expoTitle: string;
  exhibitorProfileId: string;
  reason: string;
  timestamp: string;
}

export type Notification =
  | SessionReminderNotification
  | ScheduleChangeNotification
  | ExpoUpdateNotification
  | ExhibitorApprovalNotification
  | ExhibitorRejectionNotification;

export interface NotificationItem {
  id: string;
  notification: Notification;
  read: boolean;
  createdAt: Date | string; // Can be Date or string (after persistence rehydration)
}

export interface NotificationPreferences {
  channels: ('email' | 'in-app')[];
  defaultMinutesBefore: number; // Default reminder time in minutes
  soundEnabled: boolean;
}

