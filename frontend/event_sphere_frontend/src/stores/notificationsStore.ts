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

      const setupListeners = () => {
        if (!socket || !socket.connected) {
          console.log('[Notifications] Socket not connected, skipping listener setup');
          return;
        }

        // Remove existing listeners first to avoid duplicates
        socket.off('session-reminder');
        socket.off('schedule-changed');
        socket.off('expo-updated');
        socket.off('exhibitor-approved');
        socket.off('exhibitor-rejected');

        // Listen for session-reminder event (T205)
        socket.on('session-reminder', (data: Notification) => {
          console.log('[Notifications] Received session-reminder:', data);
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
            } catch {
              // Ignore audio errors
            }
          }
        });

        // Listen for schedule-changed event (T205)
        socket.on('schedule-changed', (data: Notification) => {
          console.log('[Notifications] Received schedule-changed:', data);
          get().addNotification(data);
          showNotificationToast(data); // Critical update - always show toast
        });

        // Listen for expo-updated event (T205)
        socket.on('expo-updated', (data: Notification) => {
          console.log('[Notifications] Received expo-updated:', data);
          get().addNotification(data);
          showNotificationToast(data); // Critical update - always show toast
        });

        // Listen for exhibitor-approved event
        socket.on('exhibitor-approved', (data: Notification) => {
          console.log('[Notifications] Received exhibitor-approved:', data);
          get().addNotification(data);
          showNotificationToast(data);
        });

        // Listen for exhibitor-rejected event
        socket.on('exhibitor-rejected', (data: Notification) => {
          console.log('[Notifications] Received exhibitor-rejected:', data);
          get().addNotification(data);
          showNotificationToast(data);
        });

        console.log('[Notifications] Socket listeners initialized successfully');
        socketListenersInitialized = true;
      };

      const initializeSocketListeners = () => {
        socket = getSocket();
        if (!socket) {
          console.log('[Notifications] Socket not available, will retry on connect');
          return;
        }

        // If socket is already connected, set up listeners immediately
        if (socket.connected) {
          setupListeners();
        } else {
          // Otherwise, wait for connection
          const handleConnect = () => {
            console.log('[Notifications] Socket connected, setting up listeners');
            setupListeners();
          };
          
          // Set up listeners on connect (fires on both initial connect and reconnect)
          socket.on('connect', handleConnect);
          
          // Also handle explicit reconnection events
          socket.on('reconnect', () => {
            console.log('[Notifications] Socket reconnected, re-initializing listeners');
            socketListenersInitialized = false; // Allow re-initialization
            setupListeners();
          });
          
          // Poll for connection if not already connected (fallback)
          const checkConnection = setInterval(() => {
            socket = getSocket(); // Refresh socket reference
            if (socket?.connected && !socketListenersInitialized) {
              setupListeners();
              clearInterval(checkConnection);
            }
          }, 500);
          
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(checkConnection), 10000);
        }
      };

      const removeSocketListeners = () => {
        if (!socket) return;

        console.log('[Notifications] Removing socket listeners');
        socket.off('session-reminder');
        socket.off('schedule-changed');
        socket.off('expo-updated');
        socket.off('exhibitor-approved');
        socket.off('exhibitor-rejected');
        socket.off('connect');
        socket.off('reconnect');

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

