/**
 * FeedbackQueue Page
 * All submissions, filter by category/status, assign/respond buttons
 * Implements T221
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { ArrowBack, FilterList } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import FeedbackCard from '../../components/organizer/FeedbackCard';
import RespondToFeedbackDialog from '../../components/organizer/RespondToFeedbackDialog';
import { useFeedbackStore } from '../../stores/feedbackStore';
import type { FeedbackSubmission, FeedbackCategory, FeedbackStatus } from '../../types/feedback';

export default function FeedbackQueuePage() {
  const navigate = useNavigate();
  const {
    feedbackQueue,
    isLoading,
    error,
    getFeedbackQueue,
    updateFeedbackStatus,
    assignFeedback,
    respondToFeedback,
    clearError,
  } = useFeedbackStore();

  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    getFeedbackQueue(filters);
  }, [statusFilter, categoryFilter, getFeedbackQueue]);

  const handleRespond = (feedback: FeedbackSubmission) => {
    setSelectedFeedback(feedback);
    setRespondDialogOpen(true);
  };

  const handleAssign = (feedback: FeedbackSubmission) => {
    setSelectedFeedback(feedback);
    setAssignDialogOpen(true);
  };

  const handleRespondSubmit = async (feedbackId: string, response: string, status?: FeedbackStatus) => {
    await respondToFeedback(feedbackId, response);
    if (status && status !== 'resolved') {
      await updateFeedbackStatus(feedbackId, status);
    }
    setRespondDialogOpen(false);
    setSelectedFeedback(null);
    // Refresh queue
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    getFeedbackQueue(filters);
  };

  const filteredFeedback = feedbackQueue; // Already filtered by API

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Feedback Queue" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>

        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | 'all')}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
                <MenuItem value="bug-report">Bug Report</MenuItem>
                <MenuItem value="support-request">Support Request</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Feedback List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredFeedback.length === 0 ? (
          <Alert severity="info">No feedback submissions found.</Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredFeedback.map((feedback) => (
              <Grid item xs={12} key={feedback.feedbackId}>
                <FeedbackCard
                  feedback={feedback}
                  onRespond={handleRespond}
                  onAssign={handleAssign}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Respond Dialog */}
        <RespondToFeedbackDialog
          open={respondDialogOpen}
          feedback={selectedFeedback}
          onClose={() => {
            setRespondDialogOpen(false);
            setSelectedFeedback(null);
          }}
          onRespond={handleRespondSubmit}
          isLoading={isLoading}
        />
      </Container>
    </Box>
  );
}

