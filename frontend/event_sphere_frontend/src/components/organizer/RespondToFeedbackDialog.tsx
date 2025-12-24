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
  Button,
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Respond to Feedback</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Subject:
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {feedback.subject}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Original Message:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
            {feedback.message}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as FeedbackStatus)}>
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
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Send />}
          disabled={isLoading || !response.trim()}
        >
          {isLoading ? 'Sending...' : 'Send Response'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

