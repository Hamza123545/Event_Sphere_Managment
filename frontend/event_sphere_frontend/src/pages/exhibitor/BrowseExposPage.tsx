/**
 * Browse Expos Page
 * Page that displays ExpoDirectory component for exhibitors to browse and register
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import AppBar from '../../components/common/AppBar';
import ExpoDirectory from '../../components/exhibitor/ExpoDirectory';
import RegistrationForm from '../../components/exhibitor/RegistrationForm';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import type { ExpoSummary } from '../../types/expo';

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
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Exhibitor Portal" onBrowseExpos={() => navigate('/exhibitor/browse')} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Browse Available Expos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Find and register for expos to showcase your company
        </Typography>

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
      </Container>
    </Box>
  );
}

