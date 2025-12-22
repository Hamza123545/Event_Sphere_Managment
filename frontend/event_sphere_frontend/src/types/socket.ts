/**
 * Real-time event types for Socket.io
 * TypeScript interfaces for all events from contracts/realtime-events.md
 * Implements constitutional requirement for Real-Time Architecture
 */

import type { ExpoUpdatedEvent } from './expo';

// Define events that the server sends to the client
export interface ServerToClientEvents {
  'expo-updated': (data: ExpoUpdatedEvent) => void;
  'schedule-changed': (data: { expoId: string; schedule: any }) => void;
  'booth-allocated': (data: { expoId: string; boothId: string; exhibitorId: string }) => void;
  'booth-released': (data: { expoId: string; boothId: string }) => void;
  'exhibitor-approved': (data: { exhibitorId: string; expoId: string }) => void;
  'exhibitor-rejected': (data: { exhibitorId: string; expoId: string; reason: string }) => void;
  'new-message': (data: { message: any }) => void; // Generic message type
  'session-reminder': (data: { sessionId: string; message: string }) => void;
  'event-notification': (data: { type: string; message: string; details?: any }) => void;
}

// Define events that the client sends to the server
export interface ClientToServerEvents {
  'join-expo': (expoId: string) => void;
  'leave-expo': (expoId: string) => void;
  'send-message': (data: { recipientId: string; content: string; context: string; relatedExpoId?: string }) => void;
  // Add more client-to-server events as needed
}

// Define user roles for type safety
export type UserRole = 'admin' | 'organizer' | 'exhibitor' | 'attendee';
