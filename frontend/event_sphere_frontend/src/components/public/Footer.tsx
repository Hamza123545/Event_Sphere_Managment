/**
 * Footer Component
 * Used across public pages
 */

import { Box, Container, Typography, Link, Grid, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';

export default function Footer() {
  const { mode } = useThemeStore();
  const theme = getActiveTheme(mode);
  const navigate = useNavigate();

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    if (path.startsWith('#')) {
      e.preventDefault();
      if (window.location.pathname === '/') {
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate(`/${path}`);
      }
    }
  };

  const footerLinks = {
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Services', path: '#services' },
      { label: 'Contact', path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'FAQs', path: '/faq' },
      { label: 'Documentation', path: '/docs' },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        background: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.bg} 100%)`,
        borderTop: `1px solid ${theme.border}`,
        pt: 8,
        pb: 4,
        mt: 12,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.accent} 0%, #a78bfa 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              EventSphere
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.textSecondary,
                mb: 3,
                lineHeight: 1.8,
              }}
            >
              Your all-in-one platform for managing exhibitions, connecting exhibitors, and creating
              unforgettable event experiences.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton
                sx={{
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  '&:hover': {
                    color: theme.accent,
                    borderColor: theme.accent,
                  },
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                sx={{
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  '&:hover': {
                    color: theme.accent,
                    borderColor: theme.accent,
                  },
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                sx={{
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  '&:hover': {
                    color: theme.accent,
                    borderColor: theme.accent,
                  },
                }}
              >
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.textPrimary,
              }}
            >
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {footerLinks.company.map((link) => (
                <Link
                  key={link.path}
                  component={link.path.startsWith('#') ? 'a' : RouterLink}
                  to={link.path.startsWith('#') ? undefined : link.path}
                  href={link.path.startsWith('#') ? link.path : undefined}
                  onClick={link.path.startsWith('#') ? (e) => handleLinkClick(link.path, e) : undefined}
                  sx={{
                    color: theme.textSecondary,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    '&:hover': {
                      color: theme.accent,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.textPrimary,
              }}
            >
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    color: theme.textSecondary,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: theme.accent,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Support Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.textPrimary,
              }}
            >
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {footerLinks.support.map((link) => (
                <Link
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    color: theme.textSecondary,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: theme.accent,
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.textPrimary,
              }}
            >
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Email sx={{ fontSize: '1.2rem', color: theme.accent }} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.textSecondary }}
                >
                  info@eventsphere.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ fontSize: '1.2rem', color: theme.accent }} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.textSecondary }}
                >
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationOn sx={{ fontSize: '1.2rem', color: theme.accent, mt: 0.5 }} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.textSecondary }}
                >
                  123 Event Street, City, State 12345
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          sx={{
            mt: 6,
            pt: 4,
            borderTop: `1px solid ${theme.border}`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.textSecondary,
            }}
          >
            © {new Date().getFullYear()} EventSphere. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
