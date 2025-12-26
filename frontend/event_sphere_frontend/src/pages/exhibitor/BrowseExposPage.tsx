/**
 * Browse Expos Page
 * Page that displays ExpoDirectory component for exhibitors to browse and register
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ModernNavbar from '../../components/common/ModernNavbar';
import ExpoDirectory from '../../components/exhibitor/ExpoDirectory';
import RegistrationForm from '../../components/exhibitor/RegistrationForm';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { ExpoSummary } from '../../types/expo';
import {
  PageContainer,
  BackgroundGlows,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function BrowseExposPage() {
  const navigate = useNavigate();
  const { getProfiles } = useExhibitorStore();
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [selectedExpo, setSelectedExpo] = useState<ExpoSummary | null>(null);

  const handleRegister = (expoId: string) => {
    // Find the expo details from available expos
    const expo = useExhibitorStore.getState().availableExpos.find((e) => e.expoId === expoId);
    if (expo) {
      setSelectedExpo(expo);
      setRegistrationDialogOpen(true);
    }
  };

  const handleRegistrationSuccess = () => {
    // Refresh profiles after successful registration
    getProfiles();
    navigate('/exhibitor');
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
          sx={{ mb: 6 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-2px' }}>
            Browse Available Expos
          </Typography>
          <Typography variant="h6" sx={{ color: activeTheme.textSecondary, fontWeight: 500 }}>
            Find and register for expos to showcase your company
          </Typography>
        </MotionBox>

        <ExpoDirectory onRegister={handleRegister} />

        {selectedExpo && (
          <RegistrationForm
            open={registrationDialogOpen}
            expoId={selectedExpo.expoId}
            expoTitle={selectedExpo.title}
            onClose={() => {
              setRegistrationDialogOpen(false);
              setSelectedExpo(null);
            }}
            onSuccess={handleRegistrationSuccess}
          />
        )}
      </Box>
    </PageContainer>
  );
}

