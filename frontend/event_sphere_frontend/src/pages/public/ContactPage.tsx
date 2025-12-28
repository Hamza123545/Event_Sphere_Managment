/**
 * Contact Us Page
 * Cinematic design matching landing page
 */

import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import {
  Email,
  Phone,
  LocationOn,
  Send,
  AccessTime,
} from '@mui/icons-material';
import PublicNavbar from '../../components/public/PublicNavbar';
import Footer from '../../components/public/Footer';
import { useTransform } from 'framer-motion';

// Tilt Card Component
const TiltCard = ({ children, color }: { children: React.ReactNode, color: string }) => {
  const x = useSpring(0);
  const y = useSpring(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
    y.set(e.clientY - (rect.top + rect.height / 2));
  };

  return (
    <motion.div
      style={{ perspective: 1000, rotateX, rotateY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <Box sx={{
        p: 4,
        borderRadius: '30px',
        background: `linear-gradient(135deg, ${color}08 0%, rgba(0,0,0,0.9) 100%)`,
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: `${color}60`,
          boxShadow: `0 20px 60px ${color}20`,
        }
      }}>
        {children}
      </Box>
    </motion.div>
  );
};

const FadeInSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

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
    setSnackbar({
      open: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      severity: 'success',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: <Email sx={{ fontSize: 40 }} />,
      title: 'Email',
      value: 'info@eventsphere.com',
      link: 'mailto:info@eventsphere.com',
      color: '#7c3aed',
    },
    {
      icon: <Phone sx={{ fontSize: 40 }} />,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
      color: '#ec4899',
    },
    {
      icon: <LocationOn sx={{ fontSize: 40 }} />,
      title: 'Address',
      value: '123 Event Street, City, State 12345',
      link: '#',
      color: '#3b82f6',
    },
    {
      icon: <AccessTime sx={{ fontSize: 40 }} />,
      title: 'Business Hours',
      value: 'Mon - Fri: 9:00 AM - 6:00 PM',
      link: '#',
      color: '#10b981',
    },
  ];

  return (
    <Box ref={containerRef} sx={{ bgcolor: '#050505', color: 'white', overflow: 'hidden', minHeight: '100vh' }}>
      <PublicNavbar />
      
      {/* Progress Bar */}
      <motion.div style={{ 
        scaleX, 
        position: 'fixed', top: 0, left: 0, right: 0, height: 4, 
        background: 'linear-gradient(90deg, #7c3aed, #ec4899, #3b82f6)', 
        transformOrigin: '0%', zIndex: 999 
      }} />

      {/* Hero Section */}
      <Box sx={{ 
        minHeight: '50vh', 
        display: 'flex', 
        alignItems: 'center', 
        position: 'relative',
        pt: 8,
        pb: 6,
      }}>
        <motion.div style={{ 
          position: 'absolute', width: '100%', height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <FadeInSection>
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Typography variant="h1" sx={{ 
                fontSize: { xs: '3rem', md: '5rem', lg: '6rem' }, 
                fontWeight: 900, 
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(to bottom, #fff 50%, rgba(255,255,255,0.5))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}>
                GET IN TOUCH
              </Typography>
              <Typography variant="h5" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                maxWidth: 700, 
                fontWeight: 300,
                lineHeight: 1.8,
              }}>
                Have a question or want to learn more? We'd love to hear from you.
              </Typography>
            </Stack>
          </FadeInSection>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box sx={{ py: 20, bgcolor: '#080808' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={7}>
              <FadeInSection>
                <Box sx={{
                  p: 5,
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(0,0,0,0.9) 100%)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'white' }}>
                    Send Us a Message
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4 }}>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
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
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                borderRadius: '12px',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#7c3aed',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#7c3aed',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.6)',
                                '&.Mui-focused': {
                                  color: '#7c3aed',
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
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                borderRadius: '12px',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#7c3aed',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#7c3aed',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.6)',
                                '&.Mui-focused': {
                                  color: '#7c3aed',
                                },
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        fullWidth
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#7c3aed',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7c3aed',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&.Mui-focused': {
                              color: '#7c3aed',
                            },
                          },
                        }}
                      />
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
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#7c3aed',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7c3aed',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&.Mui-focused': {
                              color: '#7c3aed',
                            },
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={<Send />}
                        sx={{
                          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          py: 2,
                          borderRadius: '100px',
                          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                          textTransform: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                            boxShadow: '0 12px 32px rgba(124, 58, 237, 0.5)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Send Message
                      </Button>
                    </Stack>
                  </form>
                </Box>
              </FadeInSection>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={5}>
              <FadeInSection delay={0.2}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'white' }}>
                  Contact Information
                </Typography>
                <Stack spacing={3}>
                  {contactInfo.map((info, index) => (
                    <FadeInSection key={index} delay={0.3 + index * 0.1}>
                      <TiltCard color={info.color}>
                        <Box
                          component={info.link !== '#' ? 'a' : 'div'}
                          href={info.link !== '#' ? info.link : undefined}
                          sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'block',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <Box sx={{ color: info.color }}>
                              {info.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                {info.title}
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
                                {info.value}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TiltCard>
                    </FadeInSection>
                  ))}
                </Stack>
              </FadeInSection>
            </Grid>
          </Grid>
        </Container>
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
          sx={{ width: '100%', bgcolor: snackbar.severity === 'success' ? '#10b981' : '#ef4444', color: 'white' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}