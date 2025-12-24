/**
 * Analytics Dashboard Page
 * Metrics display, filter controls, export button
 * Implements T187
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { ArrowBack, GetApp, People, Event, Storefront, TrendingUp } from '@mui/icons-material';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useExpoStore } from '../../stores/expoStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
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
      <>
        <AppBar title="Analytics Dashboard" />
        <Container>
          <Alert severity="error">Invalid expo ID</Alert>
        </Container>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Analytics Dashboard" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 1 }}>
              Back to Dashboard
            </Button>
            <Typography variant="h4" component="h1">
              Analytics: {selectedExpo?.title || 'Loading...'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={() => setExportDialogOpen(true)}
            disabled={!analytics}
          >
            Export Report
          </Button>
        </Box>

        {/* Filter Controls */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Metric Type</InputLabel>
            <Select
              value={metricFilter}
              label="Filter by Metric Type"
              onChange={(e) => handleMetricFilterChange(e.target.value as MetricType)}
            >
              <MenuItem value="all">All Metrics</MenuItem>
              <MenuItem value="attendee-count">Attendee Count</MenuItem>
              <MenuItem value="session-popularity">Session Popularity</MenuItem>
              <MenuItem value="booth-traffic">Booth Traffic</MenuItem>
              <MenuItem value="engagement-rate">Engagement Rate</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Loading Spinner */}
        {isLoading && !analytics && <LoadingSpinner />}

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
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Booth Traffic Summary
                    </Typography>
                    <Typography variant="body1">
                      Total Booths: {analytics.boothTraffic.totalBooths}
                    </Typography>
                    <Typography variant="body1">
                      Reserved: {analytics.boothTraffic.reservedBooths}
                    </Typography>
                    <Typography variant="body1">
                      Available: {analytics.boothTraffic.availableBooths}
                    </Typography>
                    <Typography variant="body1">
                      Occupancy Rate: {analytics.boothTraffic.occupancyRate}%
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Generated At */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
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
      </Container>
    </Box>
  );
}

