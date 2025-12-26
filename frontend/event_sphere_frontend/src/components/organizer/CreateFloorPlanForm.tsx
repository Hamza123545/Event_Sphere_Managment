/**
 * CreateFloorPlanForm Component
 * Form for creating floor plans with dimensions and image URL
 * Implements T125: User Story 4
 */

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
import { useState } from 'react';
import type { CreateFloorPlanRequest } from '../../types/floorPlan';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';
import ImageUpload from '../common/ImageUpload';

interface CreateFloorPlanFormProps {
  open: boolean;
  expoId: string;
  onClose: () => void;
  onSubmit: (request: CreateFloorPlanRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function CreateFloorPlanForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}: CreateFloorPlanFormProps) {
  const [formData, setFormData] = useState<CreateFloorPlanRequest>({
    name: '',
    dimensions: {
      width: 100,
      height: 100,
    },
    imageUrl: '',
    metadata: {
      scale: 10,
    },
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.startsWith('dimensions.')) {
      const dimensionField = field.split('.')[1];
      setFormData({
        ...formData,
        dimensions: {
          ...formData.dimensions,
          [dimensionField]: parseFloat(e.target.value) || 0,
        },
      });
    } else if (field === 'scale') {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata!,
          scale: parseFloat(e.target.value) || 10,
        },
      });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Floor plan name is required';
    } else if (formData.name.length < 3 || formData.name.length > 200) {
      newErrors.name = 'Floor plan name must be between 3 and 200 characters';
    }

    if (!formData.dimensions.width || formData.dimensions.width < 10 || formData.dimensions.width > 1000) {
      newErrors['dimensions.width'] = 'Width must be between 10 and 1000 meters';
    }

    if (!formData.dimensions.height || formData.dimensions.height < 10 || formData.dimensions.height > 1000) {
      newErrors['dimensions.height'] = 'Height must be between 10 and 1000 meters';
    }

    // Image is optional - can be file upload or URL
    if (formData.imageUrl && formData.imageUrl.trim() && !imageFile) {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = 'Image URL must be a valid URL';
      }
    }

    if (formData.metadata?.scale && (formData.metadata.scale < 1 || formData.metadata.scale > 100)) {
      newErrors.scale = 'Scale must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Create request with file if present
      const request: CreateFloorPlanRequest & { imageFile?: File } = {
        ...formData,
        ...(imageFile && { imageFile }),
      };
      await onSubmit(request as CreateFloorPlanRequest);
      // Reset form
      setFormData({
        name: '',
        dimensions: { width: 100, height: 100 },
        imageUrl: '',
        metadata: { scale: 10 },
      });
      setImageFile(null);
      setErrors({});
      onClose();
    } catch  {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        dimensions: { width: 100, height: 100 },
        imageUrl: '',
        metadata: { scale: 10 },
      });
      setImageFile(null);
      setErrors({});
      onClose();
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
      onClose={handleClose} 
      maxWidth="sm" 
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
          Create Floor Plan
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
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Floor Plan Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name || '3-200 characters'}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Width (meters)"
                type="number"
                inputProps={{ min: 10, max: 1000, step: 0.1 }}
                value={formData.dimensions.width}
                onChange={handleChange('dimensions.width')}
                error={!!errors['dimensions.width']}
                helperText={errors['dimensions.width'] || '10-1000 meters'}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Height (meters)"
                type="number"
                inputProps={{ min: 10, max: 1000, step: 0.1 }}
                value={formData.dimensions.height}
                onChange={handleChange('dimensions.height')}
                error={!!errors['dimensions.height']}
                helperText={errors['dimensions.height'] || '10-1000 meters'}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, mb: 1, fontWeight: 600 }}>
                Floor Plan Image (Optional)
              </Typography>
              <ImageUpload
                value={imageFile}
                onChange={setImageFile}
                disabled={isLoading}
                error={errors.imageUrl}
                maxSizeMB={10}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scale (pixels per meter)"
                type="number"
                inputProps={{ min: 1, max: 100, step: 0.1 }}
                value={formData.metadata?.scale || 10}
                onChange={handleChange('scale')}
                error={!!errors.scale}
                helperText={errors.scale || 'Default: 10 pixels per meter'}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={handleClose} disabled={isLoading}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" primary disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create Floor Plan'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

