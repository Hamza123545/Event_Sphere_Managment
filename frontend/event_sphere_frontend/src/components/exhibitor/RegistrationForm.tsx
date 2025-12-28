/**
 * ExhibitorRegistrationForm Component
 * Implements T080: User Story 2 - Company details, products/services, file upload, validation
 */

import { useState } from 'react';
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
  Chip,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { RegisterForExpoRequest } from '../../types/exhibitor';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface RegistrationFormProps {
  open: boolean;
  expoId: string;
  expoTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationForm({
  open,
  expoId,
  expoTitle,
  onClose,
  onSuccess,
}: RegistrationFormProps) {
  const { registerForExpo, isLoading, error } = useExhibitorStore();
  const [formData, setFormData] = useState<RegisterForExpoRequest>({
    companyName: '',
    description: '',
    productsServices: [''],
    category: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress] = useState(0);

  const handleChange = (field: keyof RegisterForExpoRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (field === 'productsServices') {
      // Handled separately
      return;
    }
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleProductsServicesChange = (index: number, value: string) => {
    const updated = [...formData.productsServices];
    updated[index] = value;
    setFormData({ ...formData, productsServices: updated });
    
    // Clear error if at least one valid product/service exists
    if (errors.productsServices) {
      const validProducts = updated.filter((p) => p.trim());
      if (validProducts.length > 0) {
        setErrors({ ...errors, productsServices: '' });
      }
    }
  };

  const addProductService = () => {
    const updated = [...formData.productsServices, ''];
    setFormData({
      ...formData,
      productsServices: updated,
    });
    
    // Clear error if at least one valid product/service already exists
    if (errors.productsServices) {
      const validProducts = updated.filter((p) => p.trim());
      if (validProducts.length > 0) {
        setErrors({ ...errors, productsServices: '' });
      }
    }
  };

  const removeProductService = (index: number) => {
    if (formData.productsServices.length > 1) {
      const updated = formData.productsServices.filter((_, i) => i !== index);
      setFormData({ ...formData, productsServices: updated });
      
      // Re-validate after removal
      const validProducts = updated.filter((p) => p.trim());
      if (validProducts.length === 0 && errors.productsServices === '') {
        // Only set error if it wasn't already set
        setErrors({ ...errors, productsServices: 'At least one product/service is required' });
      } else if (validProducts.length > 0) {
        // Clear error if valid products exist
        setErrors({ ...errors, productsServices: '' });
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, logo: 'Logo must be less than 5MB' });
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setErrors({ ...errors, logo: 'Logo must be JPG or PNG' });
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
        if (file.size > 10 * 1024 * 1024) {
          setErrors({ ...errors, documents: `${file.name} exceeds 10MB limit` });
          continue;
        }
        if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          setErrors({ ...errors, documents: `${file.name} must be PDF, JPG, or PNG` });
          continue;
        }
        validFiles.push(file);
      }
      
      setDocumentFiles([...documentFiles, ...validFiles]);
      setErrors({ ...errors, documents: '' });
    }
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 2 || formData.companyName.length > 200) {
      newErrors.companyName = 'Company name must be 2-200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20 || formData.description.length > 2000) {
      newErrors.description = 'Description must be 20-2000 characters';
    }

    const validProducts = formData.productsServices.filter((p) => p.trim());
    if (validProducts.length === 0) {
      newErrors.productsServices = 'At least one product/service is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const validProducts = formData.productsServices.filter((p) => p.trim());
      await registerForExpo(expoId, {
        ...formData,
        productsServices: validProducts,
        logo: logoFile || undefined,
        documents: documentFiles.length > 0 ? documentFiles : undefined,
      });
      
      // Reset form
      setFormData({
        companyName: '',
        description: '',
        productsServices: [''],
        category: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
      });
      setLogoFile(null);
      setDocumentFiles([]);
      setErrors({});
      
      onSuccess();
      onClose();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        companyName: '',
        description: '',
        productsServices: [''],
        category: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
      });
      setLogoFile(null);
      setDocumentFiles([]);
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
          Register for {expoTitle}
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

          {isLoading && uploadProgress > 0 && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: activeTheme.surfaceLight,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: activeTheme.accent,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, mt: 1, display: 'block' }}>
                Uploading files... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Company Name */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Company Description"
                value={formData.description}
                onChange={handleChange('description')}
                error={!!errors.description}
                helperText={errors.description || 'Minimum 20 characters'}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Products/Services */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: activeTheme.textPrimary }}>
                Products/Services *
              </Typography>
              {formData.productsServices.map((product, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter product or service"
                    value={product}
                    onChange={(e) => handleProductsServicesChange(index, e.target.value)}
                    disabled={isLoading}
                    sx={textFieldSx}
                  />
                  {formData.productsServices.length > 1 && (
                    <IconButton
                      onClick={() => removeProductService(index)}
                      disabled={isLoading}
                      sx={{ color: activeTheme.error }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <ActionButton
                startIcon={<Add />}
                onClick={addProductService}
                disabled={isLoading}
                size="small"
              >
                Add Product/Service
              </ActionButton>
              {errors.productsServices && (
                <Typography variant="caption" sx={{ color: activeTheme.error, display: 'block', mt: 1, fontWeight: 600 }}>
                  {errors.productsServices}
                </Typography>
              )}
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Category"
                value={formData.category}
                onChange={handleChange('category')}
                error={!!errors.category}
                helperText={errors.category}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Contact Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange('contactEmail')}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Contact Phone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone (Optional)"
                value={formData.contactPhone}
                onChange={handleChange('contactPhone')}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Website */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website (Optional)"
                value={formData.website}
                onChange={handleChange('website')}
                disabled={isLoading}
                sx={textFieldSx}
              />
            </Grid>

            {/* Logo Upload */}
            <Grid item xs={12}>
              <Box>
                <input
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                />
                <label htmlFor="logo-upload">
                  <ActionButton
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={isLoading}
                  >
                    {logoFile ? `Logo: ${logoFile.name}` : 'Upload Company Logo (Optional, Max 5MB)'}
                  </ActionButton>
                </label>
                {errors.logo && (
                  <Typography variant="caption" sx={{ color: activeTheme.error, display: 'block', mt: 1, fontWeight: 600 }}>
                    {errors.logo}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Documents Upload */}
            <Grid item xs={12}>
              <Box>
                <input
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  id="documents-upload"
                  type="file"
                  multiple
                  onChange={handleDocumentsChange}
                  disabled={isLoading}
                />
                <label htmlFor="documents-upload">
                  <ActionButton
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={isLoading}
                  >
                    Upload Documents (Optional, Max 10MB each, PDF/JPG/PNG)
                  </ActionButton>
                </label>
                {documentFiles.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {documentFiles.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => removeDocument(index)}
                        sx={{
                          mr: 1,
                          mb: 1,
                          bgcolor: `${activeTheme.accent}20`,
                          color: activeTheme.accent,
                          border: `1px solid ${activeTheme.accent}30`,
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Box>
                )}
                {errors.documents && (
                  <Typography variant="caption" sx={{ color: activeTheme.error, display: 'block', mt: 1, fontWeight: 600 }}>
                    {errors.documents}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={handleClose} disabled={isLoading}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" primary disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Submit Registration'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

