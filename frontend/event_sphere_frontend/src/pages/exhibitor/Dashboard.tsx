/**
 * Exhibitor Dashboard Page
 * Implements T078: User Story 2 - Exhibitor dashboard
 * Expo list, registration status, booth info, navigation
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { Add, Visibility, Business } from '@mui/icons-material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import { useAuthStore } from '../../stores/authStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import type { ExhibitorProfile } from '../../types/exhibitor';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    profiles,
    isLoading,
    error,
    getProfiles,
    clearError,
    subscribeToApprovalUpdates,
    unsubscribeFromApprovalUpdates,
    approvalNotification,
    clearApprovalNotification,
  } = useExhibitorStore();
  const { user } = useAuthStore();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  // Subscribe to approval updates (T158, T160)
  useEffect(() => {
    if (user?.userId) {
      subscribeToApprovalUpdates(user.userId);
      return () => {
        unsubscribeFromApprovalUpdates();
      };
    }
  }, [user?.userId, subscribeToApprovalUpdates, unsubscribeFromApprovalUpdates]);

  // Show toast notification when approval status changes (T160)
  useEffect(() => {
    if (approvalNotification) {
      setSnackbarOpen(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setSnackbarOpen(false);
        clearApprovalNotification();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [approvalNotification, clearApprovalNotification]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    clearApprovalNotification();
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Exhibitor Portal" onBrowseExpos={() => navigate('/exhibitor/browse')} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            My Exhibitor Profiles
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/exhibitor/browse')}
          >
            Browse & Register
          </Button>
        </Box>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {/* Approval/Rejection Toast Notification (T160) */}
        <Snackbar
          open={snackbarOpen && !!approvalNotification}
          autoHideDuration={10000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={approvalNotification?.type === 'approved' ? 'success' : 'error'}
            sx={{ width: '100%' }}
            variant="filled"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {approvalNotification?.type === 'approved' ? 'Application Approved!' : 'Application Rejected'}
            </Typography>
            <Typography variant="body2">{approvalNotification?.message}</Typography>
            {approvalNotification?.reason && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  Reason: {approvalNotification.reason}
                </Typography>
              </Box>
            )}
          </Alert>
        </Snackbar>

        {isLoading && profiles.length === 0 ? (
          <LoadingSpinner fullScreen />
        ) : profiles.length === 0 ? (
          <Alert severity="info">
            You haven't registered for any expos yet. Click "Browse & Register" to get started!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {profiles.map((profile: ExhibitorProfile) => (
              <Grid item xs={12} md={6} lg={4} key={profile.profileId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {profile.companyName}
                      </Typography>
                      <Chip
                        label={profile.registrationStatus}
                        color={getStatusColor(profile.registrationStatus)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                      {profile.expoTitle}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Category: {profile.category}
                    </Typography>

                    {profile.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {profile.description}
                      </Typography>
                    )}

                    {profile.booth && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          <Business sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Booth: {profile.booth.identifier}
                        </Typography>
                      </Box>
                    )}

                    {profile.registrationStatus === 'rejected' && profile.rejectionReason && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="caption">Rejection reason: {profile.rejectionReason}</Typography>
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/exhibitor/profile/${profile.profileId}`)}
                      variant="outlined"
                    >
                      View
                    </Button>
                    {profile.registrationStatus === 'approved' && !profile.booth && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          navigate(`/exhibitor/expo/${profile.expoId}/floor-plan`, {
                            state: { profileId: profile.profileId },
                          })
                        }
                      >
                        Select Booth
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

