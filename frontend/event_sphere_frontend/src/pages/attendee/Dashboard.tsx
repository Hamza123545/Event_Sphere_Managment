import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { 
  Event, 
  Schedule, 
  LocationOn, 
  WarningAmber,
  LocalFireDepartment,
  Group,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useAttendeeStore } from '../../stores/attendeeStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import { activeTheme, BackgroundGlows, PageContainer, SectionTitle } from '../../theme/designSystem';

/**
 * ENHANCED THEME TOKENS
 * Using a sophisticated "Slate & Violet" professional palette
 */
const tokens = {
  dark: {
    bg: '#020617', // Deep Navy/Slate
    surface: '#0f172a', // Slate 900
    surfaceLight: '#1e293b', // Slate 800
    border: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#8b5cf6', // Violet 500
    accentGlow: 'rgba(139, 92, 246, 0.3)',
  }
};

const active = tokens.dark;

/**
 * ANIMATED UI COMPONENTS
 */
const MotionBox = motion(Box);

const GlassContainer = ({ children, sx = {} }: { children: React.ReactNode; sx?: Record<string, unknown> }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    sx={{
      background: active.surface,
      borderRadius: '24px',
      border: `1px solid ${active.border}`,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      position: 'relative',
      ...sx,
    }}
  >
    {children}
  </MotionBox>
);

const GlassCard = ({ children, sx = {}, delay = 0 }: { children: React.ReactNode; sx?: Record<string, unknown>; delay?: number }) => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ 
      y: -5, 
      backgroundColor: active.surfaceLight,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      boxShadow: `0 10px 30px -10px ${active.accentGlow}`
    }}
    sx={{
      background: 'rgba(15, 23, 42, 0.6)',
      borderRadius: '16px',
      border: `1px solid ${active.border}`,
      padding: '24px',
      cursor: 'pointer',
      position: 'relative',
      ...sx,
    }}
  >
    {children}
  </MotionBox>
);

