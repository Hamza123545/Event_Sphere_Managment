/**
 * FeedbackQueue Page
 * All submissions, filter by category/status, assign/respond buttons
 * Implements T221
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { ArrowBack, FilterList } from '@mui/icons-material';
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
    respondToFeedback,
    clearError,
  } = useFeedbackStore();

  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);

  useEffect(() => {
    const filters: Record<string, FeedbackStatus | FeedbackCategory> = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    getFeedbackQueue(filters);
  }, [statusFilter, categoryFilter, getFeedbackQueue]);

  const handleRespond = (feedback: FeedbackSubmission) => {
    setSelectedFeedback(feedback);
    setRespondDialogOpen(true);
  };


  const handleRespondSubmit = async (feedbackId: string, response: string, status?: FeedbackStatus) => {
    await respondToFeedback(feedbackId, response);
    if (status && status !== 'resolved') {
      await updateFeedbackStatus(feedbackId, status);
    }
    setRespondDialogOpen(false);
    setSelectedFeedback(null);
    // Refresh queue
    const filters: Record<string, FeedbackStatus | FeedbackCategory> = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    getFeedbackQueue(filters);
  };

  const filteredFeedback = feedbackQueue; // Already filtered by API

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4 }}
        >
          <ActionButton startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 3 }}>
            Back to Dashboard
          </ActionButton>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px' }}>
            Feedback Queue
          </Typography>
        </MotionBox>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Filters */}
        <GlassContainer sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: activeTheme.accent }} />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: activeTheme.textSecondary }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
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
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: activeTheme.textSecondary }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | 'all')}
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
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
                <MenuItem value="bug-report">Bug Report</MenuItem>
                <MenuItem value="support-request">Support Request</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </GlassContainer>

        {/* Feedback List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : filteredFeedback.length === 0 ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: activeTheme.textSecondary }}>
                No feedback submissions found.
              </Typography>
            </Box>
          </GlassCard>
        ) : (
          <Grid container spacing={3}>
            {filteredFeedback.map((feedback, index) => (
              <Grid item xs={12} key={feedback.feedbackId}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FeedbackCard
                    feedback={feedback}
                    onRespond={handleRespond}
                  />
                </MotionBox>
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
      </Box>
    </PageContainer>
  );
}

