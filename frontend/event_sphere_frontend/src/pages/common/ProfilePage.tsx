/**
 * Profile Page
 * Common user profile page for all roles
 * Displays user profile information and notification preferences
 * Implements T207
 */

import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import NotificationPreferences from '../../components/attendee/NotificationPreferences';
import { useAuthStore } from '../../stores/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) {
    return (
      <>
        <AppBar title="Profile" />
        <Container>
          <Alert severity="error">User not found</Alert>
        </Container>
      </>
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
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Profile" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(getDashboardPath())}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        <Grid container spacing={3}>
          {/* User Profile Information */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mb: 2,
                  }}
                >
                  {userInitials}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Role: {user.role}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Profile Information
                </Typography>
                {user.profile?.firstName && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>First Name:</strong> {user.profile.firstName}
                  </Typography>
                )}
                {user.profile?.lastName && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Last Name:</strong> {user.profile.lastName}
                  </Typography>
                )}
                {user.profile?.phone && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {user.profile.phone}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Notification Preferences */}
          <Grid item xs={12} md={8}>
            <NotificationPreferences />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

