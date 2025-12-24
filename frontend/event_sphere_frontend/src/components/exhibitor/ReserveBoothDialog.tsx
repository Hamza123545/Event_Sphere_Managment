/**
 * ReserveBoothDialog Component
 * Implements T087: User Story 2 - Booth reservation confirmation dialog with 409 error handling
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import type { BoothDetails } from '../../types/exhibitor';

interface ReserveBoothDialogProps {
  open: boolean;
  booth: BoothDetails | null;
  profileId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ReserveBoothDialog({
  open,
  booth,
  profileId,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: ReserveBoothDialogProps) {
  if (!booth) return null;

  const isConcurrentError = error?.includes('409') || error?.toLowerCase().includes('concurrent');

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Reserve Booth {booth.identifier}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity={isConcurrentError ? 'warning' : 'error'} sx={{ mb: 2 }}>
            {isConcurrentError
              ? 'This booth was just reserved by another exhibitor. Please select a different booth.'
              : error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Business color="primary" />
          <Typography variant="h6">Booth Details</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Identifier:</strong> {booth.identifier}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Size:</strong> {booth.size.width}m × {booth.size.height}m ({booth.size.area}m²)
          </Typography>
          {booth.priceTier && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Price Tier:</strong> <Chip label={booth.priceTier} size="small" />
            </Typography>
          )}
          {booth.amenities.length > 0 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Amenities:</strong> {booth.amenities.join(', ')}
            </Typography>
          )}
        </Box>

        <DialogContentText>
          Are you sure you want to reserve this booth? Once reserved, you'll be able to manage your booth details
          and showcase your products.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Reserve Booth'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

