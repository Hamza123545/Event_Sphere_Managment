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
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { useState } from 'react';
import type { CreateFloorPlanRequest } from '../../types/floorPlan';

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
  expoId,
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

    if (formData.imageUrl && formData.imageUrl.trim()) {
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
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        dimensions: { width: 100, height: 100 },
        imageUrl: '',
        metadata: { scale: 10 },
      });
      setErrors({});
      onClose();
    } catch (err) {
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
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Floor Plan</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
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
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL (Optional)"
                placeholder="https://example.com/floor-plan.png"
                value={formData.imageUrl || ''}
                onChange={handleChange('imageUrl')}
                error={!!errors.imageUrl}
                helperText={errors.imageUrl || 'URL to floor plan image'}
                disabled={isLoading}
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create Floor Plan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

