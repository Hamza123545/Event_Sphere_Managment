/**
 * Contact Us Page
 * Contact form and information
 */

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Email,
  Phone,
  LocationOn,
  Send,
  AccessTime,
} from '@mui/icons-material';
import PublicNavbar from '../../components/public/PublicNavbar';
import Footer from '../../components/public/Footer';
import { MotionBox, GlassCard, getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { mode } = useThemeStore();
  const theme = getActiveTheme(mode);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual contact form submission
    setSnackbar({
      open: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      severity: 'success',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: <Email sx={{ fontSize: 32, color: theme.accent }} />,
      title: 'Email',
      value: 'info@eventsphere.com',
      link: 'mailto:info@eventsphere.com',
    },
    {
      icon: <Phone sx={{ fontSize: 32, color: theme.success }} />,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: <LocationOn sx={{ fontSize: 32, color: theme.info }} />,
      title: 'Address',
      value: '123 Event Street, City, State 12345',
      link: '#',
    },
    {
      icon: <AccessTime sx={{ fontSize: 32, color: theme.warning }} />,
      title: 'Business Hours',
      value: 'Mon - Fri: 9:00 AM - 6:00 PM',
      link: '#',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.bg }}>
      <PublicNavbar />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: 'relative',
            minHeight: '40vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.surface} 50%, ${theme.bg} 100%)`,
            pt: 12,
            pb: 8,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -200,
              right: -200,
              width: 600,
              height: 600,
              background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
              borderRadius: '50%',
              zIndex: 0,
            }}
          />
          <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  fontWeight: 900,
                  mb: 3,
                  background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.textSecondary} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Get In Touch
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: theme.textSecondary,
                  lineHeight: 1.8,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                }}
              >
                Have a question or want to learn more? We'd love to hear from you.
              </Typography>
            </MotionBox>
          </Container>
        </Box>

        {/* Contact Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, background: theme.surface }}>
          <Container maxWidth="xl">
            <Grid container spacing={6}>
              {/* Contact Form */}
              <Grid item xs={12} md={7}>
                <MotionBox
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <GlassCard>
                    <Box sx={{ p: 4 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: theme.textPrimary,
                        }}
                      >
                        Send Us a Message
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.textSecondary,
                          mb: 4,
                        }}
                      >
                        Fill out the form below and we'll get back to you as soon as possible.
                      </Typography>
                      <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: theme.surfaceLight,
                                  color: theme.textPrimary,
                                  '& fieldset': {
                                    borderColor: theme.border,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.textSecondary,
                                  '&.Mui-focused': {
                                    color: theme.accent,
                                  },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: theme.surfaceLight,
                                  color: theme.textPrimary,
                                  '& fieldset': {
                                    borderColor: theme.border,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.textSecondary,
                                  '&.Mui-focused': {
                                    color: theme.accent,
                                  },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: theme.surfaceLight,
                                  color: theme.textPrimary,
                                  '& fieldset': {
                                    borderColor: theme.border,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.textSecondary,
                                  '&.Mui-focused': {
                                    color: theme.accent,
                                  },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Message"
                              name="message"
                              multiline
                              rows={6}
                              value={formData.message}
                              onChange={handleChange}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: theme.surfaceLight,
                                  color: theme.textPrimary,
                                  '& fieldset': {
                                    borderColor: theme.border,
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.accent,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.accent,
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.textSecondary,
                                  '&.Mui-focused': {
                                    color: theme.accent,
                                  },
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              type="submit"
                              variant="contained"
                              size="large"
                              endIcon={<Send />}
                              fullWidth
                              sx={{
                                background: `linear-gradient(135deg, ${theme.accent} 0%, #7c3aed 100%)`,
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                py: 1.5,
                                borderRadius: '12px',
                                boxShadow: `0 8px 24px ${theme.accentGlow}`,
                                textTransform: 'none',
                                '&:hover': {
                                  background: `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)`,
                                  boxShadow: `0 12px 32px ${theme.accentGlow}`,
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              Send Message
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </Box>
                  </GlassCard>
                </MotionBox>
              </Grid>

              {/* Contact Info */}
              <Grid item xs={12} md={5}>
                <MotionBox
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 4,
                      color: theme.textPrimary,
                    }}
                  >
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {contactInfo.map((info, index) => (
                      <MotionBox
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <GlassCard>
                          <Box
                            component={info.link !== '#' ? 'a' : 'div'}
                            href={info.link !== '#' ? info.link : undefined}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'block',
                              p: 3,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: '12px',
                                  background: `${theme.surfaceLight}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {info.icon}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    mb: 1,
                                    color: theme.textPrimary,
                                  }}
                                >
                                  {info.title}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: theme.textSecondary,
                                    lineHeight: 1.8,
                                  }}
                                >
                                  {info.value}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </GlassCard>
                      </MotionBox>
                    ))}
                  </Box>
                </MotionBox>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
