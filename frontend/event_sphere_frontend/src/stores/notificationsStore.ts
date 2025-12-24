/**
 * Notifications Store
 * Manages notifications list, unread count, and operations
 * Implements T201, T205
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationItem, NotificationPreferences } from '../types/notifications';
import { getSocket } from '../services/socket';
import { showNotificationToast } from '../utils/notifications';

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  initializeSocketListeners: () => void;
  removeSocketListeners: () => void;
}

const defaultPreferences: NotificationPreferences = {
  channels: ['email', 'in-app'],
  defaultMinutesBefore: 60,
  soundEnabled: true,
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => {
      let socketListenersInitialized = false;
      let socket: ReturnType<typeof getSocket> | null = null;

      const initializeSocketListeners = () => {
        if (socketListenersInitialized) return;

        socket = getSocket();
        if (!socket) return;

        // Listen for session-reminder event (T205)
        socket.on('session-reminder', (data: Notification) => {
          get().addNotification(data);
          showNotificationToast(data);

          // Play sound if preferences allow
          const { preferences } = get();
          if (preferences.soundEnabled) {
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                // Ignore errors if audio file doesn't exist or can't play
              });
            } catch (error) {
              // Ignore audio errors
            }
          }
        });

        // Listen for schedule-changed event (T205)
        socket.on('schedule-changed', (data: Notification) => {
          get().addNotification(data);
          showNotificationToast(data); // Critical update - always show toast
        });

        // Listen for expo-updated event (T205)
        socket.on('expo-updated', (data: Notification) => {
          get().addNotification(data);
          showNotificationToast(data); // Critical update - always show toast
        });

        // Listen for exhibitor-approved event
        socket.on('exhibitor-approved', (data: Notification) => {
          get().addNotification(data);
          showNotificationToast(data);
        });

        // Listen for exhibitor-rejected event
        socket.on('exhibitor-rejected', (data: Notification) => {
          get().addNotification(data);
          showNotificationToast(data);
        });

        socketListenersInitialized = true;
      };

      const removeSocketListeners = () => {
        if (!socket) return;

        socket.off('session-reminder');
        socket.off('schedule-changed');
        socket.off('expo-updated');
        socket.off('exhibitor-approved');
        socket.off('exhibitor-rejected');

        socketListenersInitialized = false;
        socket = null;
      };

      return {
        notifications: [],
        unreadCount: 0,
        preferences: defaultPreferences,

        addNotification: (notification: Notification) => {
          const newItem: NotificationItem = {
            id: `${notification.type}-${Date.now()}-${Math.random()}`,
            notification,
            read: false,
            createdAt: new Date(),
          };

          set((state) => ({
            notifications: [newItem, ...state.notifications].slice(0, 100), // Keep last 100 notifications
            unreadCount: state.unreadCount + 1,
          }));
        },

        markAsRead: (notificationId: string) => {
          set((state) => {
            const updatedNotifications = state.notifications.map((item) =>
              item.id === notificationId && !item.read
                ? { ...item, read: true }
                : item
            );

            const unreadCount = updatedNotifications.filter((item) => !item.read).length;

            return {
              notifications: updatedNotifications,
              unreadCount,
            };
          });
        },

        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map((item) => ({ ...item, read: true })),
            unreadCount: 0,
          }));
        },

        clearNotifications: () => {
          set({
            notifications: [],
            unreadCount: 0,
          });
        },

        updatePreferences: (preferences: Partial<NotificationPreferences>) => {
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          }));
        },

        initializeSocketListeners,
        removeSocketListeners,
      };
    },
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        preferences: state.preferences,
      }),
    }
  )
);

