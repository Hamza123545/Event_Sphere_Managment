/**
 * Floor Plan Page
 * Page that displays FloorPlanViewer for exhibitors to view and select booths
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Alert, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import FloorPlanViewer from '../../components/exhibitor/FloorPlanViewer';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import { useEffect } from 'react';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function FloorPlanPage() {
  const { expoId } = useParams<{ expoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profiles, getProfiles } = useExhibitorStore();

  // Get profileId from location state or find approved profile for this expo
  const profileIdFromState = (location.state as any)?.profileId;
  const profile = profileIdFromState
    ? profiles.find((p) => p.profileId === profileIdFromState)
    : profiles.find((p) => p.expoId === expoId && p.registrationStatus === 'approved');

  useEffect(() => {
    if (profiles.length === 0) {
      getProfiles();
    }
  }, [profiles.length, getProfiles]);

  if (!expoId) {
    return (
      <PageContainer>
        <ModernNavbar />
        <Box sx={{ mt: 8, px: { xs: 3, md: 8 } }}>
          <Alert severity="error" sx={{ bgcolor: `${activeTheme.error}20`, border: `1px solid ${activeTheme.error}30` }}>
            Invalid expo ID
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  if (!profile) {
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
            <ActionButton startIcon={<ArrowBack />} onClick={() => navigate('/exhibitor')} sx={{ mb: 3 }}>
              Back to Dashboard
            </ActionButton>
          </MotionBox>
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: activeTheme.textSecondary }}>
                No approved profile found for this expo. Please register and wait for approval.
              </Typography>
            </Box>
          </GlassCard>
        </Box>
      </PageContainer>
    );
  }

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
          <ActionButton startIcon={<ArrowBack />} onClick={() => navigate('/exhibitor')} sx={{ mb: 3 }}>
            Back to Dashboard
          </ActionButton>
        </MotionBox>

        <FloorPlanViewer expoId={expoId} profileId={profile.profileId} />
      </Box>
    </PageContainer>
  );
}

