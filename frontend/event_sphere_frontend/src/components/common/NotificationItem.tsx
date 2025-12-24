/**
 * NotificationItem Component
 * Displays individual notification with icon, title, message, timestamp, read/unread indicator
 * Implements T204
 */

import { ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import {
  Event,
  Schedule,
  Warning,
  CheckCircle,
  Cancel,
  Info,
  FiberManualRecord,
} from '@mui/icons-material';
import type { NotificationItem as NotificationItemType } from '../../types/notifications';
// Helper to format time ago
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

interface NotificationItemProps {
  notification: NotificationItemType;
  onClick?: () => void;
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { notification: notif, read, createdAt } = notification;

  const getIcon = () => {
    switch (notif.type) {
      case 'session-reminder':
        return <Event color="primary" />;
      case 'schedule-changed':
        return <Schedule color="warning" />;
      case 'expo-updated':
        if (notif.updateType === 'cancelled') {
          return <Cancel color="error" />;
        }
        return <Info color="info" />;
      case 'exhibitor-approved':
        return <CheckCircle color="success" />;
      case 'exhibitor-rejected':
        return <Warning color="warning" />;
      default:
        return <Info />;
    }
  };

  const getTitle = () => {
    switch (notif.type) {
      case 'session-reminder':
        return `Session Reminder: ${notif.session.title}`;
      case 'schedule-changed':
        return `Schedule Updated: ${notif.session.title}`;
      case 'expo-updated':
        if (notif.updateType === 'cancelled') {
          return `Expo Cancelled: ${notif.expoTitle}`;
        }
        return `Expo Updated: ${notif.expoTitle}`;
      case 'exhibitor-approved':
        return `Application Approved: ${notif.expoTitle}`;
      case 'exhibitor-rejected':
        return `Application Rejected: ${notif.expoTitle}`;
      default:
        return 'Notification';
    }
  };

  const getMessage = () => {
    switch (notif.type) {
      case 'session-reminder':
        return `Starts in ${notif.minutesUntilStart} minutes at ${notif.session.location.room}`;
      case 'schedule-changed':
        const changeTypeLabel =
          notif.session.changeType === 'time'
            ? 'time'
            : notif.session.changeType === 'location'
            ? 'location'
            : 'details';
        return `The ${changeTypeLabel} for this session has been updated`;
      case 'expo-updated':
        return notif.updateDetails || 'Details have been updated';
      case 'exhibitor-approved':
        return 'Your application has been approved. You can now select a booth.';
      case 'exhibitor-rejected':
        return `Reason: ${notif.reason || 'No reason provided'}`;
      default:
        return '';
    }
  };

  const getColor = () => {
    switch (notif.type) {
      case 'session-reminder':
        return 'primary';
      case 'schedule-changed':
        return 'warning';
      case 'expo-updated':
        if (notif.updateType === 'cancelled') {
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
  };

  return (
    <ListItem
      button
      onClick={onClick}
      sx={{
        bgcolor: read ? 'transparent' : 'action.hover',
        borderLeft: !read ? `3px solid` : 'none',
        borderLeftColor: !read ? `${getColor()}.main` : 'transparent',
        '&:hover': {
          bgcolor: 'action.selected',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        {getIcon()}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: read ? 'normal' : 'bold' }}>
              {getTitle()}
            </Typography>
            {!read && (
              <FiberManualRecord sx={{ fontSize: 8, color: `${getColor()}.main` }} />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {getMessage()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {formatTimeAgo(createdAt)}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
}

