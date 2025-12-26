/**
 * Reset Password Page
 * Allows users to reset their password using a token from email
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  TextField,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { AutoAwesome, ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { resetPassword } from '../../services/authApi';
import { parseApiError } from '../../utils/errorHandler';
import {
  PageContainer,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
  BackgroundGlows,
} from '../../theme/designSystem';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = parseApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
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
          py: 8,
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ width: '100%', maxWidth: 500 }}
        >
          <GlassCard sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <MotionBox
                whileHover={{ rotate: 180 }}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: activeTheme.accent,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AutoAwesome sx={{ color: '#fff', fontSize: '2rem' }} />
              </MotionBox>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }} color="text.primary">
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your new password below.
              </Typography>
            </Box>

            {success ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ color: activeTheme.success, mb: 2 }} color="text.primary">
                  ✓ Password Reset Successful!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your password has been reset successfully. Redirecting to login...
                </Typography>
                <ActionButton
                  primary
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </ActionButton>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <ErrorAlert
                    message={error}
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError(null)}
                  />
                )}

                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  error={!!errors.password}
                  helperText={errors.password || 'Must be at least 8 characters with uppercase, lowercase, number, and special character'}
                  disabled={isLoading || !token}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: activeTheme.border },
                      '&:hover fieldset': { borderColor: activeTheme.accent },
                      '&.Mui-focused fieldset': { borderColor: activeTheme.accentGlow },
                    },
                    '& .MuiInputLabel-root': { color: activeTheme.textSecondary },
                    '& .MuiInputBase-input': { color: activeTheme.textPrimary },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: activeTheme.textSecondary }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={isLoading || !token}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: activeTheme.border },
                      '&:hover fieldset': { borderColor: activeTheme.accent },
                      '&.Mui-focused fieldset': { borderColor: activeTheme.accentGlow },
                    },
                    '& .MuiInputLabel-root': { color: activeTheme.textSecondary },
                    '& .MuiInputBase-input': { color: activeTheme.textPrimary },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: activeTheme.textSecondary }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <ActionButton
                  type="submit"
                  primary
                  fullWidth
                  disabled={isLoading || !token}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Reset Password'
                  )}
                </ActionButton>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Link
                    to="/login"
                    style={{
                      color: activeTheme.accent,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <ArrowBack sx={{ fontSize: 18 }} />
                    <Typography variant="body2">Back to Login</Typography>
                  </Link>
                </Box>
              </form>
            )}
          </GlassCard>
        </MotionBox>
      </Box>
    </PageContainer>
  );
}

