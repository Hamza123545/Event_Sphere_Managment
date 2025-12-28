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
export default function Footer() {
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
      { label: 'Services', path: '/services' },
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
        background: '#080808',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                fontWeight: 900,
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.5rem',
              }}
            >
              EVENTSPHERE
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
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
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    color: '#7c3aed',
                    borderColor: '#7c3aed',
                  },
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    color: '#7c3aed',
                    borderColor: '#7c3aed',
                  },
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    color: '#7c3aed',
                    borderColor: '#7c3aed',
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
                color: 'white',
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
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#7c3aed',
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
                color: 'white',
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
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: '#7c3aed',
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
                color: 'white',
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
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: '#7c3aed',
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
                color: 'white',
              }}
            >
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Email sx={{ fontSize: '1.2rem', color: '#7c3aed' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  info@eventsphere.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ fontSize: '1.2rem', color: '#7c3aed' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationOn sx={{ fontSize: '1.2rem', color: '#7c3aed', mt: 0.5 }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
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
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            © {new Date().getFullYear()} EventSphere. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
