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
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

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
      <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
        Assign Exhibitor to Booth {booth.identifier}
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

        {/* Booth Details */}
        <Box sx={{ mb: 4, p: 3, bgcolor: activeTheme.surfaceLight, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
            Booth Details
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
                  ml: 1,
                  bgcolor: `${activeTheme.accent}20`,
                  color: activeTheme.accent,
                  border: `1px solid ${activeTheme.accent}30`,
                  fontWeight: 600
                }}
              />
            </Typography>
          )}
          {booth.amenities.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
                Amenities:{' '}
              </Typography>
              {booth.amenities.map((amenity, index) => (
                <Chip 
                  key={index} 
                  label={amenity} 
                  size="small"
                  sx={{ 
                    mr: 0.5, 
                    mb: 0.5,
                    bgcolor: `${activeTheme.accent}20`,
                    color: activeTheme.accent,
                    border: `1px solid ${activeTheme.accent}30`,
                    fontWeight: 600
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Exhibitor Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ color: activeTheme.textSecondary }}>Select Exhibitor</InputLabel>
          <Select
            value={selectedProfileId}
            label="Select Exhibitor"
            onChange={(e) => setSelectedProfileId(e.target.value)}
            disabled={isLoading || exhibitors.length === 0}
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
            {exhibitors.length === 0 ? (
              <MenuItem disabled>No approved exhibitors available</MenuItem>
            ) : (
              exhibitors.map((exhibitor) => (
                <MenuItem key={exhibitor.profileId} value={exhibitor.profileId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {exhibitor.logo && (
                      <Box
                        component="img"
                        src={exhibitor.logo}
                        alt={exhibitor.companyName}
                        sx={{ width: 32, height: 32, borderRadius: 1, border: `1px solid ${activeTheme.border}` }}
                      />
                    )}
                    {!exhibitor.logo && <Business sx={{ fontSize: 20, color: activeTheme.accent }} />}
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
                        {exhibitor.companyName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                        {exhibitor.category}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <DialogContentText sx={{ color: activeTheme.textSecondary, lineHeight: 1.7 }}>
          This will assign the selected exhibitor to booth {booth.identifier}. The booth status will change to
          "Occupied" and the exhibitor will be able to manage their booth details.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={handleClose} disabled={isLoading}>
          Cancel
        </ActionButton>
        <ActionButton
          onClick={handleAssign}
          primary
          disabled={isLoading || !selectedProfileId || exhibitors.length === 0}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Assign Exhibitor'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

