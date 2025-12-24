/**
 * AddBoothForm Component
 * Form for adding booth spaces to floor plan
 * Implements T126: User Story 4
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { useState } from 'react';
import type { CreateBoothSpaceRequest } from '../../types/floorPlan';

interface AddBoothFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateBoothSpaceRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const AVAILABLE_AMENITIES = [
  'Power Outlet',
  'WiFi',
  'Display Screen',
  'Storage',
  'Accessible',
  'Corner Location',
  'Main Entrance',
];

export default function AddBoothForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}: AddBoothFormProps) {
  const [formData, setFormData] = useState<CreateBoothSpaceRequest>({
    identifier: '',
    size: {
      width: 3,
      height: 3,
    },
    location: {
      x: 0,
      y: 0,
    },
    amenities: [],
    priceTier: 'standard',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (field.startsWith('size.')) {
      const sizeField = field.split('.')[1];
      setFormData({
        ...formData,
        size: {
          ...formData.size,
          [sizeField]: parseFloat(e.target.value) || 0,
        },
      });
    } else if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: parseFloat(e.target.value) || 0,
        },
      });
    } else if (field === 'priceTier') {
      setFormData({ ...formData, priceTier: e.target.value as any });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleAmenityChange = (amenity: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const amenities = e.target.checked
      ? [...formData.amenities, amenity]
      : formData.amenities.filter((a) => a !== amenity);
    setFormData({ ...formData, amenities });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Booth identifier is required';
    } else if (formData.identifier.length > 50) {
      newErrors.identifier = 'Identifier must be 50 characters or less';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Identifier can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.size.width || formData.size.width < 0.5 || formData.size.width > 100) {
      newErrors['size.width'] = 'Width must be between 0.5 and 100 meters';
    }

    if (!formData.size.height || formData.size.height < 0.5 || formData.size.height > 100) {
      newErrors['size.height'] = 'Height must be between 0.5 and 100 meters';
    }

    if (formData.location.x < 0) {
      newErrors['location.x'] = 'X coordinate must be positive';
    }

    if (formData.location.y < 0) {
      newErrors['location.y'] = 'Y coordinate must be positive';
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
        identifier: '',
        size: { width: 3, height: 3 },
        location: { x: 0, y: 0 },
        amenities: [],
        priceTier: 'standard',
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
        identifier: '',
        size: { width: 3, height: 3 },
        location: { x: 0, y: 0 },
        amenities: [],
        priceTier: 'standard',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Booth Space</DialogTitle>
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
                label="Booth Identifier"
                placeholder="e.g., A-101, B-205"
                value={formData.identifier}
                onChange={handleChange('identifier')}
                error={!!errors.identifier}
                helperText={errors.identifier || 'Unique identifier for this booth'}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Width (meters)"
                type="number"
                inputProps={{ min: 0.5, max: 100, step: 0.1 }}
                value={formData.size.width}
                onChange={handleChange('size.width')}
                error={!!errors['size.width']}
                helperText={errors['size.width']}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Height (meters)"
                type="number"
                inputProps={{ min: 0.5, max: 100, step: 0.1 }}
                value={formData.size.height}
                onChange={handleChange('size.height')}
                error={!!errors['size.height']}
                helperText={errors['size.height']}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="X Coordinate"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.location.x}
                onChange={handleChange('location.x')}
                error={!!errors['location.x']}
                helperText={errors['location.x'] || 'Position from left edge (meters)'}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Y Coordinate"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.location.y}
                onChange={handleChange('location.y')}
                error={!!errors['location.y']}
                helperText={errors['location.y'] || 'Position from top edge (meters)'}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Price Tier</InputLabel>
                <Select
                  value={formData.priceTier}
                  label="Price Tier"
                  onChange={(e) => setFormData({ ...formData, priceTier: e.target.value as any })}
                  disabled={isLoading}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="deluxe">Deluxe</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <InputLabel sx={{ mb: 1 }}>Amenities</InputLabel>
                <FormGroup>
                  {AVAILABLE_AMENITIES.map((amenity) => (
                    <FormControlLabel
                      key={amenity}
                      control={
                        <Checkbox
                          checked={formData.amenities.includes(amenity)}
                          onChange={handleAmenityChange(amenity)}
                          disabled={isLoading}
                        />
                      }
                      label={amenity}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Add Booth'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

