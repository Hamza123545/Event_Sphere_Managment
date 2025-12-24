/**
 * Attendee Dashboard Page
 * Main dashboard for attendees showing upcoming expos, registered expos, and upcoming sessions
 * Implements T102: User Story 3
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import { Event, Schedule, Explore } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';
import { useAuthStore } from '../../stores/authStore';

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    expos,
    personalSchedule,
    isLoading,
    error,
    browseExpos,
    getPersonalSchedule,
    clearError,
  } = useAttendeeStore();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  useEffect(() => {
    // Load upcoming expos
    browseExpos({ status: 'upcoming' });
    // Load personal schedule
    getPersonalSchedule();
  }, [browseExpos, getPersonalSchedule]);

  useEffect(() => {
    // Filter upcoming sessions from personal schedule
    if (personalSchedule.length > 0) {
      const now = new Date();
      const upcoming = personalSchedule
        .filter((item) => new Date(item.schedule.startTime) > now)
        .sort((a, b) => new Date(a.schedule.startTime).getTime() - new Date(b.schedule.startTime).getTime())
        .slice(0, 5); // Show next 5 sessions
      setUpcomingSessions(upcoming);
    }
  }, [personalSchedule]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Attendee Portal" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.email?.split('@')[0] || 'Attendee'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Browse expos, register for events, and manage your schedule
        </Typography>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {isLoading && expos.length === 0 && personalSchedule.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <Grid container spacing={3}>
            {/* Upcoming Expos */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Event color="primary" />
                <Typography variant="h5">Upcoming Expos</Typography>
              </Box>

              {expos.length === 0 ? (
                <Alert severity="info">No upcoming expos available. Check back later!</Alert>
              ) : (
                <Grid container spacing={2}>
                  {expos.slice(0, 3).map((expo) => (
                    <Grid item xs={12} key={expo.expoId}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="h6" component="h3">
                              {expo.title}
                            </Typography>
                            <Chip label={expo.status} color="primary" size="small" />
                          </Box>
                          <Typography variant="body2">
                            {formatDate(expo.dateRange.startDate)} - {formatDate(expo.dateRange.endDate)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {expo.location.city}, {expo.location.country}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={() => navigate(`/attendee/expo/${expo.expoId}`)}>
                            View Details
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Explore />}
                  onClick={() => navigate('/attendee/browse')}
                >
                  Browse All Expos
                </Button>
              </Box>
            </Grid>

            {/* Upcoming Sessions */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h5">My Upcoming Sessions</Typography>
              </Box>

              {personalSchedule.length === 0 ? (
                <Alert severity="info">
                  You haven't bookmarked any sessions yet. Browse expos to find interesting sessions!
                </Alert>
              ) : upcomingSessions.length === 0 ? (
                <Alert severity="info">No upcoming sessions. All your bookmarked sessions have passed.</Alert>
              ) : (
                <Box>
                  {upcomingSessions.map((session) => (
                    <Card key={session.sessionId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {session.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Time:</strong> {formatTime(session.schedule.startTime)} -{' '}
                            {formatTime(session.schedule.endTime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Location:</strong> {session.location.room}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={session.category} size="small" variant="outlined" />
                          <Chip label={session.topic} size="small" variant="outlined" />
                        </Box>
                        {session.conflicts.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            This session conflicts with {session.conflicts.length} other session(s)
                          </Alert>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => navigate('/attendee/schedule')}>
                          View Full Schedule
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}

              {personalSchedule.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Schedule />}
                    onClick={() => navigate('/attendee/schedule')}
                  >
                    View All Sessions
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

