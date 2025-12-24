/**
 * BoothDetailsForm Component
 * Implements T085: User Story 2 - Products showcased and staff array inputs
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
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { UpdateBoothDetailsRequest, BoothDetails } from '../../types/exhibitor';

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

  useEffect(() => {
    if (booth && open) {
      setProductsShowcased(booth.productsShowcased && booth.productsShowcased.length > 0 ? booth.productsShowcased : ['']);
      setStaff(
        booth.staff && booth.staff.length > 0
          ? booth.staff
          : [{ name: '', role: '', email: '' }]
      );
    }
  }, [booth, open]);

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
    } catch (err) {
      // Error handled by store
    }
  };

  if (!booth) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Update Booth Details - {booth.identifier}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Products Showcased */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Products Showcased
              </Typography>
              {productsShowcased.map((product, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter product name"
                    value={product}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    disabled={isLoading}
                  />
                  {productsShowcased.length > 1 && (
                    <IconButton onClick={() => removeProduct(index)} disabled={isLoading} color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addProduct} disabled={isLoading} size="small">
                Add Product
              </Button>
            </Grid>

            {/* Staff */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Staff
              </Typography>
              {staff.map((member, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Staff Member {index + 1}
                    </Typography>
                    {staff.length > 1 && (
                      <IconButton onClick={() => removeStaff(index)} disabled={isLoading} color="error" size="small">
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
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addStaff} disabled={isLoading} size="small">
                Add Staff Member
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Save Details'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

