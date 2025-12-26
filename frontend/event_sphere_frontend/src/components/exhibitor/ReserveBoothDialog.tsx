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
  Alert,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import type { BoothDetails } from '../../types/exhibitor';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

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
    <Dialog 
      open={open} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
        Reserve Booth {booth.identifier}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: activeTheme.surface }}>
        {error && (
          <Alert 
            severity={isConcurrentError ? 'warning' : 'error'} 
            sx={{ 
              mb: 3,
              bgcolor: isConcurrentError ? `${activeTheme.warning}20` : `${activeTheme.error}20`,
              border: `1px solid ${isConcurrentError ? activeTheme.warning : activeTheme.error}30`,
              color: activeTheme.textPrimary
            }}
          >
            {isConcurrentError
              ? 'This booth was just reserved by another exhibitor. Please select a different booth.'
              : error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Business sx={{ color: activeTheme.accent, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
            Booth Details
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
            <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Identifier:</span> {booth.identifier}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
            <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Size:</span> {booth.size.width}m × {booth.size.height}m ({booth.size.area}m²)
          </Typography>
          {booth.priceTier && (
            <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
              <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Price Tier:</span>{' '}
              <Chip 
                label={booth.priceTier} 
                size="small"
                sx={{
                  bgcolor: `${activeTheme.accent}20`,
                  color: activeTheme.accent,
                  border: `1px solid ${activeTheme.accent}30`,
                  fontWeight: 600
                }}
              />
            </Typography>
          )}
          {booth.amenities.length > 0 && (
            <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
              <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Amenities:</span> {booth.amenities.join(', ')}
            </Typography>
          )}
        </Box>

        <DialogContentText sx={{ color: activeTheme.textSecondary, lineHeight: 1.7 }}>
          Are you sure you want to reserve this booth? Once reserved, you'll be able to manage your booth details
          and showcase your products.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={onCancel} disabled={isLoading}>
          Cancel
        </ActionButton>
        <ActionButton onClick={onConfirm} primary disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Reserve Booth'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

