/**
 * Feedback Page
 * Feedback form and my submissions list
 * Implements T220
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack, BugReport, Lightbulb, HelpOutline } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';
import FeedbackForm from '../../components/common/FeedbackForm';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { useAuthStore } from '../../stores/authStore';
import type { FeedbackSubmission, FeedbackCategory } from '../../types/feedback';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myFeedback, isLoading, error, getMyFeedback, clearError } = useFeedbackStore();

  useEffect(() => {
    getMyFeedback();
  }, [getMyFeedback]);

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'organizer':
      case 'admin':
        return '/organizer';
      case 'exhibitor':
        return '/exhibitor';
      case 'attendee':
        return '/attendee';
      default:
        return '/';
    }
  };

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case 'bug-report':
        return <BugReport fontSize="small" />;
      case 'suggestion':
        return <Lightbulb fontSize="small" />;
      case 'support-request':
        return <HelpOutline fontSize="small" />;
    }
  };

  const getStatusColor = (
    status: FeedbackSubmission['status']
  ): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

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
          <ActionButton
            startIcon={<ArrowBack />}
            onClick={() => navigate(getDashboardPath())}
            sx={{ mb: 3 }}
          >
            Back to Dashboard
          </ActionButton>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px' }}>
            Feedback
          </Typography>
        </MotionBox>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Feedback Form */}
        <Box sx={{ mb: 6 }}>
          <FeedbackForm
            onSuccess={() => {
              // Refresh my feedback list
              getMyFeedback();
            }}
          />
        </Box>

        {/* My Submissions */}
        <GlassCard>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
            My Feedback Submissions
          </Typography>

          {isLoading && <LoadingSpinner />}

          {!isLoading && myFeedback.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: activeTheme.textSecondary }}>
                You haven't submitted any feedback yet.
              </Typography>
            </Box>
          )}

          {!isLoading && myFeedback.length > 0 && (
            <List>
              {myFeedback.map((feedback, index) => (
                <Box key={feedback.feedbackId}>
                  {index > 0 && <Divider sx={{ borderColor: activeTheme.border }} />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          {getCategoryIcon(feedback.category)}
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
                            {feedback.subject}
                          </Typography>
                          <Chip
                            label={feedback.status}
                            size="small"
                            sx={{
                              bgcolor: `${activeTheme[getStatusColor(feedback.status)]}20`,
                              color: activeTheme[getStatusColor(feedback.status)],
                              border: `1px solid ${activeTheme[getStatusColor(feedback.status)]}30`,
                              fontWeight: 600
                            }}
                          />
                          <Chip
                            label={feedback.category}
                            size="small"
                            sx={{
                              bgcolor: `${activeTheme.accent}20`,
                              color: activeTheme.accent,
                              border: `1px solid ${activeTheme.accent}30`,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, color: activeTheme.textSecondary }}>
                            {feedback.message}
                          </Typography>
                          {feedback.response && (
                            <Alert 
                              severity="info" 
                              sx={{ 
                                mt: 1, 
                                mb: 1,
                                bgcolor: `${activeTheme.info}20`,
                                border: `1px solid ${activeTheme.info}30`,
                                color: activeTheme.textPrimary
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Response:
                              </Typography>
                              <Typography variant="body2">{feedback.response}</Typography>
                            </Alert>
                          )}
                          <Typography variant="caption" sx={{ color: activeTheme.textSecondary }}>
                            Submitted: {formatDate(feedback.createdAt)}
                            {feedback.updatedAt !== feedback.createdAt &&
                              ` • Updated: ${formatDate(feedback.updatedAt)}`}
                          </Typography>
                          {feedback.assignedTo && (
                            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, display: 'block', mt: 0.5 }}>
                              Assigned to: {feedback.assignedTo.name}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </GlassCard>
      </Box>
    </PageContainer>
  );
}