interface ActionButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  [key: string]: unknown;
}
const ActionButton = ({ children, primary = false, sx, ...props }: ActionButtonProps & { sx?: Record<string, unknown> }) => (
  <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Button
      {...(props as Record<string, unknown>)}
      sx={{
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        py: 1,
        transition: 'all 0.3s ease',
        background: primary ? active.accent : 'rgba(255,255,255,0.03)',
        color: '#fff',
        border: primary ? 'none' : `1px solid ${active.border}`,
        '&:hover': {
          background: primary ? '#7c3aed' : 'rgba(255,255,255,0.08)',
          boxShadow: primary ? `0 0 20px ${active.accentGlow}` : 'none',
        },
        ...(sx || {}),
      } as Record<string, unknown>}
    >
      {children}
    </Button>
  </MotionBox>
);

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    expos, 
    personalSchedule, 
    isLoading, 
    browseExpos, 
    getPersonalSchedule 
  } = useAttendeeStore();

  // Load data on mount
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user && user.userId) {
      // Add a small delay to ensure auth state is fully loaded
      const timer = setTimeout(() => {
        browseExpos({ status: 'upcoming' });
        getPersonalSchedule();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [browseExpos, getPersonalSchedule, user]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const exposCount = expos.length;
    const sessionsCount = personalSchedule.length;
    const networkCount = expos.reduce((sum) => {
      // This would need actual attendee count from backend, using a placeholder
      return sum + 100; // Placeholder - replace with actual data if available
    }, 0);
    
    return [
      { 
        label: 'Expos Joined', 
        value: exposCount.toString(), 
        icon: <Event />, 
        color: '#8b5cf6',
        change: '+12%' // Could calculate from previous period if tracking
      },
      { 
        label: 'Sessions', 
        value: sessionsCount.toString(), 
        icon: <Schedule />, 
        color: '#ec4899',
        change: sessionsCount > 0 ? '+' + Math.floor((sessionsCount / Math.max(exposCount * 4, 1)) * 100) + '%' : '0%'
      },
      { 
        label: 'Network', 
        value: networkCount > 1000 ? (networkCount / 1000).toFixed(1) + 'k' : networkCount.toString(), 
        icon: <Group />, 
        color: '#10b981',
        change: '+8%' // Placeholder
      },
    ];
  }, [expos, personalSchedule]);

  // Format upcoming sessions for timeline (next 2)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return personalSchedule
      .filter((item) => new Date(item.schedule.startTime) > now)
      .sort((a, b) => new Date(a.schedule.startTime).getTime() - new Date(b.schedule.startTime).getTime())
      .slice(0, 2);
  }, [personalSchedule]);

  // Format expos for display
  const displayExpos = useMemo(() => {
    return expos.slice(0, 6).map((expoItem) => ({
      id: expoItem.expoId,
      title: expoItem.title,
      status: expoItem.status === 'active' ? 'Live' : expoItem.status === 'upcoming' ? 'Upcoming' : expoItem.status,
      location: `${expoItem.location.city}, ${expoItem.location.country}`,
      attendees: 0, // This would need to come from backend analytics
      image: expoItem.imageUrl || 'https://images.unsplash.com/photo-1540575861501-7ce0e220abb4?auto=format&fit=crop&w=800&q=80', // Use actual imageUrl or fallback placeholder
      imageUrl: expoItem.imageUrl, // Keep imageUrl for consistency
      expoId: expoItem.expoId,
      dateRange: expoItem.dateRange,
    }));
  }, [expos]);

  // Calculate daily sync percentage (placeholder - could be based on completed vs total sessions)
  const dailySyncPercent = useMemo(() => {
    if (personalSchedule.length === 0) return 0;
    // This could be calculated based on attended vs total sessions
    return Math.min(75, Math.floor((personalSchedule.length / Math.max(expos.length * 4, 1)) * 100));
  }, [personalSchedule, expos]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const userName = user?.profile?.firstName 
    ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'Attendee';

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        {/* Hero Section */}
        <Box sx={{ mb: 8 }}>
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-2px' }}>
              Welcome, <span style={{ color: activeTheme.accent }}>{userName.split(' ')[0]}</span>.
            </Typography>
            <Typography variant="h6" sx={{ color: activeTheme.textSecondary, fontWeight: 500, maxWidth: 600 }}>
              {expos.length > 0 
                ? `You're registered for ${expos.length} ${expos.length === 1 ? 'event' : 'events'}. ${upcomingSessions.length > 0 ? `Your next session starts ${formatTime(upcomingSessions[0].schedule.startTime)}.` : 'Browse sessions to start planning your schedule.'}`
                : 'Discover exciting expos and start your journey.'}
            </Typography>
          </MotionBox>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {stats.map((stat, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <GlassCard delay={i * 0.1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ 
                    p: 1.5, borderRadius: '12px', 
                    background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`, 
                    color: stat.color, border: `1px solid ${stat.color}30`
                  }}>
                    {stat.icon}
                  </Box>
                  {stat.change && (
                    <Chip label={stat.change} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ color: active.textSecondary, fontWeight: 600, letterSpacing: '0.5px' }}>{stat.label.toUpperCase()}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={5}>
          {/* Main Feed */}
          <Grid item xs={12} lg={8}>
            <SectionTitle
            subtitle={`${displayExpos.length} ${displayExpos.length === 1 ? 'expo' : 'expos'} available`}
            action={
              <ActionButton 
                variant="text" 
                sx={{ color: activeTheme.accent }}
                onClick={() => navigate('/attendee/expos')}
              >
                View All
              </ActionButton>
            }
          >
            Upcoming Expos
          </SectionTitle>

            {isLoading && displayExpos.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Typography sx={{ color: activeTheme.textSecondary }}>Loading expos...</Typography>
              </Box>
            ) : displayExpos.length === 0 ? (
              <GlassCard>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                    No upcoming expos found. Start exploring!
                  </Typography>
                  <ActionButton primary onClick={() => navigate('/attendee/expos')}>
                    Browse Expos
                  </ActionButton>
                </Box>
              </GlassCard>
            ) : (
              <AnimatePresence>
                <Grid container spacing={3}>
                  {displayExpos.map((expo, i) => (
                  <Grid item xs={12} md={6} key={expo.expoId}>
                    <Box
                      onClick={() => navigate(`/attendee/expos/${expo.expoId}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                    <GlassCard 
                      sx={{ p: 0, height: '100%' }} 
                      delay={0.3 + (i * 0.1)}
                    >
                        <Box sx={{ 
                          height: 200, position: 'relative', overflow: 'hidden',
                          backgroundImage: `url(${expo.image})`,
                          backgroundSize: 'cover', backgroundPosition: 'center'
                        }}>
                          <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                            <Chip 
                              label={expo.status} 
                              size="small"
                              {...(expo.status === 'Live' && { icon: <LocalFireDepartment /> })}
                              sx={{ 
                                bgcolor: expo.status === 'Live' ? activeTheme.error : 'rgba(15, 23, 42, 0.8)', 
                                color: '#fff', fontWeight: 800, backdropFilter: 'blur(4px)' 
                              }} 
                            />
                          </Box>
                        </Box>
                        <Box sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{expo.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, color: active.textSecondary }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 16 }} />
                              <Typography variant="caption">{expo.location}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Event sx={{ fontSize: 16 }} />
                              <Typography variant="caption">{formatDate(expo.dateRange?.startDate || new Date().toISOString())}</Typography>
                            </Box>
                          </Box>
                          <ActionButton 
                            primary 
                            fullWidth
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              navigate(`/attendee/expos/${expo.expoId}`);
                            }}
                          >
                            View Details
                          </ActionButton>
                        </Box>
                      </GlassCard>
                    </Box>
                    </Grid>
                  ))}
                </Grid>
              </AnimatePresence>
            )}
          </Grid>

          {/* Schedule Sidebar */}
          <Grid item xs={12} lg={4}>
            <GlassContainer sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Schedule sx={{ color: activeTheme.accent }} /> Your Timeline
              </Typography>

              {isLoading && upcomingSessions.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography sx={{ color: activeTheme.textSecondary }}>Loading schedule...</Typography>
                </Box>
              ) : upcomingSessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                    No upcoming sessions. Bookmark sessions to see them here!
                  </Typography>
                  <ActionButton 
                    size="small" 
                    onClick={() => navigate('/attendee/expos')}
                  >
                    Browse Sessions
                  </ActionButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {upcomingSessions.map((session, i) => (
                    <MotionBox 
                      key={session.sessionId}
                      whileHover={{ x: 5 }}
                      sx={{ position: 'relative', pl: 3, borderLeft: `2px solid ${activeTheme.border}` }}
                    >
                      <Box sx={{ 
                        position: 'absolute', left: '-7px', top: '0', 
                        width: '12px', height: '12px', borderRadius: '50%', 
                        bgcolor: i === 0 ? active.accent : active.surfaceLight,
                        boxShadow: i === 0 ? `0 0 15px ${active.accent}` : 'none'
                      }} />
                      
                      <Typography variant="caption" sx={{ color: active.accent, fontWeight: 800, display: 'block', mb: 0.5 }}>
                        {formatTime(session.schedule.startTime)}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>
                        {session.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: active.surfaceLight }}>
                          {session.location.room.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: active.textSecondary }}>
                          {session.location.room}{session.location.building ? ` • ${session.location.building}` : ''}
                        </Typography>
                      </Box>
                      
                      {session.conflicts && session.conflicts.length > 0 && (
                        <Chip 
                          label={`${session.conflicts.length} conflict${session.conflicts.length > 1 ? 's' : ''}`}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(239, 68, 68, 0.1)', 
                            color: '#ef4444', 
                            mb: 2,
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                          icon={<WarningAmber sx={{ fontSize: 14 }} />}
                        />
                      )}
                      
                      <ActionButton 
                        fullWidth 
                        size="small"
                        onClick={() => {
                          // Navigate to expo detail page with session focused
                          // You'll need to find which expo this session belongs to
                          navigate('/attendee/expos');
                        }}
                      >
                        View Details
                      </ActionButton>
                    </MotionBox>
                  ))}
                </Box>
              )}

              <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${active.border}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: activeTheme.textSecondary }}>SCHEDULE COMPLETION</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: activeTheme.accent }}>{dailySyncPercent}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={dailySyncPercent} 
                  sx={{ 
                    height: 8, borderRadius: 4, bgcolor: activeTheme.surfaceLight,
                    '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${activeTheme.accent}, #ec4899)` } 
                  }} 
                />
              </Box>
            </GlassContainer>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}