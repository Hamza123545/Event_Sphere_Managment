/**
 * About Us Page
 * Cinematic design matching landing page
 */

import { useRef } from 'react';
import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
  Flag as Mission,
  Visibility as Vision,
  People as PeopleIcon,
  TrendingUp,
  EmojiEvents,
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

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const stats = [
    { value: '10K+', label: 'Events Managed', color: '#7c3aed' },
    { value: '50K+', label: 'Active Users', color: '#ec4899' },
    { value: '95%', label: 'Satisfaction Rate', color: '#3b82f6' },
    { value: '150+', label: 'Countries', color: '#10b981' },
  ];

  const values = [
    {
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      title: 'Community First',
      description: 'We believe in the power of community and connections. Our platform is built to bring people together.',
      color: '#7c3aed',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      title: 'Innovation',
      description: 'We continuously innovate to provide the best tools and features for event management.',
      color: '#ec4899',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 48 }} />,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from product design to customer support.',
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
                ABOUT EVENTSPHERE
              </Typography>
              <Typography variant="h5" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                maxWidth: 800, 
                fontWeight: 300,
                lineHeight: 1.8,
              }}>
                We're on a mission to revolutionize the way events are organized, managed, and experienced.
              </Typography>
            </Stack>
          </FadeInSection>
        </Container>
      </Box>

      {/* Story Section */}
      <Box sx={{ py: 20, position: 'relative', bgcolor: '#080808' }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 12 }}>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                Our Story
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300, maxWidth: 700, mx: 'auto' }}>
                From vision to reality—the journey of EventSphere
              </Typography>
            </Box>
          </FadeInSection>

          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <FadeInSection delay={0.2}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: '#7c3aed' }}>
                  The Beginning
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, fontSize: '1.1rem', mb: 3 }}>
                  EventSphere was born from a simple observation: event management shouldn't be complicated. 
                  Founded in 2020, we set out to create a platform that would make organizing exhibitions, 
                  connecting exhibitors, and managing attendees a seamless experience.
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, fontSize: '1.1rem' }}>
                  What started as a small team's vision has grown into a trusted platform used by thousands 
                  of event organizers worldwide. We've helped manage everything from small local exhibitions 
                  to large-scale international events, always with the same commitment to excellence.
                </Typography>
              </FadeInSection>
            </Grid>
            <Grid item xs={12} md={6}>
              <FadeInSection delay={0.4}>
                <TiltCard color="#7c3aed">
                  <Grid container spacing={3}>
                    {stats.map((stat, index) => (
                      <Grid item xs={6} key={index}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: stat.color }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </TiltCard>
              </FadeInSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission & Vision */}
      <Box sx={{ py: 20, bgcolor: '#050505' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FadeInSection>
                <TiltCard color="#7c3aed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '16px', background: 'rgba(124, 58, 237, 0.2)' }}>
                      <Mission sx={{ fontSize: 40, color: '#7c3aed' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                      Our Mission
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, fontSize: '1.05rem' }}>
                    To empower event organizers with intuitive, powerful tools that simplify event management 
                    and create meaningful connections between exhibitors and attendees. We're committed to making 
                    event organization accessible, efficient, and enjoyable for everyone.
                  </Typography>
                </TiltCard>
              </FadeInSection>
            </Grid>
            <Grid item xs={12} md={6}>
              <FadeInSection delay={0.2}>
                <TiltCard color="#3b82f6">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '16px', background: 'rgba(59, 130, 246, 0.2)' }}>
                      <Vision sx={{ fontSize: 40, color: '#3b82f6' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                      Our Vision
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, fontSize: '1.05rem' }}>
                    To become the global standard for event management platforms, recognized for innovation, 
                    reliability, and exceptional user experience. We envision a world where every event organizer 
                    has the tools they need to create extraordinary experiences.
                  </Typography>
                </TiltCard>
              </FadeInSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Box sx={{ py: 20, bgcolor: '#080808' }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 12 }}>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                Our Values
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>
                The principles that guide everything we do
              </Typography>
            </Box>
          </FadeInSection>

          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FadeInSection delay={index * 0.15}>
                  <TiltCard color={value.color}>
                    <Box sx={{ color: value.color, mb: 3, display: 'flex', justifyContent: 'center' }}>
                      {value.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'white', textAlign: 'center' }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.9, textAlign: 'center' }}>
                      {value.description}
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