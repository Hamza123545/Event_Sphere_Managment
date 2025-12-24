/**
 * FeedbackCard Component
 * Displays submission details, submitter info, status badge, actions
 * Implements T222
 */

import { Card, CardContent, CardActions, Typography, Box, Chip, Avatar, Button } from '@mui/material';
import { BugReport, Lightbulb, HelpOutline, Reply, Assignment } from '@mui/icons-material';
import type { FeedbackSubmission } from '../../types/feedback';

interface FeedbackCardProps {
  feedback: FeedbackSubmission;
  onRespond?: (feedback: FeedbackSubmission) => void;
  onAssign?: (feedback: FeedbackSubmission) => void;
}

export default function FeedbackCard({ feedback, onRespond, onAssign }: FeedbackCardProps) {
  const getCategoryIcon = () => {
    switch (feedback.category) {
      case 'bug-report':
        return <BugReport color="error" />;
      case 'suggestion':
        return <Lightbulb color="warning" />;
      case 'support-request':
        return <HelpOutline color="primary" />;
    }
  };

  const getStatusColor = (): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (feedback.status) {
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
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCategoryIcon()}
            <Typography variant="h6">{feedback.subject}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={feedback.status} color={getStatusColor()} size="small" />
            <Chip label={feedback.category} variant="outlined" size="small" />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {feedback.submitter.name[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {feedback.submitter.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {feedback.submitter.email}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {feedback.message}
        </Typography>

        {feedback.response && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Response:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {feedback.response}
            </Typography>
          </Box>
        )}

        {feedback.assignedTo && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Assigned to: {feedback.assignedTo.name} ({feedback.assignedTo.email})
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Submitted: {formatDate(feedback.createdAt)}
          {feedback.updatedAt !== feedback.createdAt &&
            ` • Updated: ${formatDate(feedback.updatedAt)}`}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
          <>
            {onAssign && !feedback.assignedTo && (
              <Button
                size="small"
                startIcon={<Assignment />}
                onClick={() => onAssign(feedback)}
                variant="outlined"
              >
                Assign
              </Button>
            )}
            {onRespond && (
              <Button
                size="small"
                startIcon={<Reply />}
                onClick={() => onRespond(feedback)}
                variant="contained"
                disabled={feedback.status === 'closed'}
              >
                {feedback.response ? 'Update Response' : 'Respond'}
              </Button>
            )}
          </>
        )}
      </CardActions>
    </Card>
  );
}

