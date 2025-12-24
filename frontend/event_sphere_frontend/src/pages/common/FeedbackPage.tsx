/**
 * Feedback Page
 * Feedback form and my submissions list
 * Implements T220
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack, BugReport, Lightbulb, HelpOutline } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
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
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Feedback" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(getDashboardPath())}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Feedback Form */}
        <Box sx={{ mb: 4 }}>
          <FeedbackForm
            onSuccess={() => {
              // Refresh my feedback list
              getMyFeedback();
            }}
          />
        </Box>

        {/* My Submissions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            My Feedback Submissions
          </Typography>

          {isLoading && <LoadingSpinner />}

          {!isLoading && myFeedback.length === 0 && (
            <Alert severity="info">You haven't submitted any feedback yet.</Alert>
          )}

          {!isLoading && myFeedback.length > 0 && (
            <List>
              {myFeedback.map((feedback, index) => (
                <Box key={feedback.feedbackId}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getCategoryIcon(feedback.category)}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {feedback.subject}
                          </Typography>
                          <Chip
                            label={feedback.status}
                            color={getStatusColor(feedback.status)}
                            size="small"
                          />
                          <Chip
                            label={feedback.category}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {feedback.message}
                          </Typography>
                          {feedback.response && (
                            <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Response:
                              </Typography>
                              <Typography variant="body2">{feedback.response}</Typography>
                            </Alert>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {formatDate(feedback.createdAt)}
                            {feedback.updatedAt !== feedback.createdAt &&
                              ` • Updated: ${formatDate(feedback.updatedAt)}`}
                          </Typography>
                          {feedback.assignedTo && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
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
        </Paper>
      </Container>
    </Box>
  );
}

