/**
 * Expo Detail Page
 * Shows expo information with tabs for Schedule, Exhibitors, and Floor Plan
 * Implements T104: User Story 3
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Alert,
} from '@mui/material';
import { ArrowBack, Event, Schedule, Store, Map, LocationOn } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ScheduleView from '../../components/attendee/ScheduleView';
import AttendeeRegistrationForm from '../../components/attendee/AttendeeRegistrationForm';
import ExhibitorSearch from '../../components/attendee/ExhibitorSearch';
import ExhibitorList from '../../components/attendee/ExhibitorList';
import ExhibitorProfile from '../../components/attendee/ExhibitorProfile';
import FloorPlanView from '../../components/attendee/FloorPlanView';
import { useAttendeeStore } from '../../stores/attendeeStore';
import {
  PageContainer,
  BackgroundGlows,
  GlassContainer,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
    }

    return () => {
      if (expoId) {
        unsubscribeFromScheduleUpdates(expoId);
      }
    };
  }, [expoId, getExpoDetails, unsubscribeFromScheduleUpdates]);

  // Load exhibitors and floor plan when registration status changes and user switches to those tabs
  useEffect(() => {
    if (expoId && selectedExpo?.registrationStatus === 'registered') {
      if (tabValue === 1) {
        // Exhibitors tab - load exhibitors
        searchExhibitors(expoId);
      } else if (tabValue === 2) {
        // Floor plan tab - load floor plan only when tab is active
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
      <PageContainer>
        <ModernNavbar navItems={[
          { label: 'Explore', path: '/attendee/expos' },
          { label: 'My Events', path: '/attendee' },
        ]} />
        <LoadingSpinner fullScreen />
      </PageContainer>
    );
  }

  if (!selectedExpo || !expoId) {
    return (
      <PageContainer>
        <ModernNavbar navItems={[
          { label: 'Explore', path: '/attendee/expos' },
          { label: 'My Events', path: '/attendee' },
        ]} />
        <Box sx={{ mt: 8, px: { xs: 3, md: 8 } }}>
          <ErrorAlert message="Expo not found" severity="error" />
        </Box>
      </PageContainer>
    );
  }

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
        </MotionBox>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Expo Header */}
        <GlassContainer sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
                {selectedExpo.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={selectedExpo.status} 
                  sx={{ 
                    bgcolor: selectedExpo.status === 'active' ? activeTheme.error : activeTheme.accent,
                    color: '#fff',
                    fontWeight: 700
                  }} 
                />
                {selectedExpo.registrationStatus === 'registered' && (
                  <Chip 
                    label="Registered" 
                    sx={{ 
                      bgcolor: activeTheme.success + '20',
                      color: activeTheme.success,
                      border: `1px solid ${activeTheme.success}30`,
                      fontWeight: 700
                    }} 
                  />
                )}
              </Box>
              {selectedExpo.theme && (
                <Typography variant="body1" sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                  Theme: {selectedExpo.theme}
                </Typography>
              )}
            </Box>
            {selectedExpo.registrationStatus === 'not-registered' && (
              <ActionButton
                primary
                startIcon={<Event />}
                onClick={() => setRegistrationDialogOpen(true)}
              >
                Register for Expo
              </ActionButton>
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 3, color: activeTheme.textSecondary, lineHeight: 1.7 }}>
            {selectedExpo.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                DATES
              </Typography>
              <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                {formatDate(selectedExpo.dateRange.startDate)} - {formatDate(selectedExpo.dateRange.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                LOCATION
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: activeTheme.accent }} />
                <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                  {selectedExpo.location.venueName}
                  <br />
                  {selectedExpo.location.city}, {selectedExpo.location.country}
                </Typography>
              </Box>
            </Box>
          </Box>
        </GlassContainer>

        {/* Tabs */}
        <GlassContainer sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: activeTheme.textSecondary,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: activeTheme.accent,
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: activeTheme.accent,
              },
            }}
          >
            <Tab icon={<Schedule />} iconPosition="start" label="Schedule" />
            <Tab icon={<Store />} iconPosition="start" label="Exhibitors" />
            <Tab icon={<Map />} iconPosition="start" label="Floor Plan" />
          </Tabs>
        </GlassContainer>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {selectedExpo.registrationStatus === 'not-registered' ? (
            <GlassCard>
              <Alert 
                severity="info"
                sx={{
                  bgcolor: `${activeTheme.info}20`,
                  border: `1px solid ${activeTheme.info}30`,
                  color: activeTheme.textPrimary,
                }}
              >
                Please register for this expo to view the schedule and bookmark sessions.
              </Alert>
            </GlassCard>
          ) : (
            <ScheduleView expoId={expoId} />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedExpo.registrationStatus === 'not-registered' ? (
            <GlassCard>
              <Alert 
                severity="info"
                sx={{
                  bgcolor: `${activeTheme.info}20`,
                  border: `1px solid ${activeTheme.info}30`,
                  color: activeTheme.textPrimary,
                }}
              >
                Please register for this expo to view exhibitors and floor plan.
              </Alert>
            </GlassCard>
          ) : (
            <Box>
              <ExhibitorSearch
                onSearch={(params) => searchExhibitors(expoId, params)}
                categories={Array.from(new Set(exhibitors.map((e) => e.category)))}
                isLoading={isLoading}
              />
              {selectedExhibitor ? (
                <Box>
                  <ActionButton 
                    onClick={() => {
                      searchExhibitors(expoId);
                    }} 
                    sx={{ mb: 3 }}
                    startIcon={<ArrowBack />}
                  >
                    Back to List
                  </ActionButton>
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
            <GlassCard>
              <Alert 
                severity="info"
                sx={{
                  bgcolor: `${activeTheme.info}20`,
                  border: `1px solid ${activeTheme.info}30`,
                  color: activeTheme.textPrimary,
                }}
              >
                Please register for this expo to view the floor plan.
              </Alert>
            </GlassCard>
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
            <GlassCard>
              <Alert 
                severity="info"
                sx={{
                  bgcolor: `${activeTheme.info}20`,
                  border: `1px solid ${activeTheme.info}30`,
                  color: activeTheme.textPrimary,
                }}
              >
                Floor plan not available for this expo.
              </Alert>
            </GlassCard>
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
      </Box>
    </PageContainer>
  );
}

