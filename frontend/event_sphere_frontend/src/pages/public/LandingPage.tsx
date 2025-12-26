/**
 * Enhanced EventSphere Landing Page
 * Cinematic storytelling experience with EventSphere-specific content
 */

import React, { useRef } from 'react';
import { Box, Container, Typography, Button, Grid, Stack, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView, useVelocity } from 'framer-motion';
import { 
  ArrowForward, 
  Mouse, 
  CheckCircle, 
  RocketLaunch, 
  Explore, 
  AutoAwesome, 
  Security, 
  Speed, 
  Support,
  Event,
  People,
  Dashboard,
  Analytics,
  Map,
  Chat,
  Business,
} from '@mui/icons-material';
import PublicNavbar from '../../components/public/PublicNavbar';
import Footer from '../../components/public/Footer';

// --- ANIMATION HELPERS ---

/**
 * Magnetic Effect for Buttons
 */
const MagneticButton = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.4);
    y.set((clientY - centerY) * 0.4);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={reset} style={{ x, y }}>
      {children}
    </motion.div>
  );
};

/**
 * 3D Tilt Card Component
 */
const TiltCard = ({ children, color }: { children: React.ReactNode, color: string }) => {
  const x = useSpring(0);
  const y = useSpring(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

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

/**
 * Feature Card with Icon
 */
const FeatureCard = ({ icon, title, description, color, delay = 0 }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      <TiltCard color={color}>
        <Box sx={{ color, mb: 2, fontSize: '3rem', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
          {title}
        </Typography>
        <Typography sx={{ color: 'grey.400', lineHeight: 1.8, fontSize: '0.95rem' }}>
          {description}
        </Typography>
      </TiltCard>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

export default function LandingPage() {
  const containerRef = useRef(null);
  
  // Scroll Progress Logic
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const scrollVelocity = useVelocity(scrollYProgress);
  const skewVelocity = useTransform(scrollVelocity, [-1, 1], [-10, 10]);
  const backgroundSkew = useSpring(skewVelocity, { stiffness: 100, damping: 30 });

  return (
    <Box ref={containerRef} sx={{ bgcolor: '#050505', color: 'white', overflow: 'hidden' }}>
      <PublicNavbar />
      
      {/* Progress Bar */}
      <motion.div style={{ 
        scaleX, 
        position: 'fixed', top: 0, left: 0, right: 0, height: 4, 
        background: 'linear-gradient(90deg, #7c3aed, #ec4899, #3b82f6)', 
        transformOrigin: '0%', zIndex: 999 
      }} />

      {/* SECTION 1: CINEMATIC HERO */}
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', position: 'relative', pt: 8 }}>
        <motion.div style={{ 
          position: 'absolute', width: '100%', height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          skewY: backgroundSkew 
        }} />

        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Chip 
                label="The Future of Event Management" 
                sx={{ 
                  mb: 3, 
                  bgcolor: 'rgba(124, 58, 237, 0.2)', 
                  color: '#a78bfa',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  px: 2,
                }} 
              />
              <Typography variant="h1" sx={{ 
                fontSize: { xs: '3rem', sm: '4.5rem', md: '7rem', lg: '8.5rem' }, 
                fontWeight: 900, 
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(to bottom, #fff 50%, rgba(255,255,255,0.5))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}>
                EVENTSPHERE
              </Typography>
              <Typography variant="h2" sx={{
                fontSize: { xs: '1.5rem', md: '2.5rem' },
                fontWeight: 300,
                color: 'grey.400',
                letterSpacing: '0.02em',
              }}>
                Where Exhibitions Come to Life
              </Typography>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.8, duration: 1 }}
            >
              <Typography variant="h6" sx={{ 
                color: 'grey.500', 
                maxWidth: 700, 
                fontWeight: 300,
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.2rem' },
              }}>
                Transform how you organize exhibitions, connect exhibitors with attendees, 
                and create unforgettable event experiences. All in one powerful platform.
              </Typography>
            </motion.div>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ pt: 4 }}>
              <MagneticButton>
                <Button 
                  component={RouterLink}
                  to="/register"
                  variant="contained" 
                  endIcon={<ArrowForward />}
                  sx={{ 
                    borderRadius: 100, 
                    px: 5, 
                    py: 2, 
                    bgcolor: '#7c3aed', 
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#6d28d9', transform: 'scale(1.05)' },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start Free Trial
                </Button>
              </MagneticButton>
              <Button 
                component={RouterLink}
                to="/about"
                sx={{ 
                  color: 'white', 
                  borderBottom: '2px solid #7c3aed',
                  borderRadius: 0,
                  px: 3,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { 
                    borderBottom: '2px solid #a78bfa',
                    bgcolor: 'transparent',
                  }
                }}
              >
                Our Story
              </Button>
            </Stack>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <Grid container spacing={4} sx={{ mt: 6, maxWidth: 800 }}>
                {[
                  { value: '10K+', label: 'Events Managed' },
                  { value: '50K+', label: 'Active Users' },
                  { value: '99.9%', label: 'Uptime' },
                ].map((stat, i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#7c3aed', mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'grey.500', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Stack>
        </Container>

        <Box sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Mouse sx={{ color: '#7c3aed', fontSize: 40, opacity: 0.7 }} />
          </motion.div>
        </Box>
      </Box>

      {/* SECTION 2: THE STORY PATH */}
      <Box sx={{ py: 20, position: 'relative', bgcolor: '#080808' }}>
        <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', bgcolor: 'rgba(124, 58, 237, 0.2)' }} />
        
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Our Journey
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.500', fontWeight: 300 }}>
              From vision to reality
            </Typography>
          </Box>

          {[
            { 
              title: "The Challenge", 
              desc: "Event organizers struggled with disconnected tools, lost leads, and fragmented experiences. Managing exhibitions felt more complex than it should be.", 
              icon: <Explore sx={{ fontSize: 40 }} />, 
              color: "#ef4444" 
            },
            { 
              title: "The Vision", 
              desc: "We envisioned a unified platform where organizers, exhibitors, and attendees seamlessly connect. Where data flows naturally and experiences are unforgettable.", 
              icon: <AutoAwesome sx={{ fontSize: 40 }} />, 
              color: "#3b82f6" 
            },
            { 
              title: "EventSphere", 
              desc: "Today, EventSphere powers thousands of exhibitions worldwide. Real-time floor plans, intelligent analytics, seamless connections—all in one beautiful platform.", 
              icon: <RocketLaunch sx={{ fontSize: 40 }} />, 
              color: "#10b981" 
            }
          ].map((item, i) => (
            <StoryStep key={i} item={item} index={i} />
          ))}
        </Container>
      </Box>

      {/* SECTION 3: CORE FEATURES */}
      <Box sx={{ py: 20, bgcolor: '#050505', position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Everything You Need
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.500', fontWeight: 300, maxWidth: 700, mx: 'auto' }}>
              Powerful tools designed for organizers, exhibitors, and attendees
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { 
                icon: <Event sx={{ fontSize: 48 }} />, 
                title: "Expo Management", 
                description: "Create, manage, and organize exhibitions with comprehensive tools. From planning to execution, control every aspect of your event.",
                color: "#7c3aed" 
              },
              { 
                icon: <People sx={{ fontSize: 48 }} />, 
                title: "Exhibitor Connections", 
                description: "Connect exhibitors with attendees through rich profiles, real-time messaging, and intelligent networking features.",
                color: "#ec4899" 
              },
              { 
                icon: <Map sx={{ fontSize: 48 }} />, 
                title: "Interactive Floor Plans", 
                description: "Visual floor plans with booth reservations, real-time navigation, and live updates. Never lose your way.",
                color: "#3b82f6" 
              },
              { 
                icon: <Analytics sx={{ fontSize: 48 }} />, 
                title: "Advanced Analytics", 
                description: "Track attendance, engagement, and performance with detailed insights. Make data-driven decisions with confidence.",
                color: "#10b981" 
              },
              { 
                icon: <Chat sx={{ fontSize: 48 }} />, 
                title: "Real-Time Messaging", 
                description: "Built-in messaging system for seamless communication between organizers, exhibitors, and attendees.",
                color: "#f59e0b" 
              },
              { 
                icon: <Dashboard sx={{ fontSize: 48 }} />, 
                title: "Smart Dashboards", 
                description: "Personalized dashboards for each role. Organizers manage, exhibitors showcase, attendees discover.",
                color: "#8b5cf6" 
              },
            ].map((feature, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  delay={i * 0.1}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECTION 4: WHY CHOOSE US */}
      <Box sx={{ py: 20, bgcolor: '#080808', position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Why EventSphere?
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.500', fontWeight: 300 }}>
              Built for scale, designed for excellence
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { 
                title: "Enterprise Security", 
                icon: <Security sx={{ fontSize: 48 }} />, 
                color: "#7c3aed", 
                stat: "AES-256",
                description: "Bank-level encryption and security protocols. Your data is protected with industry-leading standards."
              },
              { 
                title: "Lightning Fast", 
                icon: <Speed sx={{ fontSize: 48 }} />, 
                color: "#ec4899", 
                stat: "< 100ms",
                description: "Optimized for performance. Experience instant load times and seamless interactions, even with thousands of concurrent users."
              },
              { 
                title: "Always Available", 
                icon: <Support sx={{ fontSize: 48 }} />, 
                color: "#3b82f6", 
                stat: "24/7",
                description: "Round-the-clock support from our expert team. We're here whenever you need us, wherever you are."
              }
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <TiltCard color={feature.color}>
                  <Box sx={{ color: feature.color, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {feature.icon}
                    <Typography variant="h3" sx={{ fontWeight: 900, color: feature.color }}>
                      {feature.stat}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: 'grey.400', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {feature.description}
                  </Typography>
                </TiltCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECTION 5: ROLE-BASED BENEFITS */}
      <Box sx={{ py: 20, bgcolor: '#050505' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Built for Everyone
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.500', fontWeight: 300, maxWidth: 700, mx: 'auto' }}>
              Tailored experiences for organizers, exhibitors, and attendees
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {[
              {
                role: "Organizers",
                icon: <Event sx={{ fontSize: 60 }} />,
                color: "#7c3aed",
                features: [
                  "Create and manage multiple expos",
                  "Interactive floor plan editor",
                  "Application review and approval",
                  "Real-time analytics dashboard",
                  "Attendee registration management",
                ]
              },
              {
                role: "Exhibitors",
                icon: <Business sx={{ fontSize: 60 }} />,
                color: "#ec4899",
                features: [
                  "Rich profile customization",
                  "Booth reservation system",
                  "Direct attendee messaging",
                  "Product showcase tools",
                  "Application tracking",
                ]
              },
              {
                role: "Attendees",
                icon: <People sx={{ fontSize: 60 }} />,
                color: "#3b82f6",
                features: [
                  "Browse and discover expos",
                  "Personal schedule builder",
                  "Exhibitor search and filtering",
                  "Interactive floor plan navigation",
                  "Session bookmarking",
                ]
              },
            ].map((role, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                >
                  <Box sx={{
                    p: 5,
                    borderRadius: '30px',
                    background: `linear-gradient(135deg, ${role.color}08 0%, rgba(0,0,0,0.9) 100%)`,
                    border: `2px solid ${role.color}30`,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: `${role.color}60`,
                      transform: 'translateY(-5px)',
                    }
                  }}>
                    <Box sx={{ color: role.color, mb: 3 }}>
                      {role.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, color: 'white' }}>
                      For {role.role}
                    </Typography>
                    <Stack spacing={2}>
                      {role.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle sx={{ color: role.color, fontSize: '1.2rem' }} />
                          <Typography sx={{ color: 'grey.400', fontSize: '0.95rem' }}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECTION 6: CALL TO ACTION */}
      <Box sx={{ py: 30, textAlign: 'center', position: 'relative', bgcolor: '#080808', overflow: 'hidden' }}>
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Ready to Transform Your Events?
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.500', mb: 6, fontWeight: 300, lineHeight: 1.8 }}>
              Join thousands of event organizers, exhibitors, and attendees who are already using EventSphere 
              to create amazing experiences.
            </Typography>
            <MagneticButton>
              <Button 
                component={RouterLink}
                to="/register"
                variant="contained" 
                size="large" 
                endIcon={<ArrowForward />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'black', 
                  borderRadius: 100, 
                  px: 8, 
                  py: 3, 
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  textTransform: 'none',
                  '&:hover': { 
                    bgcolor: '#f0f0f0',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Your Free Trial
              </Button>
            </MagneticButton>
            <Typography sx={{ mt: 4, color: 'grey.600', fontSize: '0.9rem' }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Typography>
          </motion.div>
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
}

function StoryStep({ item, index }: { item: { title: string; desc: string; icon: React.ReactNode; color: string }; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <Box ref={ref} sx={{ 
      display: 'flex', 
      justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
      mb: 20,
      position: 'relative'
    }}>
      {/* Central Indicator */}
      <motion.div
        animate={isInView ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 0.5 }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: '50%',
          top: 20,
          transform: 'translateX(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: item.color,
          boxShadow: `0 0 30px ${item.color}`,
          zIndex: 2,
        }}
      />

      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
        transition={{ duration: 0.8, type: 'spring', damping: 15 }}
        style={{ width: '45%' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ color: item.color }}>
            {item.icon}
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: item.color }}>
            {item.title}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ color: 'grey.400', fontWeight: 300, lineHeight: 1.8 }}>
          {item.desc}
        </Typography>
      </motion.div>
    </Box>
  );
}