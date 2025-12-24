/**
 * EditProfileForm Component
 * Implements T082: User Story 2 - Editable profile fields, file upload, validation with locked approved profiles warning
 */

import { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { UpdateProfileRequest, ExhibitorProfile } from '../../types/exhibitor';

interface EditProfileFormProps {
  open: boolean;
  profile: ExhibitorProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileForm({
  open,
  profile,
  onClose,
  onSuccess,
}: EditProfileFormProps) {
  const { updateProfile, isLoading, error } = useExhibitorStore();
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    companyName: '',
    description: '',
    productsServices: [],
    category: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile && open) {
      setFormData({
        companyName: profile.companyName,
        description: profile.description,
        productsServices: profile.productsServices,
        category: profile.category,
        contactEmail: profile.contactInfo.email,
        contactPhone: profile.contactInfo.phone || '',
        website: profile.contactInfo.website || '',
      });
      setLogoFile(null);
      setDocumentFiles([]);
      setErrors({});
    }
  }, [profile, open]);

  if (!profile) return null;

  const handleChange = (field: keyof UpdateProfileRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (field === 'productsServices') return;
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleProductsServicesChange = (index: number, value: string) => {
    const updated = [...(formData.productsServices || [])];
    updated[index] = value;
    setFormData({ ...formData, productsServices: updated });
  };

  const addProductService = () => {
    setFormData({
      ...formData,
      productsServices: [...(formData.productsServices || []), ''],
    });
  };

  const removeProductService = (index: number) => {
    const updated = (formData.productsServices || []).filter((_, i) => i !== index);
    setFormData({ ...formData, productsServices: updated.length > 0 ? updated : undefined });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, logo: 'Logo must be less than 5MB' });
        return;
      }
      setLogoFile(file);
      setErrors({ ...errors, logo: '' });
    }
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size <= 10 * 1024 * 1024) {
          validFiles.push(file);
        }
      }
      setDocumentFiles([...documentFiles, ...validFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.companyName && (formData.companyName.length < 2 || formData.companyName.length > 200)) {
      newErrors.companyName = 'Company name must be 2-200 characters';
    }
    if (formData.description && (formData.description.length < 20 || formData.description.length > 2000)) {
      newErrors.description = 'Description must be 20-2000 characters';
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !validateForm()) return;

    try {
      const validProducts = formData.productsServices?.filter((p) => p.trim()) || [];
      await updateProfile(profile.profileId, {
        ...formData,
        productsServices: validProducts.length > 0 ? validProducts : undefined,
        logo: logoFile || undefined,
        documents: documentFiles.length > 0 ? documentFiles : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {profile.registrationStatus === 'approved' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This profile is approved. Some changes may require organizer approval.
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName || ''}
                onChange={handleChange('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description || ''}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Products/Services
              </Typography>
              {(formData.productsServices || []).map((product, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={product}
                    onChange={(e) => handleProductsServicesChange(index, e.target.value)}
                    disabled={isLoading}
                  />
                  <IconButton onClick={() => removeProductService(index)} disabled={isLoading} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addProductService} disabled={isLoading} size="small">
                Add Product/Service
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category || ''}
                onChange={handleChange('category')}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactEmail || ''}
                onChange={handleChange('contactEmail')}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone || ''}
                onChange={handleChange('contactPhone')}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website || ''}
                onChange={handleChange('website')}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <input
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                id="logo-upload-edit"
                type="file"
                onChange={handleLogoChange}
                disabled={isLoading}
              />
              <label htmlFor="logo-upload-edit">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} disabled={isLoading}>
                  {logoFile ? `New Logo: ${logoFile.name}` : 'Update Logo (Optional, Max 5MB)'}
                </Button>
              </label>
            </Grid>

            <Grid item xs={12}>
              <input
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                id="documents-upload-edit"
                type="file"
                multiple
                onChange={handleDocumentsChange}
                disabled={isLoading}
              />
              <label htmlFor="documents-upload-edit">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} disabled={isLoading}>
                  Add Documents (Optional)
                </Button>
              </label>
              {documentFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {documentFiles.map((file, index) => (
                    <Chip key={index} label={file.name} onDelete={() => removeDocument(index)} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

