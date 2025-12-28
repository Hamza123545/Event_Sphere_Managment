/**
 * Services Page
 * Cinematic design matching landing page
 */

import { useRef } from 'react';
import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import { motion, useScroll, useSpring, useInView, useTransform } from 'framer-motion';
import {
  Event,
  People,
  Dashboard,
  Analytics,
  Map,
  Chat,
  Security,
  Speed,
  Support,
  CheckCircle,
} from '@mui/icons-material';
import PublicNavbar from '../../components/public/PublicNavbar';
import Footer from '../../components/public/Footer';

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

export default function ServicesPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const services = [
    {
      icon: <Event sx={{ fontSize: 50 }} />,
      title: 'Expo Management',
      description: 'Create, manage, and organize exhibitions with comprehensive tools. From planning to execution, control every aspect of your event.',
      color: '#7c3aed',
      features: ['Event creation & scheduling', 'Registration management', 'Real-time updates', 'Multi-expo support'],
    },
    {
      icon: <People sx={{ fontSize: 50 }} />,
      title: 'Exhibitor Connections',
      description: 'Connect exhibitors with attendees through rich profiles, real-time messaging, and intelligent networking features.',
      color: '#ec4899',
      features: ['Rich profile customization', 'Direct messaging', 'Booth reservations', 'Application tracking'],
    },
    {
      icon: <Map sx={{ fontSize: 50 }} />,
      title: 'Interactive Floor Plans',
      description: 'Visual floor plans with booth reservations, real-time navigation, and live updates. Never lose your way.',
      color: '#3b82f6',
      features: ['Visual floor plans', 'Booth management', 'Real-time navigation', 'Interactive maps'],
    },
    {
      icon: <Analytics sx={{ fontSize: 50 }} />,
      title: 'Advanced Analytics',
      description: 'Track attendance, engagement, and performance with detailed insights. Make data-driven decisions with confidence.',
      color: '#10b981',
      features: ['Real-time dashboards', 'Attendance tracking', 'Engagement metrics', 'Export reports'],
    },
    {
      icon: <Chat sx={{ fontSize: 50 }} />,
      title: 'Real-Time Messaging',
      description: 'Built-in messaging system for seamless communication between organizers, exhibitors, and attendees.',
      color: '#f59e0b',
      features: ['Instant messaging', 'Group chats', 'Notifications', 'Message history'],
    },
    {
      icon: <Dashboard sx={{ fontSize: 50 }} />,
      title: 'Smart Dashboards',
      description: 'Personalized dashboards for each role. Organizers manage, exhibitors showcase, attendees discover.',
      color: '#8b5cf6',
      features: ['Role-based views', 'Customizable widgets', 'Quick actions', 'Activity feeds'],
    },
  ];

  const benefits = [
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: 'Enterprise Security',
      stat: 'AES-256',
      description: 'Bank-level encryption and security protocols. Your data is protected with industry-leading standards.',
      color: '#7c3aed',
    },
    {
      icon: <Speed sx={{ fontSize: 48 }} />,
      title: 'Lightning Fast',
      stat: '< 100ms',
      description: 'Optimized for performance. Experience instant load times and seamless interactions.',
      color: '#ec4899',
    },
    {
      icon: <Support sx={{ fontSize: 48 }} />,
      title: 'Always Available',
      stat: '24/7',
      description: 'Round-the-clock support from our expert team. We\'re here whenever you need us.',
      color: '#3b82f6',
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
        minHeight: '60vh', 
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
                OUR SERVICES
              </Typography>
              <Typography variant="h5" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                maxWidth: 800, 
                fontWeight: 300,
                lineHeight: 1.8,
              }}>
                Everything you need to create, manage, and execute successful exhibitions
              </Typography>
            </Stack>
          </FadeInSection>
        </Container>
      </Box>

      {/* Services Grid */}
      <Box sx={{ py: 20, bgcolor: '#080808' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} md={6} key={index}>
                <FadeInSection delay={index * 0.1}>
                  <TiltCard color={service.color}>
                    <Box sx={{ color: service.color, mb: 3 }}>
                      {service.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                      {service.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, mb: 3 }}>
                      {service.description}
                    </Typography>
                    <Stack spacing={1.5}>
                      {service.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle sx={{ color: service.color, fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </TiltCard>
                </FadeInSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: 20, bgcolor: '#050505' }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 12 }}>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                Why Choose Our Services?
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>
                Built for scale, designed for excellence
              </Typography>
            </Box>
          </FadeInSection>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FadeInSection delay={index * 0.15}>
                  <TiltCard color={benefit.color}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ color: benefit.color }}>
                        {benefit.icon}
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: benefit.color }}>
                        {benefit.stat}
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9 }}>
                      {benefit.description}
                    </Typography>
                  </TiltCard>
                </FadeInSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
