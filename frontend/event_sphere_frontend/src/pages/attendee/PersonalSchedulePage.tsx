/**
 * Personal Schedule Page
 * Displays all bookmarked sessions with conflict highlighting
 * Implements T110: User Story 3
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import { ArrowBack, Schedule, Warning } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';

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
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Attendee Portal" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/attendee')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          My Personal Schedule
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          All your bookmarked sessions across all expos
        </Typography>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {isLoading && personalSchedule.length === 0 ? (
          <LoadingSpinner />
        ) : personalSchedule.length === 0 ? (
          <Alert severity="info">
            You haven't bookmarked any sessions yet. Browse expos to find interesting sessions!
          </Alert>
        ) : (
          <Box>
            {dates.map((date) => (
              <Box key={date} sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  {formatDate(date)}
                </Typography>

                {sessionsByDate[date].map((session) => (
                  <Card
                    key={session.sessionId}
                    sx={{
                      mb: 2,
                      borderLeft: session.conflicts.length > 0 ? 4 : 0,
                      borderColor: session.conflicts.length > 0 ? 'warning.main' : 'transparent',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {session.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              <Schedule fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {formatTime(session.schedule.startTime)} - {formatTime(session.schedule.endTime)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Location: {session.location.room}
                              {session.location.building && `, ${session.location.building}`}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip label={session.category} size="small" variant="outlined" />
                            <Chip label={session.topic} size="small" variant="outlined" />
                          </Box>
                        </Box>
                      </Box>

                      {session.conflicts.length > 0 && (
                        <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Scheduling Conflict
                          </Typography>
                          <Typography variant="body2">
                            This session overlaps with {session.conflicts.length} other session(s) in your schedule.
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

