/**
 * Login Page
 * Implements T053: User Story 1 - Login functionality
 * Email/password form, validation, error handling, redirect on success
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Typography,
  Box,
  Link,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { login as loginApi } from '../../services/authApi';
import { connectSocket } from '../../services/socket';
import { parseApiError } from '../../utils/errorHandler';
import type { LoginRequest } from '../../types/auth';
import {
  PageContainer,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
  BackgroundGlows,
} from '../../theme/designSystem';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: loginStore } = useAuthStore();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      const response = await loginApi(formData);

      // Store user data and token
      loginStore(
        {
          userId: response.userId,
          email: response.email,
          role: response.role,
          profile: response.profile,
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

      const dashboard = roleDashboard[response.role] || '/organizer';
      navigate(dashboard, { replace: true });
    } catch (err: unknown) {
      const errorMessage = parseApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (error) {
      setError(null);
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
        <Box sx={{ width: '100%', maxWidth: 450, px: 3 }}>
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
                Welcome Back
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

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
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
                    mb: 2,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
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
                    mb: 3,
                  }}
                />
                <ActionButton
                  type="submit"
                  primary
                  fullWidth
                  disabled={isLoading}
                  sx={{ mb: 3, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
                </ActionButton>
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate('/forgot-password')}
                    sx={{
                      cursor: 'pointer',
                      color: activeTheme.textSecondary,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: activeTheme.accent,
                      },
                    }}
                  >
                    Forgot Password?
                  </Link>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate('/register')}
                    sx={{
                      cursor: 'pointer',
                      color: activeTheme.accent,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Don't have an account? Sign Up
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

