/**
 * Profile Page
 * Common user profile page for all roles
 * Displays user profile information and notification preferences
 * Implements T207
 */

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import NotificationPreferences from '../../components/attendee/NotificationPreferences';
import { useAuthStore } from '../../stores/authStore';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) {
    return (
      <PageContainer>
        <ModernNavbar />
        <Box sx={{ mt: 8, px: { xs: 3, md: 8 } }}>
          <Alert severity="error" sx={{ bgcolor: `${activeTheme.error}20`, border: `1px solid ${activeTheme.error}30` }}>
            User not found
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  const userInitials = user.profile?.firstName?.[0] && user.profile?.lastName?.[0]
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  const getDashboardPath = () => {
    switch (user.role) {
      case 'organizer':
      case 'admin':
        return '/organizer';
      case 'exhibitor':
        return '/exhibitor';
      case 'attendee':
        return '/attendee';
      default:
        return '/';
    }
  };

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4 }}
        >
          <ActionButton
            startIcon={<ArrowBack />}
            onClick={() => navigate(getDashboardPath())}
            sx={{ mb: 3 }}
          >
            Back to Dashboard
          </ActionButton>
        </MotionBox>

        <Grid container spacing={3}>
          {/* User Profile Information */}
          <Grid item xs={12} md={4}>
            <GlassCard>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: activeTheme.accent,
                    fontSize: '2.5rem',
                    mb: 2,
                    border: `3px solid ${activeTheme.accentGlow}`,
                  }}
                >
                  {userInitials}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: activeTheme.textPrimary }}>
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email}
                </Typography>
                <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
                  {user.email}
                </Typography>
                <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mt: 1 }}>
                  Role: {user.role}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: activeTheme.border }} />

              <Box>
                <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 2 }}>
                  PROFILE INFORMATION
                </Typography>
                {user.profile?.firstName && (
                  <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textPrimary }}>
                    <strong style={{ color: activeTheme.textSecondary }}>First Name:</strong> {user.profile.firstName}
                  </Typography>
                )}
                {user.profile?.lastName && (
                  <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textPrimary }}>
                    <strong style={{ color: activeTheme.textSecondary }}>Last Name:</strong> {user.profile.lastName}
                  </Typography>
                )}
                {user.profile?.phone && (
                  <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textPrimary }}>
                    <strong style={{ color: activeTheme.textSecondary }}>Phone:</strong> {user.profile.phone}
                  </Typography>
                )}
              </Box>
            </GlassCard>
          </Grid>

          {/* Notification Preferences */}
          <Grid item xs={12} md={8}>
            <NotificationPreferences />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}

