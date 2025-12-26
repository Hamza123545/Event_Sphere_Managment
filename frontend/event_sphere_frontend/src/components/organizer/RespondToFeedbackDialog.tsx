/**
 * RespondToFeedbackDialog Component
 * Response textarea, status dropdown, send button
 * Implements T223
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import type { FeedbackSubmission, FeedbackStatus } from '../../types/feedback';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface RespondToFeedbackDialogProps {
  open: boolean;
  feedback: FeedbackSubmission | null;
  onClose: () => void;
  onRespond: (feedbackId: string, response: string, status?: FeedbackStatus) => Promise<void>;
  isLoading?: boolean;
}

export default function RespondToFeedbackDialog({
  open,
  feedback,
  onClose,
  onRespond,
  isLoading = false,
}: RespondToFeedbackDialogProps) {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('resolved');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      setResponse(feedback.response || '');
      setStatus(feedback.status);
    } else {
      setResponse('');
      setStatus('resolved');
    }
    setError(null);
  }, [feedback, open]);

  const handleSubmit = async () => {
    if (!feedback) return;

    if (!response.trim()) {
      setError('Response is required');
      return;
    }

    try {
      await onRespond(feedback.feedbackId, response.trim(), status);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send response');
    }
  };

  const handleClose = () => {
    setResponse('');
    setError(null);
    onClose();
  };

  if (!feedback) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
        Respond to Feedback
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: activeTheme.surface }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: activeTheme.textSecondary, fontWeight: 700 }}>
            Subject:
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: activeTheme.textPrimary, fontWeight: 600 }}>
            {feedback.subject}
          </Typography>
          <Typography variant="subtitle2" gutterBottom sx={{ color: activeTheme.textSecondary, fontWeight: 700 }}>
            Original Message:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', bgcolor: activeTheme.surfaceLight, p: 2, borderRadius: 2, border: `1px solid ${activeTheme.border}`, color: activeTheme.textSecondary, lineHeight: 1.7 }}>
            {feedback.message}
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              bgcolor: `${activeTheme.error}20`,
              border: `1px solid ${activeTheme.error}30`,
              color: activeTheme.textPrimary
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ color: activeTheme.textSecondary }}>Status</InputLabel>
          <Select 
            value={status} 
            label="Status" 
            onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
            sx={{
              bgcolor: activeTheme.surfaceLight,
              color: activeTheme.textPrimary,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: activeTheme.border,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: activeTheme.accent,
              },
            }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          required
          multiline
          rows={6}
          inputProps={{ maxLength: 5000 }}
          helperText={`${response.length}/5000 characters`}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: activeTheme.surfaceLight,
              color: activeTheme.textPrimary,
              '& fieldset': {
                borderColor: activeTheme.border,
              },
              '&:hover fieldset': {
                borderColor: activeTheme.accent,
              },
            },
            '& .MuiInputLabel-root': {
              color: activeTheme.textSecondary,
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={handleClose} disabled={isLoading}>
          Cancel
        </ActionButton>
        <ActionButton
          onClick={handleSubmit}
          primary
          startIcon={<Send />}
          disabled={isLoading || !response.trim()}
        >
          {isLoading ? 'Sending...' : 'Send Response'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

