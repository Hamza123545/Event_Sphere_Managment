/**
 * FeedbackForm Component
 * Category dropdown, subject input, message textarea, submit button
 * Implements T219, T225
 */

import { useState } from 'react';
import {
  Typography,
  TextField,
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
import {
  GlassCard,
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

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
      <GlassCard>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
          Submit Feedback
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              bgcolor: `${activeTheme.error}20`,
              border: `1px solid ${activeTheme.error}30`,
              color: activeTheme.textPrimary
            }} 
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: activeTheme.textSecondary }}>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              required
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
            sx={{ 
              mb: 3,
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
            sx={{ 
              mb: 3,
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <ActionButton
              type="submit"
              primary
              startIcon={<Send />}
              disabled={isLoading || !subject.trim() || !message.trim()}
            >
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </ActionButton>
          </Box>
        </form>
      </GlassCard>

      {/* Confirmation Dialog (T225) */}
      <Dialog 
        open={confirmationDialogOpen} 
        onClose={handleCloseConfirmation}
        PaperProps={{
          sx: {
            bgcolor: activeTheme.surface,
            border: `1px solid ${activeTheme.border}`,
          }
        }}
      >
        <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: activeTheme.success }} />
            Feedback Submitted Successfully
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: activeTheme.surface }}>
          <Typography variant="body1" sx={{ mb: 2, color: activeTheme.textSecondary }}>
            Thank you for your feedback! A confirmation email has been sent to your email address.
          </Typography>
          {submittedFeedbackId && (
            <Alert 
              severity="info"
              sx={{
                bgcolor: `${activeTheme.info}20`,
                border: `1px solid ${activeTheme.info}30`,
                color: activeTheme.textPrimary
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                <strong>Tracking Reference:</strong> {submittedFeedbackId}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: activeTheme.textSecondary }}>
                Please save this reference number for tracking purposes.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={handleCloseConfirmation} primary>
            Close
          </ActionButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

