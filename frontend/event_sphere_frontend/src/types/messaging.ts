/**
 * Messaging TypeScript Types
 * Type definitions for messaging functionality per contracts/exhibitor-api.yaml and attendee-api.yaml
 */

export interface Message {
  messageId: string;
  sender: {
    userId: string;
    name: string;
    role: string;
  };
  recipient: {
    userId: string;
    name: string;
  };
  subject?: string;
  content: string;
  context: 'general-inquiry' | 'exhibitor-collaboration' | 'support-request' | 'organizer-communication';
  relatedExpo?: {
    expoId: string;
    title: string;
  };
  timestamp: string;
  isRead: boolean;
  readAt?: string;
}

export interface SendMessageRequest {
  recipientId: string;
  subject?: string;
  content: string;
  context: 'general-inquiry' | 'exhibitor-collaboration' | 'support-request' | 'organizer-communication';
  relatedExpoId?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface NewMessageEvent {
  type: 'new-message';
  messageId: string;
  sender: {
    userId: string;
    name: string;
    role: string;
  };
  subject?: string;
  preview: string;
  timestamp: string;
}

