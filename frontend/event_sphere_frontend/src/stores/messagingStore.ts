/**
 * Messaging Zustand Store
 * Manages messaging state, operations, and real-time updates
 * Implements T167, T175
 */

import { create } from 'zustand';
import * as messagingApi from '../services/messagingApi';
import { getSocket, onSocketEvent, offSocketEvent, joinUserRoom, leaveUserRoom } from '../services/socket';
import type { Message, SendMessageRequest, NewMessageEvent } from '../types/messaging';
import { useAuthStore } from './authStore';

interface MessagingState {
  // State
  messages: Message[];
  inboxMessages: Message[];
  sentMessages: Message[];
  unreadCount: number;
  selectedMessage: Message | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  getMessages: (options?: {
    type?: 'inbox' | 'sent';
    context?: string;
    relatedExpoId?: string;
  }) => Promise<void>;
  sendMessage: (data: SendMessageRequest, role: 'exhibitor' | 'attendee') => Promise<void>;
  markAsRead: (messageId: string, role: 'exhibitor' | 'attendee') => Promise<void>;
  getUnreadCount: (role: 'exhibitor' | 'attendee') => Promise<void>;
  setSelectedMessage: (message: Message | null) => void;
  clearError: () => void;
  subscribeToMessageUpdates: (userId: string) => void;
  unsubscribeFromMessageUpdates: () => void;
  newMessageNotification: { message: Message; preview: string } | null;
  clearNewMessageNotification: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  // Initial state
  messages: [],
  inboxMessages: [],
  sentMessages: [],
  unreadCount: 0,
  selectedMessage: null,
  isLoading: false,
  error: null,
  newMessageNotification: null,

  // Get messages
  getMessages: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      const role = user?.role === 'attendee' ? 'attendee' : 'exhibitor';
      const messages =
        role === 'attendee' ? await messagingApi.getAttendeeMessages(options) : await messagingApi.getMessages(options);
      
      set({
        messages,
        inboxMessages: messages.filter((msg) => !options?.type || options.type === 'inbox'),
        sentMessages: messages.filter((msg) => options?.type === 'sent'),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  // Send message
  sendMessage: async (data, role) => {
    set({ isLoading: true, error: null });
    try {
      const newMessage = await messagingApi.sendMessage(data, role);
      set((state) => ({
        messages: [newMessage, ...state.messages],
        sentMessages: [newMessage, ...state.sentMessages],
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (messageId, role) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMessage = await messagingApi.markAsRead(messageId, role);
      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg.messageId === messageId ? updatedMessage : msg
        );
        const unreadCount = updatedMessages.filter((msg) => !msg.isRead).length;
        return {
          messages: updatedMessages,
          inboxMessages: updatedMessages.filter((msg) => !msg.isRead || msg.isRead),
          selectedMessage: state.selectedMessage?.messageId === messageId ? updatedMessage : state.selectedMessage,
          unreadCount,
          isLoading: false,
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark message as read';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async (role) => {
    try {
      const count = await messagingApi.getUnreadCount(role);
      set({ unreadCount: count });
    } catch (error: any) {
      // Don't set error, just log
      console.error('Failed to get unread count:', error);
    }
  },

  // Set selected message
  setSelectedMessage: (message) => {
    set({ selectedMessage: message });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Subscribe to real-time message updates (T175)
  subscribeToMessageUpdates: (userId: string) => {
    // Join user room for message notifications
    joinUserRoom(userId);

    // Handle new-message event
    const handleNewMessage = (event: NewMessageEvent) => {
      // Refresh messages and unread count
      const state = get();
      state.getMessages({ type: 'inbox' });
      const user = useAuthStore.getState().user;
      const role = user?.role === 'attendee' ? 'attendee' : 'exhibitor';
      state.getUnreadCount(role);

      // Set notification for UI display
      set({
        newMessageNotification: {
          message: {
            messageId: event.messageId,
            sender: event.sender,
            recipient: { userId: userId, name: '' }, // Will be populated when message is fetched
            subject: event.subject,
            content: event.preview,
            context: 'general-inquiry', // Default, will be updated
            timestamp: event.timestamp,
            isRead: false,
          },
          preview: event.preview,
        },
      });
    };

    // Subscribe to events
    const socket = getSocket();
    if (socket) {
      onSocketEvent('new-message', handleNewMessage);
      (socket as any)._newMessageHandler = handleNewMessage;
    }
  },

  // Unsubscribe from message updates
  unsubscribeFromMessageUpdates: () => {
    const socket = getSocket();
    if (socket) {
      const handler = (socket as any)._newMessageHandler;
      if (handler) {
        offSocketEvent('new-message', handler);
        delete (socket as any)._newMessageHandler;
      }
    }
  },

  // Clear new message notification
  clearNewMessageNotification: () => {
    set({ newMessageNotification: null });
  },
}));

