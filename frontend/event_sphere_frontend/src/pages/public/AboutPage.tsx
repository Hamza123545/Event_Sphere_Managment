/**
 * About Us Page
 * Storytelling page about EventSphere
 */

import { Box, Container, Typography, Grid } from '@mui/material';
import {
  Flag as Mission,
  Visibility as Vision,
  People as PeopleIcon,
  TrendingUp,
  EmojiEvents,
} from '@mui/icons-material';
import PublicNavbar from '../../components/public/PublicNavbar';
import Footer from '../../components/public/Footer';
import { MotionBox, GlassCard, getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';

export default function AboutPage() {
  const { mode } = useThemeStore();
  const theme = getActiveTheme(mode);

  const stats = [
    { value: '10,000+', label: 'Events Managed' },
    { value: '50,000+', label: 'Active Users' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '150+', label: 'Countries' },
  ];

  const values = [
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.accent }} />,
      title: 'Community First',
      description:
        'We believe in the power of community and connections. Our platform is built to bring people together.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: theme.success }} />,
      title: 'Innovation',
      description:
        'We continuously innovate to provide the best tools and features for event management.',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40, color: theme.warning }} />,
      title: 'Excellence',
      description:
        'We strive for excellence in everything we do, from product design to customer support.',
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
            minHeight: '50vh',
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
              left: -200,
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
              sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}
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
                About EventSphere
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: theme.textSecondary,
                  lineHeight: 1.8,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                }}
              >
                We're on a mission to revolutionize the way events are organized, managed, and
                experienced.
              </Typography>
            </MotionBox>
          </Container>
        </Box>

        {/* Story Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, background: theme.surface }}>
          <Container maxWidth="xl">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <MotionBox
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      mb: 3,
                      color: theme.textPrimary,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    Our Story
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.textSecondary,
                      lineHeight: 1.9,
                      fontSize: '1.1rem',
                      mb: 3,
                    }}
                  >
                    EventSphere was born from a simple observation: event management shouldn't be
                    complicated. Founded in 2020, we set out to create a platform that would make
                    organizing exhibitions, connecting exhibitors, and managing attendees a seamless
                    experience.
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.textSecondary,
                      lineHeight: 1.9,
                      fontSize: '1.1rem',
                      mb: 3,
                    }}
                  >
                    What started as a small team's vision has grown into a trusted platform used by
                    thousands of event organizers worldwide. We've helped manage everything from
                    small local exhibitions to large-scale international events, always with the
                    same commitment to excellence.
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.textSecondary,
                      lineHeight: 1.9,
                      fontSize: '1.1rem',
                    }}
                  >
                    Today, EventSphere continues to evolve, bringing cutting-edge technology and
                    innovative features to the event management industry. Our mission remains the
                    same: to empower event organizers and create unforgettable experiences.
                  </Typography>
                </MotionBox>
              </Grid>
              <Grid item xs={12} md={6}>
                <MotionBox
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <GlassCard>
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                      }}
                    >
                      <Grid container spacing={3}>
                        {stats.map((stat, index) => (
                          <Grid item xs={6} key={index}>
                            <Typography
                              variant="h3"
                              sx={{
                                fontWeight: 800,
                                mb: 1,
                                background: `linear-gradient(135deg, ${theme.accent} 0%, #a78bfa 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {stat.value}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.textSecondary,
                                fontWeight: 600,
                              }}
                            >
                              {stat.label}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </GlassCard>
                </MotionBox>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Mission & Vision */}
        <Box sx={{ py: { xs: 8, md: 12 }, background: theme.bg }}>
          <Container maxWidth="xl">
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <MotionBox
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <GlassCard>
                    <Box sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            background: `${theme.accent}20`,
                          }}
                        >
                          <Mission sx={{ fontSize: 32, color: theme.accent }} />
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: theme.textPrimary,
                          }}
                        >
                          Our Mission
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.textSecondary,
                          lineHeight: 1.9,
                          fontSize: '1.05rem',
                        }}
                      >
                        To empower event organizers with intuitive, powerful tools that simplify
                        event management and create meaningful connections between exhibitors and
                        attendees. We're committed to making event organization accessible,
                        efficient, and enjoyable for everyone.
                      </Typography>
                    </Box>
                  </GlassCard>
                </MotionBox>
              </Grid>
              <Grid item xs={12} md={6}>
                <MotionBox
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <GlassCard>
                    <Box sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            background: `${theme.info}20`,
                          }}
                        >
                          <Vision sx={{ fontSize: 32, color: theme.info }} />
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: theme.textPrimary,
                          }}
                        >
                          Our Vision
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.textSecondary,
                          lineHeight: 1.9,
                          fontSize: '1.05rem',
                        }}
                      >
                        To become the global standard for event management platforms, recognized for
                        innovation, reliability, and exceptional user experience. We envision a
                        world where every event organizer has the tools they need to create
                        extraordinary experiences.
                      </Typography>
                    </Box>
                  </GlassCard>
                </MotionBox>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Values Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, background: theme.surface }}>
          <Container maxWidth="xl">
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              sx={{ textAlign: 'center', mb: 8 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3rem' },
                  color: theme.textPrimary,
                }}
              >
                Our Values
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.textSecondary,
                  maxWidth: 700,
                  mx: 'auto',
                }}
              >
                The principles that guide everything we do
              </Typography>
            </MotionBox>

            <Grid container spacing={4}>
              {values.map((value, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <MotionBox
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <GlassCard>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          p: 4,
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '16px',
                            background: `${theme.surfaceLight}`,
                            mb: 3,
                          }}
                        >
                          {value.icon}
                        </Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 2,
                            color: theme.textPrimary,
                          }}
                        >
                          {value.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.textSecondary,
                            lineHeight: 1.8,
                          }}
                        >
                          {value.description}
                        </Typography>
                      </Box>
                    </GlassCard>
                  </MotionBox>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
