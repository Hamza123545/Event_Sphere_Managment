/**
 * Messaging API Service
 * Handles messaging API calls for exhibitors and attendees
 * Implements T169
 */

import api from './api';
import type {
  Message,
  SendMessageRequest,
  GetMessagesResponse,
  SendMessageResponse,
  UnreadCountResponse,
} from '../types/messaging';

/**
 * Get messages for the authenticated user
 * GET /exhibitor/messages or /attendee/messages
 */
export async function getMessages(options?: {
  type?: 'inbox' | 'sent';
  context?: string;
  relatedExpoId?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.context) params.append('context', options.context);
  if (options?.relatedExpoId) params.append('relatedExpoId', options.relatedExpoId);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  // Determine endpoint based on user role - we'll use a common endpoint or check role
  // For now, we'll use /exhibitor/messages (this should be dynamic based on role)
  const response = await api.get<GetMessagesResponse>(`/exhibitor/messages${params.toString() ? `?${params.toString()}` : ''}`);
  return response.data.data.messages;
}

/**
 * Get messages for attendee
 * GET /attendee/messages
 */
export async function getAttendeeMessages(options?: {
  type?: 'inbox' | 'sent';
  context?: string;
  relatedExpoId?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.context) params.append('context', options.context);
  if (options?.relatedExpoId) params.append('relatedExpoId', options.relatedExpoId);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await api.get<GetMessagesResponse>(`/attendee/messages${params.toString() ? `?${params.toString()}` : ''}`);
  return response.data.data.messages;
}

/**
 * Send a message
 * POST /exhibitor/messages or /attendee/messages
 */
export async function sendMessage(data: SendMessageRequest, role: 'exhibitor' | 'attendee' = 'exhibitor'): Promise<Message> {
  const endpoint = role === 'exhibitor' ? '/exhibitor/messages' : '/attendee/messages';
  const response = await api.post<SendMessageResponse>(endpoint, data);
  return response.data.data;
}

/**
 * Mark message as read
 * PUT /exhibitor/messages/:id/read or /attendee/messages/:id/read
 */
export async function markAsRead(messageId: string, role: 'exhibitor' | 'attendee' = 'exhibitor'): Promise<Message> {
  const endpoint = role === 'exhibitor' ? `/exhibitor/messages/${messageId}/read` : `/attendee/messages/${messageId}/read`;
  const response = await api.put<SendMessageResponse>(endpoint);
  return response.data.data;
}

/**
 * Get unread message count
 * GET /exhibitor/messages/unread/count or /attendee/messages/unread/count
 */
export async function getUnreadCount(role: 'exhibitor' | 'attendee' = 'exhibitor'): Promise<number> {
  const endpoint = role === 'exhibitor' ? '/exhibitor/messages/unread/count' : '/attendee/messages/unread/count';
  const response = await api.get<UnreadCountResponse>(endpoint);
  return response.data.data.count;
}

/**
 * Get messages for a specific conversation (between current user and another user)
 * This filters messages where either the current user is sender and otherUser is recipient,
 * or current user is recipient and otherUser is sender
 */
export async function getConversationMessages(
  otherUserId: string,
  role: 'exhibitor' | 'attendee' = 'exhibitor',
  options?: {
    limit?: number;
    beforeTimestamp?: string; // Load messages before this timestamp (for pagination)
  }
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const endpoint = role === 'exhibitor' ? '/exhibitor/messages' : '/attendee/messages';
  const limit = options?.limit || 15;
  
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('conversationWith', otherUserId);
  if (options?.beforeTimestamp) {
    params.append('beforeTimestamp', options.beforeTimestamp);
  }

  const response = await api.get<GetMessagesResponse>(`${endpoint}?${params.toString()}`);
  const messages = response.data.data.messages;
  
  // Determine if there are more messages (if we got the full limit, there might be more)
  // Also check pagination info if available
  const hasMore = messages.length === limit;
  
  return { messages, hasMore };
}

