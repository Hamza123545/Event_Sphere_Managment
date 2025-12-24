/**
 * Expo Detail Page
 * Shows expo information with tabs for Schedule, Exhibitors, and Floor Plan
 * Implements T104: User Story 3
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack, Event, Schedule, Store, Map } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ScheduleView from '../../components/attendee/ScheduleView';
import AttendeeRegistrationForm from '../../components/attendee/AttendeeRegistrationForm';
import ExhibitorSearch from '../../components/attendee/ExhibitorSearch';
import ExhibitorList from '../../components/attendee/ExhibitorList';
import ExhibitorProfile from '../../components/attendee/ExhibitorProfile';
import FloorPlanView from '../../components/attendee/FloorPlanView';
import { useAttendeeStore } from '../../stores/attendeeStore';

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

export default function ExpoDetailPage() {
  const { expoId } = useParams<{ expoId: string }>();
  const navigate = useNavigate();
  const {
    selectedExpo,
    exhibitors,
    selectedExhibitor,
    floorPlan,
    isLoading,
    error,
    getExpoDetails,
    searchExhibitors,
    getExhibitorProfile,
    viewFloorPlan,
    clearError,
    unsubscribeFromScheduleUpdates,
  } = useAttendeeStore();
  const [tabValue, setTabValue] = useState(0);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);

  useEffect(() => {
    if (expoId) {
      getExpoDetails(expoId);
      // Load exhibitors and floor plan when tabs are available
      if (selectedExpo?.registrationStatus === 'registered') {
        searchExhibitors(expoId);
        viewFloorPlan(expoId);
      }
    }

    return () => {
      if (expoId) {
        unsubscribeFromScheduleUpdates(expoId);
      }
    };
  }, [expoId, getExpoDetails, unsubscribeFromScheduleUpdates, searchExhibitors, viewFloorPlan, selectedExpo]);

  // Load exhibitors and floor plan when registration status changes
  useEffect(() => {
    if (expoId && selectedExpo?.registrationStatus === 'registered' && tabValue > 0) {
      if (tabValue === 1) {
        searchExhibitors(expoId);
      } else if (tabValue === 2) {
        viewFloorPlan(expoId);
      }
    }
  }, [expoId, selectedExpo?.registrationStatus, tabValue, searchExhibitors, viewFloorPlan]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRegisterSuccess = async () => {
    if (expoId) {
      await getExpoDetails(expoId);
    }
    setRegistrationDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading && !selectedExpo) {
    return (
      <>
        <AppBar title="Attendee Portal" />
        <LoadingSpinner fullScreen />
      </>
    );
  }

  if (!selectedExpo || !expoId) {
    return (
      <>
        <AppBar title="Attendee Portal" />
        <Container>
          <ErrorAlert message="Expo not found" severity="error" />
        </Container>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Attendee Portal" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/attendee')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {/* Expo Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {selectedExpo.title}
              </Typography>
              <Chip label={selectedExpo.status} color="primary" sx={{ mb: 2 }} />
              {selectedExpo.theme && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Theme: {selectedExpo.theme}
                </Typography>
              )}
            </Box>
            {selectedExpo.registrationStatus === 'not-registered' && (
              <Button
                variant="contained"
                startIcon={<Event />}
                onClick={() => setRegistrationDialogOpen(true)}
              >
                Register for Expo
              </Button>
            )}
            {selectedExpo.registrationStatus === 'registered' && (
              <Chip label="Registered" color="success" />
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedExpo.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Dates
              </Typography>
              <Typography variant="body2">
                {formatDate(selectedExpo.dateRange.startDate)} - {formatDate(selectedExpo.dateRange.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body2">
                {selectedExpo.location.venueName}
                <br />
                {selectedExpo.location.city}, {selectedExpo.location.country}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Schedule />} iconPosition="start" label="Schedule" />
            <Tab icon={<Store />} iconPosition="start" label="Exhibitors" />
            <Tab icon={<Map />} iconPosition="start" label="Floor Plan" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {selectedExpo.registrationStatus === 'not-registered' ? (
            <Alert severity="info">
              Please register for this expo to view the schedule and bookmark sessions.
            </Alert>
          ) : (
            <ScheduleView expoId={expoId} />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedExpo.registrationStatus === 'not-registered' ? (
            <Alert severity="info">
              Please register for this expo to view exhibitors and floor plan.
            </Alert>
          ) : (
            <Box>
              <ExhibitorSearch
                onSearch={(params) => searchExhibitors(expoId, params)}
                categories={Array.from(new Set(exhibitors.map((e) => e.category)))}
                isLoading={isLoading}
              />
              {selectedExhibitor ? (
                <Box>
                  <Button onClick={() => {
                    // Reset selected exhibitor in store
                    searchExhibitors(expoId);
                  }} sx={{ mb: 2 }}>
                    ← Back to List
                  </Button>
                  <ExhibitorProfile exhibitor={selectedExhibitor} />
                </Box>
              ) : (
                <ExhibitorList
                  exhibitors={exhibitors}
                  onViewProfile={(exhibitorId) => getExhibitorProfile(expoId, exhibitorId)}
                  isLoading={isLoading}
                />
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {selectedExpo.registrationStatus === 'not-registered' ? (
            <Alert severity="info">Please register for this expo to view the floor plan.</Alert>
          ) : floorPlan ? (
            <FloorPlanView
              floorPlan={floorPlan}
              exhibitors={exhibitors}
              onBoothClick={(exhibitorId) => {
                getExhibitorProfile(expoId, exhibitorId);
                setTabValue(1); // Switch to exhibitors tab
              }}
            />
          ) : (
            <Alert severity="info">Floor plan not available for this expo.</Alert>
          )}
        </TabPanel>

        {/* Registration Dialog */}
        <AttendeeRegistrationForm
          open={registrationDialogOpen}
          expoId={expoId}
          expoTitle={selectedExpo.title}
          onClose={() => setRegistrationDialogOpen(false)}
          onSuccess={handleRegisterSuccess}
        />
      </Container>
    </Box>
  );
}

