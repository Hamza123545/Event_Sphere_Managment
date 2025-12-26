/**
 * Analytics Dashboard Page
 * Metrics display, filter controls, export button
 * Implements T187
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { ArrowBack, GetApp, People, Event, Storefront, TrendingUp } from '@mui/icons-material';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useExpoStore } from '../../stores/expoStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  PageContainer,
  BackgroundGlows,
  GlassContainer,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';
import MetricCard from '../../components/organizer/MetricCard';
import SessionPopularityChart from '../../components/organizer/SessionPopularityChart';
import AttendeeCountWidget from '../../components/organizer/AttendeeCountWidget';
import ExportReportDialog from '../../components/organizer/ExportReportDialog';

type MetricType = 'all' | 'attendee-count' | 'session-popularity' | 'booth-traffic' | 'engagement-rate';

export default function AnalyticsPage() {
  const { expoId } = useParams<{ expoId: string }>();
  const navigate = useNavigate();
  const {
    analytics,
    isLoading,
    error,
    getAnalytics,
    exportAnalytics,
    clearError,
    clearAnalytics,
  } = useAnalyticsStore();
  const { getExpo, selectedExpo } = useExpoStore();

  const [metricFilter, setMetricFilter] = useState<MetricType>('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    if (expoId) {
      getExpo(expoId);
      const metricType = metricFilter === 'all' ? undefined : metricFilter;
      getAnalytics(expoId, metricType);
    }

    return () => {
      clearAnalytics();
    };
  }, [expoId, metricFilter, getAnalytics, getExpo, clearAnalytics]);

  const handleMetricFilterChange = (value: MetricType) => {
    setMetricFilter(value);
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (expoId) {
      await exportAnalytics(expoId, format);
    }
  };

  if (!expoId) {
    return (
      <PageContainer>
        <ModernNavbar />
        <Box sx={{ mt: 8, px: { xs: 3, md: 8 } }}>
          <Alert severity="error" sx={{ bgcolor: `${activeTheme.error}20`, border: `1px solid ${activeTheme.error}30` }}>
            Invalid expo ID
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <ActionButton startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 2 }}>
              Back to Dashboard
            </ActionButton>
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px' }}>
              Analytics: {selectedExpo?.title || 'Loading...'}
            </Typography>
          </Box>
          <ActionButton
            primary
            startIcon={<GetApp />}
            onClick={() => setExportDialogOpen(true)}
            disabled={!analytics}
          >
            Export Report
          </ActionButton>
        </MotionBox>

        {/* Filter Controls */}
        <GlassContainer sx={{ p: 3, mb: 4 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel sx={{ color: activeTheme.textSecondary }}>Filter by Metric Type</InputLabel>
            <Select
              value={metricFilter}
              label="Filter by Metric Type"
              onChange={(e) => handleMetricFilterChange(e.target.value as MetricType)}
              sx={{
                bgcolor: activeTheme.surface,
                color: activeTheme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.accent,
                },
              }}
            >
              <MenuItem value="all">All Metrics</MenuItem>
              <MenuItem value="attendee-count">Attendee Count</MenuItem>
              <MenuItem value="session-popularity">Session Popularity</MenuItem>
              <MenuItem value="booth-traffic">Booth Traffic</MenuItem>
              <MenuItem value="engagement-rate">Engagement Rate</MenuItem>
            </Select>
          </FormControl>
        </GlassContainer>

        {/* Error Alert */}
        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Loading Spinner */}
        {isLoading && !analytics && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        )}

        {/* Analytics Content */}
        {!isLoading && analytics && (
          <>
            {/* Metric Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {analytics.attendeeCount && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Attendees"
                      value={analytics.attendeeCount.total}
                      icon={<People />}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Registered"
                      value={analytics.attendeeCount.registered}
                      icon={<People />}
                      color="info"
                      subtitle={`${analytics.attendeeCount.total > 0 ? ((analytics.attendeeCount.registered / analytics.attendeeCount.total) * 100).toFixed(1) : 0}% of total`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Checked In"
                      value={analytics.attendeeCount.checkedIn}
                      icon={<People />}
                      color="success"
                      subtitle={`${analytics.attendeeCount.registered > 0 ? ((analytics.attendeeCount.checkedIn / analytics.attendeeCount.registered) * 100).toFixed(1) : 0}% of registered`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="No Shows"
                      value={analytics.attendeeCount.noShow}
                      icon={<People />}
                      color="error"
                    />
                  </Grid>
                </>
              )}

              {analytics.boothTraffic && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Booths"
                      value={analytics.boothTraffic.totalBooths}
                      icon={<Storefront />}
                      color="secondary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Occupancy Rate"
                      value={`${analytics.boothTraffic.occupancyRate}%`}
                      icon={<Storefront />}
                      color="primary"
                      subtitle={`${analytics.boothTraffic.reservedBooths} reserved`}
                    />
                  </Grid>
                </>
              )}

              {analytics.engagementRate && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Engagement Rate"
                      value={`${analytics.engagementRate.engagementRate}%`}
                      icon={<TrendingUp />}
                      color="success"
                      subtitle={`${analytics.engagementRate.attendeesWithBookmarks} attendees engaged`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Avg Bookmarks"
                      value={analytics.engagementRate.averageBookmarksPerAttendee.toFixed(1)}
                      icon={<Event />}
                      color="info"
                      subtitle="per attendee"
                    />
                  </Grid>
                </>
              )}
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
              {analytics.attendeeCount && (
                <Grid item xs={12} md={6}>
                  <AttendeeCountWidget data={analytics.attendeeCount} />
                </Grid>
              )}

              {analytics.sessionPopularity && (
                <Grid item xs={12} md={analytics.attendeeCount ? 6 : 12}>
                  <SessionPopularityChart data={analytics.sessionPopularity} />
                </Grid>
              )}

              {analytics.boothTraffic && !analytics.attendeeCount && (
                <Grid item xs={12}>
                  <GlassCard>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
                      Booth Traffic Summary
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                        Total Booths: <span style={{ color: activeTheme.textPrimary, fontWeight: 600 }}>{analytics.boothTraffic.totalBooths}</span>
                      </Typography>
                      <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                        Reserved: <span style={{ color: activeTheme.textPrimary, fontWeight: 600 }}>{analytics.boothTraffic.reservedBooths}</span>
                      </Typography>
                      <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                        Available: <span style={{ color: activeTheme.textPrimary, fontWeight: 600 }}>{analytics.boothTraffic.availableBooths}</span>
                      </Typography>
                      <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                        Occupancy Rate: <span style={{ color: activeTheme.accent, fontWeight: 600 }}>{analytics.boothTraffic.occupancyRate}%</span>
                      </Typography>
                    </Box>
                  </GlassCard>
                </Grid>
              )}
            </Grid>

            {/* Generated At */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary }}>
                Report generated: {new Date(analytics.generatedAt).toLocaleString()}
              </Typography>
            </Box>
          </>
        )}

        {/* Export Dialog */}
        <ExportReportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onExport={handleExport}
          isLoading={isLoading}
          expoTitle={selectedExpo?.title}
        />
      </Box>
    </PageContainer>
  );
}

