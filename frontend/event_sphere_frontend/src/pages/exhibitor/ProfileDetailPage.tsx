/**
 * Profile Detail Page
 * Shows exhibitor profile details with edit and booth management
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import ProfileView from '../../components/exhibitor/ProfileView';
import EditProfileForm from '../../components/exhibitor/EditProfileForm';
import BoothDetailsForm from '../../components/exhibitor/BoothDetailsForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import {
  PageContainer,
  BackgroundGlows,
  ActionButton,
  MotionBox,
} from '../../theme/designSystem';

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
      <PageContainer>
        <ModernNavbar />
        <LoadingSpinner fullScreen />
      </PageContainer>
    );
  }

  if (!selectedProfile) {
    return (
      <PageContainer>
        <ModernNavbar />
        <Box sx={{ mt: 8, px: { xs: 3, md: 8 } }}>
          <ErrorAlert message="Profile not found" severity="error" />
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

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

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
      </Box>
    </PageContainer>
  );
}

