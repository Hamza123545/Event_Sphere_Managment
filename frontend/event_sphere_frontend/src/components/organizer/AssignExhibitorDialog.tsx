/**
 * AssignExhibitorDialog Component
 * Dialog for assigning approved exhibitors to booths
 * Implements T128: User Story 4
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import { useState } from 'react';

interface Exhibitor {
  profileId: string;
  companyName: string;
  category: string;
  logo?: string;
}

interface AssignExhibitorDialogProps {
  open: boolean;
  booth: {
    boothId: string;
    identifier: string;
    size: { width: number; height: number; area: number };
    amenities: string[];
    priceTier?: string;
  } | null;
  exhibitors: Exhibitor[];
  onAssign: (profileId: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function AssignExhibitorDialog({
  open,
  booth,
  exhibitors,
  onAssign,
  onClose,
  isLoading = false,
  error = null,
}: AssignExhibitorDialogProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  const handleAssign = async () => {
    if (!selectedProfileId) return;
    try {
      await onAssign(selectedProfileId);
      setSelectedProfileId('');
      onClose();
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedProfileId('');
      onClose();
    }
  };

  if (!booth) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Exhibitor to Booth {booth.identifier}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Booth Details */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Booth Details</strong>
          </Typography>
          <Typography variant="body2">
            <strong>Size:</strong> {booth.size.width}m × {booth.size.height}m ({booth.size.area}m²)
          </Typography>
          {booth.priceTier && (
            <Typography variant="body2">
              <strong>Price Tier:</strong> <Chip label={booth.priceTier} size="small" sx={{ ml: 1 }} />
            </Typography>
          )}
          {booth.amenities.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" component="span">
                <strong>Amenities:</strong>{' '}
              </Typography>
              {booth.amenities.map((amenity, index) => (
                <Chip key={index} label={amenity} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          )}
        </Box>

        {/* Exhibitor Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Exhibitor</InputLabel>
          <Select
            value={selectedProfileId}
            label="Select Exhibitor"
            onChange={(e) => setSelectedProfileId(e.target.value)}
            disabled={isLoading || exhibitors.length === 0}
          >
            {exhibitors.length === 0 ? (
              <MenuItem disabled>No approved exhibitors available</MenuItem>
            ) : (
              exhibitors.map((exhibitor) => (
                <MenuItem key={exhibitor.profileId} value={exhibitor.profileId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {exhibitor.logo && (
                      <Box
                        component="img"
                        src={exhibitor.logo}
                        alt={exhibitor.companyName}
                        sx={{ width: 24, height: 24, borderRadius: 1 }}
                      />
                    )}
                    {!exhibitor.logo && <Business fontSize="small" />}
                    <Box>
                      <Typography variant="body1">{exhibitor.companyName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exhibitor.category}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <DialogContentText>
          This will assign the selected exhibitor to booth {booth.identifier}. The booth status will change to
          "Occupied" and the exhibitor will be able to manage their booth details.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={isLoading || !selectedProfileId || exhibitors.length === 0}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Assign Exhibitor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

