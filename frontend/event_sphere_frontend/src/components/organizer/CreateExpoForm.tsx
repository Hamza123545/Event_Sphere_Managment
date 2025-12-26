/**
 * CreateExpoForm Component
 * Implements T056: User Story 1 - Create expo form
 * All required fields, date pickers, validation, Material-UI components
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { CreateExpoRequest } from '../../types/expo';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';
import ImageUpload from '../common/ImageUpload';
interface CreateExpoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExpoRequest) => Promise<void>;
}

export default function CreateExpoForm({ open, onClose, onSubmit }: CreateExpoFormProps) {
  const [formData, setFormData] = useState<CreateExpoRequest>({
    title: '',
    description: '',
    theme: '',
    dateRange: {
      startDate: '',
      endDate: '',
    },
    location: {
      venueName: '',
      address: '',
      city: '',
      country: '',
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        theme: '',
        dateRange: {
          startDate: '',
          endDate: '',
        },
        location: {
          venueName: '',
          address: '',
          city: '',
          country: '',
        },
      });
      setImageFile(null);
      setErrors({});
      setError(null);
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title: 5-200 characters
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be no more than 200 characters';
    }

    // Description: 20-5000 characters
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be no more than 5000 characters';
    }

    // Theme: optional, but if provided should be 3-100 characters
    if (formData.theme && formData.theme.trim()) {
      if (formData.theme.length < 3) {
        newErrors.theme = 'Theme must be at least 3 characters';
      } else if (formData.theme.length > 100) {
        newErrors.theme = 'Theme must be no more than 100 characters';
      }
    }

    // Date range validation
    if (!formData.dateRange.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.dateRange.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.dateRange.startDate && formData.dateRange.endDate) {
      const startDate = new Date(formData.dateRange.startDate);
      const endDate = new Date(formData.dateRange.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Location validation
    if (!formData.location.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.location.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const submitData: CreateExpoRequest = {
        ...formData,
        ...(imageFile && { imageFile }),
      };
      await onSubmit(submitData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create expo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'dateRange') {
        setFormData({
          ...formData,
          dateRange: {
            ...formData.dateRange,
            [child]: e.target.value,
          },
        });
      } else if (parent === 'location') {
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            [child]: e.target.value,
          },
        });
      }
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (error) {
      setError(null);
    }
  };

  const textFieldSx = {
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
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
          Create New Expo Event
        </DialogTitle>
        <DialogContent sx={{ bgcolor: activeTheme.surface }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: `${activeTheme.error}20`,
                border: `1px solid ${activeTheme.error}30`,
                color: activeTheme.textPrimary
              }}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                error={!!errors.title}
                helperText={errors.title}
                disabled={isLoading}
                inputProps={{ minLength: 5, maxLength: 200 }}
                sx={textFieldSx}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description || 'Minimum 20 characters'}
                disabled={isLoading}
                inputProps={{ minLength: 20, maxLength: 5000 }}
                sx={textFieldSx}
              />
            </Grid>

            {/* Theme */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Theme (Optional)"
                value={formData.theme}
                onChange={handleChange('theme')}
                error={!!errors.theme}
                helperText={errors.theme}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Start Date"
                type="date"
                value={formData.dateRange.startDate}
                onChange={handleChange('dateRange.startDate')}
                error={!!errors.startDate}
                helperText={errors.startDate}
                disabled={isLoading}
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
              />
            </Grid>

            {/* End Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="End Date"
                type="date"
                value={formData.dateRange.endDate}
                onChange={handleChange('dateRange.endDate')}
                error={!!errors.endDate}
                helperText={errors.endDate}
                disabled={isLoading}
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
              />
            </Grid>

            {/* Venue */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Venue (Optional)"
                value={formData.location.venueName || ''}
                onChange={handleChange('location.venueName')}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address (Optional)"
                value={formData.location.address || ''}
                onChange={handleChange('location.address')}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* City */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                value={formData.location.city}
                onChange={handleChange('location.city')}
                error={!!errors.city}
                helperText={errors.city}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Country */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Country"
                value={formData.location.country}
                onChange={handleChange('location.country')}
                error={!!errors.country}
                helperText={errors.country}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Expo Image Upload */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, color: activeTheme.textSecondary, fontWeight: 600 }}>
                Promotional Image (Optional)
              </Typography>
              <ImageUpload
                value={imageFile}
                onChange={setImageFile}
                disabled={isLoading}
                maxSizeMB={10}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: activeTheme.textSecondary }}>
                Upload a promotional image or pamphlet for this expo. This will be visible to attendees and exhibitors.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={onClose} disabled={isLoading}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" primary disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create Expo'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

