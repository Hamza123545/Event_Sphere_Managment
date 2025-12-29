/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome, ArrowBack } from '@mui/icons-material';
import { forgotPassword } from '../../services/authApi';
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const isSubmittingRef = useRef(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setError(null);
    setSuccess(false);

    if (!validateEmail()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    
    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err: unknown) {
      // Check if error is due to request cancellation
      if (err && typeof err === 'object' && 'message' in err) {
        const axiosError = err as { code?: string; message?: string };
        if (axiosError.code === 'ERR_CANCELED' || axiosError.message?.includes('canceled')) {
          // Request was canceled, don't show error
          return;
        }
      }
      const errorMessage = parseApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
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
                Forgot Password?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
            </Box>

            {success ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ color: activeTheme.success, mb: 2 }} color="text.primary">
                  ✓ Email Sent!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                </Typography>
                <ActionButton
                  primary
                  onClick={() => navigate('/login')}
                  startIcon={<ArrowBack />}
                >
                  Back to Login
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
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (error) setError(null);
                  }}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={isLoading}
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
                />

                <ActionButton
                  type="submit"
                  primary
                  fullWidth
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Reset Link'
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

