/**
 * Public Navigation Bar Component
 * Used for landing page, about, contact pages
 * Shows Login/Signup when not authenticated, user menu when authenticated
 */

import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Typography,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useScrollTrigger,
  Slide,
} from '@mui/material';
import {
  ExitToApp,
  Dashboard,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { logout as logoutApi } from '../../services/authApi';
import { disconnectSocket } from '../../services/socket';
import { getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';

interface Props {
  window?: () => Window;
  children: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { user, logout: logoutStore, isAuthenticated } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getActiveTheme(mode);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      disconnectSocket();
      logoutStore();
      navigate('/');
      handleMenuClose();
    } catch {
      disconnectSocket();
      logoutStore();
      navigate('/');
      handleMenuClose();
    }
  };

  const handleDashboard = () => {
    if (user?.role) {
      navigate(`/${user.role}`);
    }
    handleMenuClose();
    handleMobileMenuClose();
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (window.location.pathname === '/') {
        // If on home page but element not found yet, wait a bit
        setTimeout(() => {
          const element = document.querySelector(path);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        // Navigate to home and then scroll
        navigate(`/${path}`);
      }
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Services', path: '#services' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="sticky"
          sx={{
            background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceLight} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.1)`,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <Container maxWidth="xl">
            <Toolbar sx={{ py: 1, justifyContent: 'space-between' }}>
              {/* Logo */}
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.accent} 0%, #a78bfa 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                  }}
                >
                  EventSphere
                </Typography>
              </Box>

              {/* Desktop Navigation */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    component={link.path.startsWith('#') ? 'a' : RouterLink}
                    to={link.path.startsWith('#') ? undefined : link.path}
                    href={link.path.startsWith('#') ? link.path : undefined}
                    onClick={link.path.startsWith('#') ? (e) => handleNavClick(link.path, e) : undefined}
                    sx={{
                      color: theme.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      '&:hover': {
                        color: theme.accent,
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                ))}

                {isAuthenticated && user ? (
                  <>
                    <Button
                      onClick={handleDashboard}
                      sx={{
                        color: theme.textSecondary,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        '&:hover': {
                          color: theme.accent,
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Dashboard
                    </Button>
                    <IconButton
                      onClick={handleMenuOpen}
                      sx={{
                        ml: 1,
                        border: `1px solid ${theme.border}`,
                        '&:hover': {
                          borderColor: theme.accent,
                        },
                      }}
                    >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: theme.accent,
                        fontSize: '0.875rem',
                      }}
                    >
                      {user.profile?.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Button
                      component={RouterLink}
                      to="/login"
                      sx={{
                        color: theme.textSecondary,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        '&:hover': {
                          color: theme.accent,
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="contained"
                      sx={{
                        background: `linear-gradient(135deg, ${theme.accent} 0%, #7c3aed 100%)`,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        px: 3,
                        borderRadius: '12px',
                        boxShadow: `0 4px 14px ${theme.accentGlow}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)`,
                          boxShadow: `0 6px 20px ${theme.accentGlow}`,
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </Box>

              {/* Mobile Menu Button */}
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuOpen}
                sx={{ display: { xs: 'block', md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* User Menu */}
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
            mt: 1.5,
            minWidth: 200,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.accent,
                fontSize: '0.875rem',
              }}
            >
              {user?.profile?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.textPrimary }}>
                {user?.profile?.firstName 
                  ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
                  : user?.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.textSecondary }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider sx={{ borderColor: theme.border }} />
        <MenuItem
          onClick={handleDashboard}
          sx={{
            py: 1.5,
            color: theme.textPrimary,
            '&:hover': { backgroundColor: theme.surfaceLight },
          }}
        >
          <Dashboard sx={{ mr: 1.5, fontSize: '1.25rem' }} />
          Dashboard
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: theme.error,
            '&:hover': { backgroundColor: theme.surfaceLight },
          }}
        >
          <ExitToApp sx={{ mr: 1.5, fontSize: '1.25rem' }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 250,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
          },
        }}
      >
        {navLinks.map((link) => (
          <MenuItem
            key={link.path}
            component={link.path.startsWith('#') ? 'a' : RouterLink}
            to={link.path.startsWith('#') ? undefined : link.path}
            href={link.path.startsWith('#') ? link.path : undefined}
            onClick={(e) => {
              handleMobileMenuClose();
              if (link.path.startsWith('#')) {
                handleNavClick(link.path, e as React.MouseEvent);
              }
            }}
            sx={{
              py: 1.5,
              color: theme.textPrimary,
              '&:hover': { backgroundColor: theme.surfaceLight },
            }}
          >
            {link.label}
          </MenuItem>
        ))}
        {isAuthenticated && user ? (
          <>
            <Divider sx={{ borderColor: theme.border, my: 1 }} />
            <MenuItem
              onClick={handleDashboard}
              sx={{
                py: 1.5,
                color: theme.textPrimary,
                '&:hover': { backgroundColor: theme.surfaceLight },
              }}
            >
              <Dashboard sx={{ mr: 1.5 }} />
              Dashboard
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: theme.error,
                '&:hover': { backgroundColor: theme.surfaceLight },
              }}
            >
              <ExitToApp sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </>
        ) : (
          <>
            <Divider sx={{ borderColor: theme.border, my: 1 }} />
            <MenuItem
              component={RouterLink}
              to="/login"
              onClick={handleMobileMenuClose}
              sx={{
                py: 1.5,
                color: theme.textPrimary,
                '&:hover': { backgroundColor: theme.surfaceLight },
              }}
            >
              Login
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/register"
              onClick={handleMobileMenuClose}
              sx={{
                py: 1.5,
                color: theme.accent,
                fontWeight: 600,
                '&:hover': { backgroundColor: theme.surfaceLight },
              }}
            >
              Sign Up
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
