/**
 * ComposeMessage Component
 * Form for composing and sending messages
 * Implements T173
 */

import { useState } from 'react';
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
  CircularProgress,
  Autocomplete,
  Box,
} from '@mui/material';
import type { SendMessageRequest } from '../../types/messaging';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface ComposeMessageProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SendMessageRequest) => Promise<void>;
  isLoading?: boolean;
  availableRecipients?: Array<{ userId: string; name: string; role: string }>;
  defaultRecipientId?: string;
  defaultContext?: SendMessageRequest['context'];
  defaultRelatedExpoId?: string;
}

export default function ComposeMessage({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  availableRecipients = [],
  defaultRecipientId,
  defaultContext,
  defaultRelatedExpoId,
}: ComposeMessageProps) {
  const [formData, setFormData] = useState<SendMessageRequest>({
    recipientId: defaultRecipientId || '',
    subject: '',
    content: '',
    context: defaultContext || 'general-inquiry',
    relatedExpoId: defaultRelatedExpoId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    setFormData({
      recipientId: defaultRecipientId || '',
      subject: '',
      content: '',
      context: defaultContext || 'general-inquiry',
      relatedExpoId: defaultRelatedExpoId,
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientId) {
      newErrors.recipientId = 'Recipient is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Message content is required';
    } else if (formData.content.trim().length < 1) {
      newErrors.content = 'Message content must be at least 1 character';
    } else if (formData.content.trim().length > 5000) {
      newErrors.content = 'Message content must be at most 5000 characters';
    }

    if (formData.subject && formData.subject.length > 200) {
      newErrors.subject = 'Subject must be at most 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        recipientId: formData.recipientId,
        content: formData.content.trim(),
        subject: formData.subject?.trim() || undefined,
      });
      handleClose();
    } catch (error: unknown) {
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
      ) {
        errorMessage = error.response.data.message;
      }
      setSubmitError(errorMessage);
    }
  };

  const selectedRecipient = availableRecipients.find((r) => r.userId === formData.recipientId);

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
        Compose Message
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: activeTheme.surface }}>
        {submitError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: `${activeTheme.error}20`,
              border: `1px solid ${activeTheme.error}30`,
              color: activeTheme.textPrimary
            }} 
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Recipient Selector */}
          {availableRecipients.length > 0 ? (
            <Autocomplete
              options={availableRecipients}
              getOptionLabel={(option) => `${option.name} (${option.role})`}
              value={selectedRecipient || null}
              onChange={(_event, newValue) => {
                setFormData({ ...formData, recipientId: newValue?.userId || '' });
                setErrors({ ...errors, recipientId: '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Recipient"
                  required
                  error={!!errors.recipientId}
                  helperText={errors.recipientId}
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
              )}
            />
          ) : (
            <TextField
              label="Recipient ID"
              required
              value={formData.recipientId}
              onChange={(e) => {
                setFormData({ ...formData, recipientId: e.target.value });
                setErrors({ ...errors, recipientId: '' });
              }}
              error={!!errors.recipientId}
              helperText={errors.recipientId || 'Enter the user ID of the recipient'}
              disabled={!!defaultRecipientId}
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
          )}

          {/* Context Dropdown */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: activeTheme.textSecondary }}>Context</InputLabel>
            <Select
              value={formData.context}
              label="Context"
              onChange={(e) => setFormData({ ...formData, context: e.target.value as SendMessageRequest['context'] })}
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
              <MenuItem value="general-inquiry">General Inquiry</MenuItem>
              <MenuItem value="exhibitor-collaboration">Exhibitor Collaboration</MenuItem>
              <MenuItem value="support-request">Support Request</MenuItem>
              <MenuItem value="organizer-communication">Organizer Communication</MenuItem>
            </Select>
          </FormControl>

          {/* Subject */}
          <TextField
            label="Subject (Optional)"
            value={formData.subject}
            onChange={(e) => {
              setFormData({ ...formData, subject: e.target.value });
              setErrors({ ...errors, subject: '' });
            }}
            error={!!errors.subject}
            helperText={errors.subject || `${formData.subject?.length || 0}/200 characters`}
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

          {/* Content */}
          <TextField
            label="Message"
            required
            multiline
            rows={8}
            value={formData.content}
            onChange={(e) => {
              setFormData({ ...formData, content: e.target.value });
              setErrors({ ...errors, content: '' });
            }}
            error={!!errors.content}
            helperText={errors.content || `${formData.content.length}/5000 characters`}
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={handleClose} disabled={isLoading}>
          Cancel
        </ActionButton>
        <ActionButton
          onClick={handleSubmit}
          primary
          disabled={isLoading || !formData.recipientId || !formData.content.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          Send
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

