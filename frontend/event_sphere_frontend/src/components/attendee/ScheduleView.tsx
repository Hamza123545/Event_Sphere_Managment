/**
 * ScheduleView Component
 * Displays sessions chronologically with filters
 * Implements T105: User Story 3
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import SessionCard from './SessionCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';
import type { SessionDetail } from '../../types/attendee';

interface ScheduleViewProps {
  expoId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScheduleView({ expoId }: ScheduleViewProps) {
  const { sessions, isLoading, error, getSchedule, bookmarkSession, removeBookmark, clearError } = useAttendeeStore();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'success' } | null>(null);

  useEffect(() => {
    getSchedule(expoId, {
      category: categoryFilter || undefined,
      topic: topicFilter || undefined,
      date: selectedDate || undefined,
    });
  }, [expoId, categoryFilter, topicFilter, selectedDate, getSchedule]);

  // Listen for real-time schedule updates (T140)
  useEffect(() => {
    const socket = require('../../services/socket').getSocket();
    if (!socket) return;

    const handleScheduleChanged = (event: any) => {
      if (event.expoId === expoId && event.session) {
        // Highlight the changed session
        setHighlightedSessionId(event.session.sessionId);
        setNotification({
          message: `Schedule updated: ${event.session.title}`,
          type: 'info',
        });

        // Remove highlight after 5 seconds
        setTimeout(() => {
          setHighlightedSessionId(null);
        }, 5000);

        // Clear notification after 5 seconds
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    };

    const handleSessionDeleted = (event: any) => {
      if (event.expoId === expoId) {
        setNotification({
          message: `Session "${event.title || 'A session'}" has been cancelled`,
          type: 'warning',
        });
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    };

    socket.on('schedule-changed', handleScheduleChanged);
    socket.on('session-deleted', handleSessionDeleted);

    return () => {
      socket.off('schedule-changed', handleScheduleChanged);
      socket.off('session-deleted', handleSessionDeleted);
    };
  }, [expoId]);

  // Get unique categories and topics for filters
  const categories = Array.from(new Set(sessions.map((s) => s.category)));
  const topics = Array.from(new Set(sessions.map((s) => s.topic)));

  // Filter sessions by search term
  const filteredSessions = sessions.filter((session) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        session.title.toLowerCase().includes(searchLower) ||
        session.description.toLowerCase().includes(searchLower) ||
        session.speakers.some((s) => s.name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const date = new Date(session.schedule.startTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, SessionDetail[]>);

  // Sort sessions within each date by start time
  Object.keys(sessionsByDate).forEach((date) => {
    sessionsByDate[date].sort(
      (a, b) => new Date(a.schedule.startTime).getTime() - new Date(b.schedule.startTime).getTime()
    );
  });

  const handleBookmark = async (session: SessionDetail) => {
    await bookmarkSession(expoId, session.sessionId);
  };

  const handleRemoveBookmark = async (session: SessionDetail) => {
    await removeBookmark(expoId, session.sessionId);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Set date filter based on tab
    const dates = Object.keys(sessionsByDate).sort();
    if (newValue === 0) {
      setSelectedDate('');
    } else if (dates[newValue - 1]) {
      setSelectedDate(new Date(dates[newValue - 1]).toISOString().split('T')[0]);
    }
  };

  if (error) {
    return <ErrorAlert message={error} onClose={clearError} severity="error" />;
  }

  if (isLoading && sessions.length === 0) {
    return <LoadingSpinner />;
  }

  const dates = Object.keys(sessionsByDate).sort();

  return (
    <Box>
      {/* Toast Notification (T140) */}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Topic</InputLabel>
          <Select value={topicFilter} label="Topic" onChange={(e) => setTopicFilter(e.target.value)}>
            <MenuItem value="">All Topics</MenuItem>
            {topics.map((topic) => (
              <MenuItem key={topic} value={topic}>
                {topic}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredSessions.length === 0 ? (
        <Alert severity="info">No sessions found matching your criteria.</Alert>
      ) : (
        <Box>
          {/* Date Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="All Dates" />
              {dates.map((date) => (
                <Tab
                  key={date}
                  label={new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              ))}
            </Tabs>
          </Box>

          {/* All Dates View */}
          <TabPanel value={tabValue} index={0}>
            {dates.map((date) => (
              <Box key={date} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
                <Grid container spacing={3}>
                  {sessionsByDate[date].map((session) => (
                    <Grid item xs={12} sm={6} md={4} key={session.sessionId}>
                      <SessionCard
                        session={session}
                        onBookmark={() => handleBookmark(session)}
                        onRemoveBookmark={() => handleRemoveBookmark(session)}
                        isLoading={isLoading}
                        highlighted={highlightedSessionId === session.sessionId}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </TabPanel>

          {/* Individual Date Views */}
          {dates.map((date, dateIndex) => (
            <TabPanel key={date} value={tabValue} index={dateIndex + 1}>
              <Grid container spacing={3}>
                {sessionsByDate[date].map((session) => (
                  <Grid item xs={12} sm={6} md={4} key={session.sessionId}>
                    <SessionCard
                      session={session}
                      onBookmark={() => handleBookmark(session)}
                      onRemoveBookmark={() => handleRemoveBookmark(session)}
                      isLoading={isLoading}
                    />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          ))}
        </Box>
      )}
    </Box>
  );
}

