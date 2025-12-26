/**
 * Modern Navbar Component
 * Based on the attendee Dashboard design with glass morphism
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Notifications,
  AutoAwesome,
  Mail,
  Feedback,
  Dashboard,
  Explore,
  Schedule,
  Add,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useMessagingStore } from '../../stores/messagingStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useThemeStore } from '../../stores/themeStore';
import { logout as logoutApi } from '../../services/authApi';
import { disconnectSocket } from '../../services/socket';
import { getActiveTheme, MotionBox, ActionButton } from '../../theme/designSystem';
import NotificationCenter from './NotificationCenter';

interface ModernNavbarProps {
  navItems?: Array<{ label: string; path: string }>;
  onCreateExpo?: () => void;
}

export default function ModernNavbar({ navItems = [], onCreateExpo }: ModernNavbarProps) {
  const navigate = useNavigate();
  const { user, logout: logoutStore } = useAuthStore();
  const { unreadCount, getUnreadCount } = useMessagingStore();
  const { unreadCount: notificationUnreadCount, initializeSocketListeners } = useNotificationsStore();
  const { mode, toggleMode } = useThemeStore();
  const activeTheme = getActiveTheme(mode);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  // Load unread count on mount and periodically
  useEffect(() => {
    if (user?.userId && (user.role === 'exhibitor' || user.role === 'attendee' || user.role === 'organizer' || user.role === 'admin')) {
      const role = user.role === 'attendee' ? 'attendee' : 'exhibitor';
      getUnreadCount(role);
      
      const interval = setInterval(() => {
        getUnreadCount(role);
      }, 30000);
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user?.userId, user?.role, getUnreadCount]);

  // Initialize notification socket listeners
  useEffect(() => {
    if (user?.userId) {
      initializeSocketListeners();
    }
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
      disconnectSocket();
      logoutStore();
      navigate('/login');
    }
    handleMenuClose();
  };

  const handleProfile = () => {
    handleMenuClose();
    if (user?.role === 'organizer' || user?.role === 'admin') {
      navigate('/organizer/profile');
    } else if (user?.role === 'exhibitor') {
      navigate('/exhibitor/settings');
    } else if (user?.role === 'attendee') {
      navigate('/attendee/profile');
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'organizer':
      case 'admin':
        return '/organizer';
      case 'exhibitor':
        return '/exhibitor';
      case 'attendee':
        return '/attendee';
      default:
        return '/';
    }
  };

  const userInitials = user?.profile?.firstName?.[0] && user?.profile?.lastName?.[0]
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'A';

  const userName = user?.profile?.firstName 
    ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <>
      <MotionBox 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: {xs: 3, md: 8}, 
          py: 2.5, 
          borderBottom: `1px solid ${activeTheme.border}`,
          bgcolor: 'rgba(2, 6, 23, 0.8)', 
          backdropFilter: 'blur(12px)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MotionBox 
            whileHover={{ rotate: 180 }}
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: activeTheme.accent, 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <AutoAwesome sx={{ color: '#fff', fontSize: '1.2rem' }} />
          </MotionBox>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              letterSpacing: '-1px',
              cursor: 'pointer'
            }}
            onClick={() => navigate(getDashboardPath())}
          >
            EventCore
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Role-based navigation items */}
          <Box sx={{ display: {xs: 'none', md: 'flex'}, gap: 3, alignItems: 'center' }}>
            {/* Organizer/Admin Navigation */}
            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <>
                <Typography 
                  onClick={() => navigate('/organizer')}
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: activeTheme.textSecondary,
                    cursor: 'pointer', 
                    transition: 'color 0.2s', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {color: activeTheme.accent} 
                  }}
                >
                  <Dashboard sx={{ fontSize: '1.1rem' }} />
                  Dashboard
                </Typography>
                <Tooltip title="Messages">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/organizer/messages')}
                  >
                    <Badge badgeContent={unreadCount} color="error" showZero={false}>
                      <Mail />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Feedback">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/organizer/feedback')}
                  >
                    <Feedback />
                  </IconButton>
                </Tooltip>
                {onCreateExpo && (
                  <ActionButton
                    primary
                    startIcon={<Add />}
                    onClick={onCreateExpo}
                    sx={{ ml: 1 }}
                  >
                    Create Expo
                  </ActionButton>
                )}
              </>
            )}

            {/* Exhibitor Navigation */}
            {user?.role === 'exhibitor' && (
              <>
                <Typography 
                  onClick={() => navigate('/exhibitor')}
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: activeTheme.textSecondary,
                    cursor: 'pointer', 
                    transition: 'color 0.2s', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {color: activeTheme.accent} 
                  }}
                >
                  <Dashboard sx={{ fontSize: '1.1rem' }} />
                  Dashboard
                </Typography>
                <Tooltip title="Messages">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/exhibitor/messages')}
                  >
                    <Badge badgeContent={unreadCount} color="error" showZero={false}>
                      <Mail />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Feedback">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/exhibitor/feedback')}
                  >
                    <Feedback />
                  </IconButton>
                </Tooltip>
                <ActionButton
                  primary
                  startIcon={<Explore />}
                  onClick={() => navigate('/exhibitor/browse')}
                  sx={{ ml: 1 }}
                >
                  Browse Expos
                </ActionButton>
              </>
            )}

            {/* Attendee Navigation */}
            {user?.role === 'attendee' && (
              <>
                <Typography 
                  onClick={() => navigate('/attendee')}
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: activeTheme.textSecondary,
                    cursor: 'pointer', 
                    transition: 'color 0.2s', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {color: activeTheme.accent} 
                  }}
                >
                  <Dashboard sx={{ fontSize: '1.1rem' }} />
                  Dashboard
                </Typography>
                <Typography 
                  onClick={() => navigate('/attendee/browse')}
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: activeTheme.textSecondary,
                    cursor: 'pointer', 
                    transition: 'color 0.2s', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {color: activeTheme.accent} 
                  }}
                >
                  <Explore sx={{ fontSize: '1.1rem' }} />
                  Browse
                </Typography>
                <Typography 
                  onClick={() => navigate('/attendee/schedule')}
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: activeTheme.textSecondary,
                    cursor: 'pointer', 
                    transition: 'color 0.2s', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {color: activeTheme.accent} 
                  }}
                >
                  <Schedule sx={{ fontSize: '1.1rem' }} />
                  Schedule
                </Typography>
                <Tooltip title="Messages">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/attendee/messages')}
                  >
                    <Badge badgeContent={unreadCount} color="error" showZero={false}>
                      <Mail />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Feedback">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/attendee/feedback')}
                  >
                    <Feedback />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Search Expos">
                  <IconButton 
                    sx={{ color: activeTheme.textSecondary }}
                    onClick={() => navigate('/attendee/expos')}
                  >
                    <Search />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* Custom nav items if provided */}
            {navItems.length > 0 && navItems.map((item) => (
              <Typography 
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600, 
                  color: activeTheme.textSecondary,
                  cursor: 'pointer', 
                  transition: 'color 0.2s', 
                  '&:hover': {color: activeTheme.accent} 
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Theme Toggle */}
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton 
                sx={{ color: activeTheme.textSecondary }}
                onClick={toggleMode}
              >
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                sx={{ color: activeTheme.textSecondary }}
                onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              >
                <Badge badgeContent={notificationUnreadCount} color="error" showZero={false}>
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Avatar */}
            <Avatar 
              src={user?.profile?.avatar} 
              sx={{ 
                width: 38, 
                height: 38, 
                border: `2px solid ${activeTheme.accent}`,
                cursor: 'pointer',
                bgcolor: activeTheme.accent
              }}
              onClick={handleMenuOpen}
            >
              {userInitials}
            </Avatar>
          </Box>
        </Box>
      </MotionBox>

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
        PaperProps={{
          sx: {
            bgcolor: activeTheme.surface,
            border: `1px solid ${activeTheme.border}`,
            mt: 1,
            minWidth: 200,
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ color: activeTheme.textSecondary }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: activeTheme.border }} />
        <MenuItem 
          onClick={handleProfile}
          sx={{ 
            color: activeTheme.textPrimary,
            '&:hover': { bgcolor: activeTheme.surfaceLight }
          }}
        >
          Profile
        </MenuItem>
        <Divider sx={{ borderColor: activeTheme.border }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: activeTheme.error,
            '&:hover': { bgcolor: `${activeTheme.error}20` }
          }}
        >
          Logout
        </MenuItem>
      </Menu>

      <NotificationCenter
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
      />
    </>
  );
}

