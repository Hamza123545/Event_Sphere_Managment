/**
 * Public Navigation Bar Component
 * Dark cinematic design matching landing page
 */

import { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user, logout: logoutStore, isAuthenticated } = useAuthStore();
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
      if (location.pathname === '/') {
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate(`/${path}`);
      }
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="sticky"
          sx={{
            background: 'rgba(5, 5, 5, 0.8)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar sx={{ py: 1.5, justifyContent: 'space-between' }}>
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
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                    fontSize: '1.5rem',
                  }}
                >
                  EVENTSPHERE
                </Typography>
              </Box>

              {/* Desktop Navigation */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    component={link.path.startsWith('#') ? 'a' : RouterLink}
                    to={link.path.startsWith('#') ? undefined : link.path}
                    href={link.path.startsWith('#') ? link.path : undefined}
                    onClick={link.path.startsWith('#') ? (e) => handleNavClick(link.path, e) : undefined}
                    sx={{
                      color: isActive(link.path) ? '#7c3aed' : 'rgba(255, 255, 255, 0.7)',
                      fontWeight: isActive(link.path) ? 700 : 500,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      position: 'relative',
                      '&::after': isActive(link.path) ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: 2,
                        background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                        borderRadius: 2,
                      } : {},
                      '&:hover': {
                        color: '#7c3aed',
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
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        px: 2.5,
                        '&:hover': {
                          color: '#7c3aed',
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
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          borderColor: '#7c3aed',
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: '#7c3aed',
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
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        px: 2.5,
                        '&:hover': {
                          color: '#7c3aed',
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
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        borderRadius: '100px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                          boxShadow: '0 6px 20px rgba(124, 58, 237, 0.5)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
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
                sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }}
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
            background: 'rgba(5, 5, 5, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#7c3aed',
                fontSize: '0.875rem',
              }}
            >
              {user?.profile?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {user?.profile?.firstName 
                  ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
                  : user?.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
        <MenuItem
          onClick={handleDashboard}
          sx={{
            py: 1.5,
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
          }}
        >
          <Dashboard sx={{ mr: 1.5, fontSize: '1.25rem' }} />
          Dashboard
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: '#ef4444',
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
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
            background: 'rgba(5, 5, 5, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
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
              color: isActive(link.path) ? '#7c3aed' : 'white',
              fontWeight: isActive(link.path) ? 700 : 500,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            {link.label}
          </MenuItem>
        ))}
        {isAuthenticated && user ? (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
            <MenuItem
              onClick={handleDashboard}
              sx={{
                py: 1.5,
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              <Dashboard sx={{ mr: 1.5 }} />
              Dashboard
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: '#ef4444',
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              <ExitToApp sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </>
        ) : (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
            <MenuItem
              component={RouterLink}
              to="/login"
              onClick={handleMobileMenuClose}
              sx={{
                py: 1.5,
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
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
                color: '#7c3aed',
                fontWeight: 700,
                '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.1)' },
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