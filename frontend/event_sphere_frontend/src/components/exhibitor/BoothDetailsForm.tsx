/**
 * BoothDetailsForm Component
 * Implements T085: User Story 2 - Products showcased and staff array inputs
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
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { UpdateBoothDetailsRequest, BoothDetails } from '../../types/exhibitor';
import {
  ActionButton,
  activeTheme,
  GlassCard,
} from '../../theme/designSystem';

interface BoothDetailsFormProps {
  open: boolean;
  booth: BoothDetails | null;
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BoothDetailsForm({
  open,
  booth,
  profileId,
  onClose,
  onSuccess,
}: BoothDetailsFormProps) {
  const { updateBoothDetails, isLoading, error } = useExhibitorStore();
  const [productsShowcased, setProductsShowcased] = useState<string[]>(['']);
  const [staff, setStaff] = useState<Array<{ name: string; role: string; email: string }>>([
    { name: '', role: '', email: '' },
  ]);

  // Initialize form data when booth or open state changes
  useEffect(() => {
    if (!booth || !open) {
      return;
    }
    
    const products = booth.productsShowcased && booth.productsShowcased.length > 0 
      ? booth.productsShowcased 
      : [''];
    const staffMembers = booth.staff && booth.staff.length > 0
      ? booth.staff
      : [{ name: '', role: '', email: '' }];
    
    // Initialize form state from props - using setTimeout to defer state updates
    const timer = setTimeout(() => {
      setProductsShowcased(products);
      setStaff(staffMembers);
    }, 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booth?.identifier]);

  const handleProductChange = (index: number, value: string) => {
    const updated = [...productsShowcased];
    updated[index] = value;
    setProductsShowcased(updated);
  };

  const addProduct = () => {
    setProductsShowcased([...productsShowcased, '']);
  };

  const removeProduct = (index: number) => {
    if (productsShowcased.length > 1) {
      setProductsShowcased(productsShowcased.filter((_, i) => i !== index));
    }
  };

  const handleStaffChange = (index: number, field: 'name' | 'role' | 'email', value: string) => {
    const updated = [...staff];
    updated[index] = { ...updated[index], [field]: value };
    setStaff(updated);
  };

  const addStaff = () => {
    setStaff([...staff, { name: '', role: '', email: '' }]);
  };

  const removeStaff = (index: number) => {
    if (staff.length > 1) {
      setStaff(staff.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validProducts = productsShowcased.filter((p) => p.trim());
    const validStaff = staff.filter((s) => s.name.trim() && s.role.trim() && s.email.trim());

    const data: UpdateBoothDetailsRequest = {
      productsShowcased: validProducts.length > 0 ? validProducts : undefined,
      staff: validStaff.length > 0 ? validStaff : undefined,
    };

    try {
      await updateBoothDetails(profileId, data);
      onSuccess();
      onClose();
    } catch{
      // Error handled by store
    }
  };

  if (!booth) return null;

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
          Update Booth Details - {booth.identifier}
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
            {/* Products Showcased */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: activeTheme.textPrimary }}>
                Products Showcased
              </Typography>
              {productsShowcased.map((product, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter product name"
                    value={product}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    disabled={isLoading}
                    sx={textFieldSx}
                  />
                  {productsShowcased.length > 1 && (
                    <IconButton 
                      onClick={() => removeProduct(index)} 
                      disabled={isLoading}
                      sx={{ color: activeTheme.error }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <ActionButton startIcon={<Add />} onClick={addProduct} disabled={isLoading} size="small">
                Add Product
              </ActionButton>
            </Grid>

            {/* Staff */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: activeTheme.textPrimary }}>
                Staff
              </Typography>
              {staff.map((member, index) => (
                <GlassCard key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700 }}>
                      Staff Member {index + 1}
                    </Typography>
                    {staff.length > 1 && (
                      <IconButton 
                        onClick={() => removeStaff(index)} 
                        disabled={isLoading}
                        sx={{ color: activeTheme.error }}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Name *"
                        value={member.name}
                        onChange={(e) => handleStaffChange(index, 'name', e.target.value)}
                        disabled={isLoading}
                        required
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Role *"
                        value={member.role}
                        onChange={(e) => handleStaffChange(index, 'role', e.target.value)}
                        disabled={isLoading}
                        required
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Email *"
                        type="email"
                        value={member.email}
                        onChange={(e) => handleStaffChange(index, 'email', e.target.value)}
                        disabled={isLoading}
                        required
                        sx={textFieldSx}
                      />
                    </Grid>
                  </Grid>
                </GlassCard>
              ))}
              <ActionButton startIcon={<Add />} onClick={addStaff} disabled={isLoading} size="small">
                Add Staff Member
              </ActionButton>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={onClose} disabled={isLoading}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" primary disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Save Details'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

