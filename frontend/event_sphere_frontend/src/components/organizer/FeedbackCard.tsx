/**
 * FeedbackCard Component
 * Displays submission details, submitter info, status badge, actions
 * Implements T222
 */

import { Typography, Box, Chip, Avatar } from '@mui/material';
import { BugReport, Lightbulb, HelpOutline, Reply, Assignment } from '@mui/icons-material';
import type { FeedbackSubmission } from '../../types/feedback';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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

  const getStatusColorValue = () => {
    const statusColor = getStatusColor();
    if (statusColor === 'success') return activeTheme.success;
    if (statusColor === 'warning') return activeTheme.warning;
    if (statusColor === 'info') return activeTheme.info;
    return activeTheme.textSecondary;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryIconColor = () => {
    switch (feedback.category) {
      case 'bug-report':
        return activeTheme.error;
      case 'suggestion':
        return activeTheme.warning;
      case 'support-request':
        return activeTheme.accent;
      default:
        return activeTheme.textSecondary;
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ color: getCategoryIconColor() }}>
              {getCategoryIcon()}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
              {feedback.subject}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={feedback.status} 
              size="small"
              sx={{
                bgcolor: `${getStatusColorValue()}20`,
                color: getStatusColorValue(),
                border: `1px solid ${getStatusColorValue()}30`,
                fontWeight: 700
              }}
            />
            <Chip 
              label={feedback.category} 
              size="small"
              sx={{
                bgcolor: activeTheme.surfaceLight,
                color: activeTheme.textSecondary,
                border: `1px solid ${activeTheme.border}`,
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: activeTheme.accent, border: `2px solid ${activeTheme.accentGlow}` }}>
            {feedback.submitter.name[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
              {feedback.submitter.name}
            </Typography>
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary }}>
              {feedback.submitter.email}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-wrap', color: activeTheme.textSecondary, lineHeight: 1.7 }}>
          {feedback.message}
        </Typography>

        {feedback.response && (
          <Box sx={{ mt: 3, p: 3, bgcolor: activeTheme.surface, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: activeTheme.textPrimary }}>
              Response:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: activeTheme.textSecondary, lineHeight: 1.7 }}>
              {feedback.response}
            </Typography>
          </Box>
        )}

        {feedback.assignedTo && (
          <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, display: 'block', mt: 2 }}>
            Assigned to: <span style={{ color: activeTheme.textPrimary }}>{feedback.assignedTo.name} ({feedback.assignedTo.email})</span>
          </Typography>
        )}

        <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, display: 'block', mt: 2 }}>
          Submitted: {formatDate(feedback.createdAt)}
          {feedback.updatedAt !== feedback.createdAt &&
            ` • Updated: ${formatDate(feedback.updatedAt)}`}
        </Typography>

        {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {onAssign && !feedback.assignedTo && (
              <ActionButton
                size="small"
                startIcon={<Assignment />}
                onClick={() => onAssign(feedback)}
              >
                Assign
              </ActionButton>
            )}
            {onRespond && (
              <ActionButton
                size="small"
                primary
                startIcon={<Reply />}
                onClick={() => onRespond(feedback)}
                disabled={feedback.status === 'closed'}
              >
                {feedback.response ? 'Update Response' : 'Respond'}
              </ActionButton>
            )}
          </Box>
        )}
      </GlassCard>
    </MotionBox>
  );
}

