/**
 * Register Page
 * Implements T054: User Story 1 - User registration
 * Role selection, profile fields, GDPR consent checkboxes, validation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { register as registerApi } from '../../services/authApi';
import { connectSocket } from '../../services/socket';
import { parseApiError, getValidationErrors } from '../../utils/errorHandler';
import type { RegisterRequest } from '../../types/auth';

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
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: any } }
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
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            EventSphere
          </Typography>
          <Typography component="h2" variant="h5" gutterBottom>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Grid container spacing={2}>
              {/* Role Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="role-label">Account Type</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    value={formData.role}
                    label="Account Type"
                    onChange={(e) =>
                      handleChange('role')({
                        target: { value: e.target.value },
                      } as any)
                    }
                    disabled={isLoading}
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
                />
              </Grid>

              {/* GDPR Consent */}
              <Grid item xs={12}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Privacy & Consent
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.gdprConsent.dataProcessingConsent}
                        onChange={handleCheckboxChange('dataProcessingConsent')}
                        disabled={isLoading}
                        required
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I consent to the processing of my personal data (Required)
                      </Typography>
                    }
                  />
                  {errors.dataProcessingConsent && (
                    <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>
                      {errors.dataProcessingConsent}
                    </Typography>
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.gdprConsent.marketingConsent || false}
                        onChange={handleCheckboxChange('marketingConsent')}
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I consent to receiving marketing communications (Optional)
                      </Typography>
                    }
                  />
                </Box>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ cursor: 'pointer' }}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

