/**
 * AppBar Component
 * Implements T061: User Story 1 - Navigation menu for organizer role
 * Dashboard, Create Expo, Profile, Logout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import { Add, Dashboard, Person, ExitToApp, Explore, Schedule, Mail, Notifications, Feedback } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useMessagingStore } from '../../stores/messagingStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { logout as logoutApi } from '../../services/authApi';
import { disconnectSocket } from '../../services/socket';
import ConnectionStatus from './ConnectionStatus';
import NotificationCenter from './NotificationCenter';

interface AppBarProps {
  onCreateExpo?: () => void;
  onBrowseExpos?: () => void;
  title?: string;
}

export default function AppBar({ onCreateExpo, onBrowseExpos, title = 'EventSphere' }: AppBarProps) {
  const navigate = useNavigate();
  const { user, logout: logoutStore } = useAuthStore();
  const { unreadCount, getUnreadCount } = useMessagingStore();
  const { unreadCount: notificationUnreadCount, initializeSocketListeners } = useNotificationsStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  // Load unread count on mount and periodically (T174)
  // For exhibitors, attendees, organizers, and admins
  useEffect(() => {
    if (user?.userId && (user.role === 'exhibitor' || user.role === 'attendee' || user.role === 'organizer' || user.role === 'admin')) {
      // Attendees use attendee endpoint, everyone else uses exhibitor endpoint
      const role = user.role === 'attendee' ? 'attendee' : 'exhibitor';
      getUnreadCount(role);
      
      // Refresh unread count every 30 seconds
      const interval = setInterval(() => {
        getUnreadCount(role);
      }, 30000);
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user?.userId, user?.role, getUnreadCount]);

  // Initialize notification socket listeners (T208)
  useEffect(() => {
    if (user?.userId) {
      // Delay slightly to ensure socket connection is established
      const timer = setTimeout(() => {
        initializeSocketListeners();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user?.userId, initializeSocketListeners]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      disconnectSocket();
      logoutStore();
      navigate('/login');
    } catch {
      // Even if API call fails, clear local state and redirect
      disconnectSocket();
      logoutStore();
      navigate('/login');
    }
    handleMenuClose();
  };

  const handleProfile = () => {
    handleMenuClose();
    // Navigate to profile page based on user role
    if (user?.role === 'organizer' || user?.role === 'admin') {
      navigate('/organizer/profile');
    } else if (user?.role === 'exhibitor') {
      navigate('/exhibitor/settings');
    } else if (user?.role === 'attendee') {
      navigate('/attendee/profile');
    }
  };

  const userInitials = user?.profile?.firstName?.[0] && user?.profile?.lastName?.[0]
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <MuiAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          {title}
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          {user?.role === 'organizer' || user?.role === 'admin' ? (
            <>
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/organizer')}
              >
                Dashboard
              </Button>
              <IconButton
                color="inherit"
                onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              >
                <Badge badgeContent={notificationUnreadCount} color="error" showZero={false}>
                  <Notifications />
                </Badge>
              </IconButton>
              <Button
                color="inherit"
                startIcon={<Feedback />}
                onClick={() => navigate('/organizer/feedback')}
              >
                Feedback
              </Button>
              <Button
                color="inherit"
                startIcon={
                  <Badge badgeContent={unreadCount} color="error" showZero={false}>
                    <Mail />
                  </Badge>
                }
                onClick={() => navigate('/organizer/messages')}
              >
                Messages {unreadCount > 0 && `(${unreadCount})`}
              </Button>
              {onCreateExpo && (
                <Button
                  color="inherit"
                  startIcon={<Add />}
                  onClick={onCreateExpo}
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.5)', color: 'white' }}
                >
                  Create Expo
                </Button>
              )}
            </>
          ) : user?.role === 'exhibitor' ? (
            <>
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/exhibitor')}
              >
                Dashboard
              </Button>
              <IconButton
                color="inherit"
                onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              >
                <Badge badgeContent={notificationUnreadCount} color="error" showZero={false}>
                  <Notifications />
                </Badge>
              </IconButton>
              <Button
                color="inherit"
                startIcon={<Feedback />}
                onClick={() => navigate('/exhibitor/feedback')}
              >
                Feedback
              </Button>
              <Button
                color="inherit"
                startIcon={
                  <Badge badgeContent={unreadCount} color="error" showZero={false}>
                    <Mail />
                  </Badge>
                }
                onClick={() => navigate('/exhibitor/messages')}
              >
                Messages {unreadCount > 0 && `(${unreadCount})`}
              </Button>
              {onBrowseExpos && (
                <Button
                  color="inherit"
                  startIcon={<Add />}
                  onClick={onBrowseExpos}
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.5)', color: 'white' }}
                >
                  Browse Expos
                </Button>
              )}
            </>
          ) : user?.role === 'attendee' ? (
            <>
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/attendee')}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                startIcon={<Explore />}
                onClick={() => navigate('/attendee/browse')}
              >
                Browse Expos
              </Button>
              <Button
                color="inherit"
                startIcon={<Schedule />}
                onClick={() => navigate('/attendee/schedule')}
              >
                My Schedule
              </Button>
              <Button
                color="inherit"
                startIcon={<Feedback />}
                onClick={() => navigate('/attendee/feedback')}
              >
                Feedback
              </Button>
              <IconButton
                color="inherit"
                onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              >
                <Badge badgeContent={notificationUnreadCount} color="error" showZero={false}>
                  <Notifications />
                </Badge>
              </IconButton>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<Dashboard />}
              onClick={() => navigate(`/${user?.role || 'login'}`)}
            >
              Dashboard
            </Button>
          )}
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConnectionStatus />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.profile?.firstName || user.email}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
              aria-label="account menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {userInitials}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>
                <Person sx={{ mr: 1 }} fontSize="small" />
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
      <NotificationCenter
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
      />
    </MuiAppBar>
  );
}

