/**
 * Register Page
 * Implements T054: User Story 1 - User registration
 * Role selection, profile fields, GDPR consent checkboxes, validation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Typography,
  Box,
  Link,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { register as registerApi } from '../../services/authApi';
import { connectSocket } from '../../services/socket';
import { parseApiError, getValidationErrors } from '../../utils/errorHandler';
import type { RegisterRequest } from '../../types/auth';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: loginStore } = useAuthStore();

  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    role: 'attendee',
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
    },
    gdprConsent: {
      dataProcessingConsent: false,
      marketingConsent: false,
    },
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Profile validation
    if (!formData.profile.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.profile.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // GDPR consent
    if (!formData.gdprConsent.dataProcessingConsent) {
      newErrors.dataProcessingConsent = 'Data processing consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerApi(formData);

      // Store user data and token
      loginStore(
        {
          userId: response.user.userId,
          email: response.user.email,
          role: response.user.role,
          profile: response.user.profile,
        },
        response.token
      );

      // Connect Socket.io for real-time updates
      connectSocket(response.token);

      // Redirect based on user role
      const roleDashboard: Record<string, string> = {
        admin: '/organizer',
        organizer: '/organizer',
        exhibitor: '/exhibitor',
        attendee: '/attendee',
      };

      const dashboard = roleDashboard[response.user.role] || '/organizer';
      navigate(dashboard, { replace: true });
    } catch (err: unknown) {
      const validationErrors = getValidationErrors(err);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        const errorMessage = parseApiError(err);
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'profile') {
        setFormData({
          ...formData,
          profile: {
            ...formData.profile,
            [child]: e.target.value,
          },
        });
      } else if (parent === 'gdprConsent') {
        setFormData({
          ...formData,
          gdprConsent: {
            ...formData.gdprConsent,
            [child]: e.target.value,
          },
        });
      }
    } else if (field === 'confirmPassword') {
      setConfirmPassword(e.target.value);
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (error) {
      setError(null);
    }
  };

  const handleCheckboxChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      gdprConsent: {
        ...formData.gdprConsent,
        [field]: e.target.checked,
      },
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <PageContainer>
      <BackgroundGlows />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 600, px: 3 }}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard sx={{ p: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: activeTheme.accent,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <AutoAwesome sx={{ color: '#fff', fontSize: '1.5rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>
                  EventSphere
                </Typography>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
                Create Account
              </Typography>

              {error && (
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: `${activeTheme.error}20`,
                    border: `1px solid ${activeTheme.error}30`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: activeTheme.error }}>
                    {error}
                  </Typography>
                </Box>
              )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Grid container spacing={2}>
              {/* Role Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="role-label" sx={{ color: activeTheme.textSecondary }}>Account Type</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    value={formData.role}
                    label="Account Type"
                    onChange={(e) =>
                      handleChange('role')({
                        target: { value: e.target.value },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    disabled={isLoading}
                    sx={{
                      bgcolor: activeTheme.surface,
                      color: activeTheme.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: activeTheme.border,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: activeTheme.accent,
                      },
                    }}
                  >
                    <MenuItem value="organizer">Organizer</MenuItem>
                    <MenuItem value="exhibitor">Exhibitor</MenuItem>
                    <MenuItem value="attendee">Attendee</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.profile.firstName}
                  onChange={handleChange('profile.firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.profile.lastName}
                  onChange={handleChange('profile.lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* Phone (Optional) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number (Optional)"
                  name="phone"
                  autoComplete="tel"
                  value={formData.profile.phone || ''}
                  onChange={handleChange('profile.phone')}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: activeTheme.surface,
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
                  }}
                />
              </Grid>

              {/* GDPR Consent */}
              <Grid item xs={12}>
                <Box sx={{ border: `1px solid ${activeTheme.border}`, borderRadius: 2, p: 3, bgcolor: activeTheme.surface }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: activeTheme.textPrimary }}>
                    Privacy & Consent
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.gdprConsent.dataProcessingConsent}
                        onChange={handleCheckboxChange('dataProcessingConsent')}
                        disabled={isLoading}
                        required
                        sx={{
                          color: activeTheme.accent,
                          '&.Mui-checked': {
                            color: activeTheme.accent,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: activeTheme.textPrimary }}>
                        I consent to the processing of my personal data (Required)
                      </Typography>
                    }
                  />
                  {errors.dataProcessingConsent && (
                    <Typography variant="caption" sx={{ color: activeTheme.error, ml: 4, display: 'block', mt: 0.5 }}>
                      {errors.dataProcessingConsent}
                    </Typography>
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.gdprConsent.marketingConsent || false}
                        onChange={handleCheckboxChange('marketingConsent')}
                        disabled={isLoading}
                        sx={{
                          color: activeTheme.accent,
                          '&.Mui-checked': {
                            color: activeTheme.accent,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: activeTheme.textPrimary }}>
                        I consent to receiving marketing communications (Optional)
                      </Typography>
                    }
                  />
                </Box>
              </Grid>
            </Grid>

            <ActionButton
              type="submit"
              primary
              fullWidth
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
            </ActionButton>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{
                  cursor: 'pointer',
                  color: activeTheme.accent,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
            </GlassCard>
          </MotionBox>
        </Box>
      </Box>
    </PageContainer>
  );
}

