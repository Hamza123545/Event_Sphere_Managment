/**
 * Floor Plan Page
 * Page that displays FloorPlanViewer for exhibitors to view and select booths
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import FloorPlanViewer from '../../components/exhibitor/FloorPlanViewer';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import { useEffect } from 'react';

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
      <>
        <AppBar title="Exhibitor Portal" />
        <Container>Invalid expo ID</Container>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <AppBar title="Exhibitor Portal" />
        <Container>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/exhibitor')} sx={{ mb: 2 }}>
            Back to Dashboard
          </Button>
          <Box>No approved profile found for this expo. Please register and wait for approval.</Box>
        </Container>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Exhibitor Portal" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/exhibitor')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        <FloorPlanViewer expoId={expoId} profileId={profile.profileId} />
      </Container>
    </Box>
  );
}

