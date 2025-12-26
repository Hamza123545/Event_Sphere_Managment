/**
 * Personal Schedule Page
 * Displays all bookmarked sessions with conflict highlighting
 * Implements T110: User Story 3
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { ArrowBack, Schedule, Warning, LocationOn } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function PersonalSchedulePage() {
  const navigate = useNavigate();
  const { personalSchedule, isLoading, error, getPersonalSchedule, clearError } = useAttendeeStore();

  useEffect(() => {
    getPersonalSchedule();
  }, [getPersonalSchedule]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group sessions by date
  const sessionsByDate = personalSchedule.reduce((acc, item) => {
    const date = new Date(item.schedule.startTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof personalSchedule>);

  // Sort sessions within each date by start time
  Object.keys(sessionsByDate).forEach((date) => {
    sessionsByDate[date].sort(
      (a, b) => new Date(a.schedule.startTime).getTime() - new Date(b.schedule.startTime).getTime()
    );
  });

  const dates = Object.keys(sessionsByDate).sort();

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar navItems={[
        { label: 'Explore', path: '/attendee/expos' },
        { label: 'My Events', path: '/attendee' },
      ]} />
      
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4 }}
        >
          <ActionButton 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/attendee')} 
            sx={{ mb: 3 }}
          >
            Back to Dashboard
          </ActionButton>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-2px' }}>
            My Personal Schedule
          </Typography>
          <Typography variant="h6" sx={{ color: activeTheme.textSecondary, fontWeight: 500 }}>
            All your bookmarked sessions across all expos
          </Typography>
        </MotionBox>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {isLoading && personalSchedule.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : personalSchedule.length === 0 ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                You haven't bookmarked any sessions yet. Browse expos to find interesting sessions!
              </Typography>
              <ActionButton primary onClick={() => navigate('/attendee/expos')}>
                Browse Expos
              </ActionButton>
            </Box>
          </GlassCard>
        ) : (
          <Box>
            {dates.map((date, dateIndex) => (
              <Box key={date} sx={{ mb: 6 }}>
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dateIndex * 0.1 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
                    {formatDate(date)}
                  </Typography>
                </MotionBox>

                {sessionsByDate[date].map((session, sessionIndex) => (
                  <MotionBox
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (dateIndex * 0.1) + (sessionIndex * 0.05) }}
                    sx={{ mb: 3 }}
                  >
                    <GlassCard
                      sx={{
                        borderLeft: session.conflicts.length > 0 ? `4px solid ${activeTheme.warning}` : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: activeTheme.textPrimary }}>
                            {session.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: activeTheme.textSecondary }}>
                              <Schedule sx={{ fontSize: 16 }} />
                              <Typography variant="body2">
                                {formatTime(session.schedule.startTime)} - {formatTime(session.schedule.endTime)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: activeTheme.textSecondary }}>
                              <LocationOn sx={{ fontSize: 16 }} />
                              <Typography variant="body2">
                                {session.location.room}
                                {session.location.building && `, ${session.location.building}`}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip 
                              label={session.category} 
                              size="small" 
                              sx={{ 
                                bgcolor: `${activeTheme.accent}20`,
                                color: activeTheme.accent,
                                border: `1px solid ${activeTheme.accent}30`,
                                fontWeight: 600
                              }} 
                            />
                            <Chip 
                              label={session.topic} 
                              size="small" 
                              sx={{ 
                                bgcolor: `${activeTheme.accent}20`,
                                color: activeTheme.accent,
                                border: `1px solid ${activeTheme.accent}30`,
                                fontWeight: 600
                              }} 
                            />
                          </Box>
                        </Box>
                      </Box>

                      {session.conflicts.length > 0 && (
                        <Alert 
                          severity="warning" 
                          icon={<Warning />} 
                          sx={{ 
                            mt: 2,
                            bgcolor: `${activeTheme.warning}20`,
                            border: `1px solid ${activeTheme.warning}30`,
                            color: activeTheme.textPrimary,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Scheduling Conflict
                          </Typography>
                          <Typography variant="body2">
                            This session overlaps with {session.conflicts.length} other session(s) in your schedule.
                          </Typography>
                        </Alert>
                      )}
                    </GlassCard>
                  </MotionBox>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </PageContainer>
  );
}

