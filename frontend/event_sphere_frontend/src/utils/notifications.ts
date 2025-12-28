/**
 * Toast Notifications Utility
 * Prominent visual alerts for critical updates
 * Implements T209
 */

// Toast notifications using console for now - can be replaced with notistack or MUI Snackbar
// For production, use: import { enqueueSnackbar, OptionsObject } from 'notistack';
import type { Notification } from '../types/notifications';

// Simple toast implementation - replace with notistack in production
function showToast(message: string, variant: 'success' | 'error' | 'warning' | 'info'): void {
  // For now, just log to console
  // In production, replace with: enqueueSnackbar(message, { variant });
  console.log(`[${variant.toUpperCase()}] ${message}`);
  
  // You can also show browser notifications if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('EventSphere', {
      body: message,
      icon: '/favicon.ico',
    });
  }
}

/**
 * Show toast notification for critical updates
 */
export function showNotificationToast(notification: Notification): void {
  const message = getMessage(notification);
  const title = getTitle(notification);
  const variant = getVariant(notification);

  // Show toast notification - convert 'default' to 'info'
  const toastVariant = variant === 'default' ? 'info' : variant;
  showToast(`${title}: ${message}`, toastVariant);

  // For critical updates, also show browser notification if available
  if (isCritical(notification) && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        requireInteraction: true, // Critical updates require user interaction
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
        }
      });
    }
  }
}

function getVariant(notification: Notification): 'default' | 'error' | 'warning' | 'info' | 'success' {
  switch (notification.type) {
    case 'session-reminder':
      return 'info';
    case 'schedule-changed':
      return 'warning';
    case 'expo-updated':
      if (notification.updateType === 'cancelled') {
        return 'error';
      }
      return 'info';
    case 'exhibitor-approved':
      return 'success';
    case 'exhibitor-rejected':
      return 'warning';
    default:
      return 'default';
  }
}


function isCritical(notification: Notification): boolean {
  return (
    notification.type === 'expo-updated' && notification.updateType === 'cancelled'
  ) || notification.type === 'schedule-changed';
}

function getTitle(notification: Notification): string {
  switch (notification.type) {
    case 'session-reminder':
      return `Session Reminder: ${notification.session.title}`;
    case 'schedule-changed':
      return `Schedule Updated: ${notification.session.title}`;
    case 'expo-updated':
      if (notification.updateType === 'cancelled') {
        return `⚠️ Expo Cancelled: ${notification.expoTitle}`;
      }
      return `Expo Updated: ${notification.expoTitle}`;
    case 'exhibitor-approved':
      return `✓ Application Approved: ${notification.expoTitle}`;
    case 'exhibitor-rejected':
      return `Application Update: ${notification.expoTitle}`;
    default:
      return 'Notification';
  }
}

function getMessage(notification: Notification): string {
  switch (notification.type) {
    case 'session-reminder':
      return `Starts in ${notification.minutesUntilStart} minutes at ${notification.session.location.room}`;
    case 'schedule-changed':
      const changeType = notification.session.changeType;
      return `The ${changeType === 'time' ? 'time' : changeType === 'location' ? 'location' : 'details'} for this session has been updated.`;
    case 'expo-updated':
      return notification.updateDetails || 'Details have been updated';
    case 'exhibitor-approved':
      return 'Your application has been approved. You can now select a booth.';
    case 'exhibitor-rejected':
      return `Reason: ${notification.reason || 'No reason provided'}`;
    default:
      return '';
  }
}

