/**
 * NotificationCenter Component
 * Dropdown notification list with mark all read button
 * Implements T203
 */

import { useState, useEffect } from 'react';
import {
  Popover,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  List,
  IconButton,
  Tooltip,
} from '@mui/material';
import { NotificationsOff, ClearAll } from '@mui/icons-material';
import { useNotificationsStore } from '../../stores/notificationsStore';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ anchorEl, open, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } =
    useNotificationsStore();

  useEffect(() => {
    if (open) {
      // Initialize socket listeners when notification center opens
      useNotificationsStore.getState().initializeSocketListeners();
    }
  }, [open]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearNotifications();
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Could navigate to relevant page here
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: '90vw',
          maxHeight: 600,
          mt: 1,
        },
      }}
    >
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={handleMarkAllAsRead}>
                  <ClearAll fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip title="Clear all">
                <IconButton size="small" onClick={handleClearAll}>
                  <NotificationsOff fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Divider />
        <List sx={{ maxHeight: 500, overflow: 'auto', p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))
          )}
        </List>
      </Paper>
    </Popover>
  );
}

