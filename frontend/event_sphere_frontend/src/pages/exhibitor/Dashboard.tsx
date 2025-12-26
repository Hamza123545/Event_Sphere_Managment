/**
 * Exhibitor Dashboard Page
 * Implements T078: User Story 2 - Exhibitor dashboard
 * Expo list, registration status, booth info, navigation
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Snackbar,
} from '@mui/material';
import { Add, Visibility, Business } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import { useAuthStore } from '../../stores/authStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import type { ExhibitorProfile } from '../../types/exhibitor';
import {
  PageContainer,
  SectionTitle,
  ActionButton,
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
    return undefined;
  }, [user?.userId, subscribeToApprovalUpdates, unsubscribeFromApprovalUpdates]);

  // Show toast notification when approval status changes (T160)
  useEffect(() => {
    if (approvalNotification) {
      setTimeout(() => {
        setSnackbarOpen(true);
      }, 1000);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setSnackbarOpen(false);
        clearApprovalNotification();
      }, 10000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [approvalNotification, clearApprovalNotification]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    clearApprovalNotification();
  };

  return (
    <PageContainer>
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1 }}>
        <SectionTitle
          subtitle={`${profiles.length} ${profiles.length === 1 ? 'registration' : 'registrations'}`}
          action={
            <ActionButton
              primary
              startIcon={<Add />}
              onClick={() => navigate('/exhibitor/browse')}
            >
              Browse & Register
            </ActionButton>
          }
        >
          My Exhibitor Profiles
        </SectionTitle>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* Approval/Rejection Toast Notification (T160) */}
        <Snackbar
          open={snackbarOpen && !!approvalNotification}
          autoHideDuration={10000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: approvalNotification?.type === 'approved' ? activeTheme.success : activeTheme.error,
            },
          }}
        >
          <Box
            sx={{
              bgcolor: approvalNotification?.type === 'approved' ? activeTheme.success : activeTheme.error,
              color: '#fff',
              p: 2,
              borderRadius: 2,
              minWidth: 300,
            }}
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
          </Box>
        </Snackbar>

        {isLoading && profiles.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : profiles.length === 0 ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                You haven't registered for any expos yet. Browse expos to get started!
              </Typography>
              <ActionButton
                primary
                startIcon={<Add />}
                onClick={() => navigate('/exhibitor/browse')}
              >
                Browse & Register
              </ActionButton>
            </Box>
          </GlassCard>
        ) : (
          <AnimatePresence>
            <Grid container spacing={3}>
              {profiles.map((profile: ExhibitorProfile, index) => (
                <Grid item xs={12} md={6} lg={4} key={profile.profileId}>
                  <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, flex: 1, color: activeTheme.textPrimary }}>
                          {profile.companyName}
                        </Typography>
                        <Chip
                          label={profile.registrationStatus}
                          size="small"
                          sx={{
                            ml: 1,
                            bgcolor:
                              profile.registrationStatus === 'approved'
                                ? `${activeTheme.success}20`
                                : profile.registrationStatus === 'pending'
                                ? `${activeTheme.warning}20`
                                : `${activeTheme.error}20`,
                            color:
                              profile.registrationStatus === 'approved'
                                ? activeTheme.success
                                : profile.registrationStatus === 'pending'
                                ? activeTheme.warning
                                : activeTheme.error,
                            fontWeight: 700,
                            border: `1px solid ${
                              profile.registrationStatus === 'approved'
                                ? activeTheme.success
                                : profile.registrationStatus === 'pending'
                                ? activeTheme.warning
                                : activeTheme.error
                            }30`,
                          }}
                        />
                      </Box>

                      <Typography variant="subtitle1" sx={{ mb: 1, color: activeTheme.accent, fontWeight: 600 }}>
                        {profile.expoTitle}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 2, color: activeTheme.textSecondary }}>
                        Category: {profile.category}
                      </Typography>

                      {profile.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            color: activeTheme.textSecondary,
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
                        <Box sx={{ mt: 2, p: 2, bgcolor: activeTheme.surface, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: activeTheme.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ fontSize: 18, color: activeTheme.accent }} />
                            Booth: {profile.booth.identifier}
                          </Typography>
                        </Box>
                      )}

                      {profile.registrationStatus === 'rejected' && profile.rejectionReason && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: `${activeTheme.error}20`, borderRadius: 2, border: `1px solid ${activeTheme.error}30` }}>
                          <Typography variant="caption" sx={{ color: activeTheme.error }}>
                            Rejection reason: {profile.rejectionReason}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                        <ActionButton
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/exhibitor/profile/${profile.profileId}`)}
                        >
                          View
                        </ActionButton>
                        {profile.registrationStatus === 'approved' && !profile.booth && (
                          <ActionButton
                            primary
                            onClick={() =>
                              navigate(`/exhibitor/expo/${profile.expoId}/floor-plan`, {
                                state: { profileId: profile.profileId },
                              })
                            }
                          >
                            Select Booth
                          </ActionButton>
                        )}
                      </Box>
                    </GlassCard>
                  </MotionBox>
                </Grid>
              ))}
            </Grid>
          </AnimatePresence>
        )}
      </Box>
    </PageContainer>
  );
}

