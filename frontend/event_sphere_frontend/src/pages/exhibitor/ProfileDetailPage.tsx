/**
 * Profile Detail Page
 * Shows exhibitor profile details with edit and booth management
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Button, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import ProfileView from '../../components/exhibitor/ProfileView';
import EditProfileForm from '../../components/exhibitor/EditProfileForm';
import BoothDetailsForm from '../../components/exhibitor/BoothDetailsForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useExhibitorStore } from '../../stores/exhibitorStore';

export default function ProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { selectedProfile, isLoading, error, getProfile, clearError, getProfiles, getAssignedBooth, selectedBooth } = useExhibitorStore();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [boothDetailsDialogOpen, setBoothDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (profileId) {
      getProfile(profileId);
      // Load booth details if profile has a booth
      const profile = useExhibitorStore.getState().selectedProfile;
      if (profile?.booth) {
        getAssignedBooth(profileId);
      }
    }
  }, [profileId, getProfile, getAssignedBooth]);

  const handleEditSuccess = () => {
    if (profileId) {
      getProfile(profileId);
      getProfiles();
    }
  };

  if (isLoading && !selectedProfile) {
    return (
      <>
        <AppBar title="Exhibitor Portal" />
        <LoadingSpinner fullScreen />
      </>
    );
  }

  if (!selectedProfile) {
    return (
      <>
        <AppBar title="Exhibitor Portal" />
        <Container>
          <ErrorAlert message="Profile not found" severity="error" />
        </Container>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Exhibitor Portal" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/exhibitor')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        <ProfileView
          profile={selectedProfile}
          onEdit={() => setEditDialogOpen(true)}
          onEditBooth={selectedProfile.booth ? () => {
            if (selectedProfile.booth && !selectedBooth) {
              getAssignedBooth(selectedProfile.profileId);
            }
            setBoothDetailsDialogOpen(true);
          } : undefined}
          canEdit={selectedProfile.registrationStatus !== 'approved'}
        />

        <EditProfileForm
          open={editDialogOpen}
          profile={selectedProfile}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />

        {selectedProfile.booth && selectedBooth && (
          <BoothDetailsForm
            open={boothDetailsDialogOpen}
            booth={selectedBooth}
            profileId={selectedProfile.profileId}
            onClose={() => setBoothDetailsDialogOpen(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Container>
    </Box>
  );
}

