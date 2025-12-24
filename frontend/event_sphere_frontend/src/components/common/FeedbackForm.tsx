/**
 * FeedbackForm Component
 * Category dropdown, subject input, message textarea, submit button
 * Implements T219, T225
 */

import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Send, CheckCircle } from '@mui/icons-material';
import { useFeedbackStore } from '../../stores/feedbackStore';
import type { FeedbackCategory } from '../../types/feedback';

interface FeedbackFormProps {
  onSuccess?: (feedbackId: string) => void;
}

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const { submitFeedback, isLoading, error, clearError } = useFeedbackStore();
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const feedback = await submitFeedback({
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      // Show confirmation dialog with tracking ID (T225)
      setSubmittedFeedbackId(feedback.feedbackId);
      setConfirmationDialogOpen(true);

      // Reset form
      setCategory('suggestion');
      setSubject('');
      setMessage('');

      if (onSuccess) {
        onSuccess(feedback.feedbackId);
      }
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleCloseConfirmation = () => {
    setConfirmationDialogOpen(false);
    setSubmittedFeedbackId(null);
  };

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submit Feedback
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              required
            >
              <MenuItem value="suggestion">Suggestion</MenuItem>
              <MenuItem value="bug-report">Bug Report</MenuItem>
              <MenuItem value="support-request">Support Request</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            inputProps={{ minLength: 5, maxLength: 200 }}
            helperText={`${subject.length}/200 characters`}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            multiline
            rows={6}
            inputProps={{ minLength: 10, maxLength: 5000 }}
            helperText={`${message.length}/5000 characters`}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Send />}
              disabled={isLoading || !subject.trim() || !message.trim()}
            >
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Confirmation Dialog (T225) */}
      <Dialog open={confirmationDialogOpen} onClose={handleCloseConfirmation}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Feedback Submitted Successfully
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Thank you for your feedback! A confirmation email has been sent to your email address.
          </Typography>
          {submittedFeedbackId && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Tracking Reference:</strong> {submittedFeedbackId}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Please save this reference number for tracking purposes.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmation} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

