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
  Button,
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
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to send message');
    }
  };

  const selectedRecipient = availableRecipients.find((r) => r.userId === formData.recipientId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Compose Message</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
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
            />
          )}

          {/* Context Dropdown */}
          <FormControl fullWidth>
            <InputLabel>Context</InputLabel>
            <Select
              value={formData.context}
              label="Context"
              onChange={(e) => setFormData({ ...formData, context: e.target.value as SendMessageRequest['context'] })}
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
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !formData.recipientId || !formData.content.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

