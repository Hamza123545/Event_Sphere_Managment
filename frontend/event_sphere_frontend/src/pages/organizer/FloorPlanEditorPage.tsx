/**
 * Floor Plan Editor Page
 * Main page for creating and managing floor plans
 * Implements T124: User Story 4
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Add, Edit } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import CreateFloorPlanForm from '../../components/organizer/CreateFloorPlanForm';
import AddBoothForm from '../../components/organizer/AddBoothForm';
import InteractiveFloorPlan from '../../components/organizer/InteractiveFloorPlan';
import AssignExhibitorDialog from '../../components/organizer/AssignExhibitorDialog';
import { useFloorPlanStore } from '../../stores/floorPlanStore';
import { useExpoStore } from '../../stores/expoStore';
import type { BoothSpace, CreateFloorPlanRequest, CreateBoothSpaceRequest } from '../../types/floorPlan';

export default function FloorPlanEditorPage() {
  const { expoId } = useParams<{ expoId: string }>();
  const navigate = useNavigate();
  const {
    floorPlan,
    isLoading,
    error,
    getFloorPlan,
    createFloorPlan,
    addBoothSpace,
    assignExhibitorToBooth,
    clearError,
    unsubscribeFromBoothUpdates,
  } = useFloorPlanStore();
  const { getExpo } = useExpoStore();

  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [addBoothFormOpen, setAddBoothFormOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<BoothSpace | null>(null);
  const [approvedExhibitors, setApprovedExhibitors] = useState<any[]>([]);

  useEffect(() => {
    if (expoId) {
      getFloorPlan(expoId).catch(() => {
        // Floor plan doesn't exist yet, that's okay
      });
      getExpo(expoId);
    }

    return () => {
      if (expoId) {
        unsubscribeFromBoothUpdates(expoId);
      }
    };
  }, [expoId, getFloorPlan, getExpo, unsubscribeFromBoothUpdates]);

  // TODO: Load approved exhibitors for this expo
  // This would require an API endpoint to list approved exhibitors for an expo
  useEffect(() => {
    if (expoId && assignDialogOpen) {
      // Placeholder - would fetch from API
      setApprovedExhibitors([]);
    }
  }, [expoId, assignDialogOpen]);

  const handleCreateFloorPlan = async (request: CreateFloorPlanRequest) => {
    if (!expoId) return;
    await createFloorPlan(expoId, request);
    setCreateFormOpen(false);
  };

  const handleAddBooth = async (request: CreateBoothSpaceRequest) => {
    if (!expoId) return;
    await addBoothSpace(expoId, request);
    setAddBoothFormOpen(false);
  };

  const handleBoothClick = (booth: BoothSpace) => {
    setSelectedBooth(booth);
    if (booth.status === 'available') {
      setAssignDialogOpen(true);
    }
  };

  const handleAssignExhibitor = async (profileId: string) => {
    if (!expoId || !selectedBooth) return;
    await assignExhibitorToBooth(expoId, selectedBooth.boothId, { profileId });
    setAssignDialogOpen(false);
    setSelectedBooth(null);
  };

  if (!expoId) {
    return (
      <>
        <AppBar title="Organizer Portal" />
        <Container>Invalid expo ID</Container>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Organizer Portal" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {isLoading && !floorPlan ? (
          <LoadingSpinner />
        ) : !floorPlan ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              No Floor Plan Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create a floor plan to start managing booth spaces for this expo.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateFormOpen(true)}>
              Create Floor Plan
            </Button>
          </Paper>
        ) : (
          <Box>
            <InteractiveFloorPlan
              floorPlan={floorPlan}
              onBoothClick={handleBoothClick}
              onAddBooth={() => setAddBoothFormOpen(true)}
              selectedBoothId={selectedBooth?.boothId}
            />
          </Box>
        )}

        {/* Create Floor Plan Dialog */}
        <CreateFloorPlanForm
          open={createFormOpen}
          expoId={expoId}
          onClose={() => setCreateFormOpen(false)}
          onSubmit={handleCreateFloorPlan}
          isLoading={isLoading}
          error={error}
        />

        {/* Add Booth Dialog */}
        <AddBoothForm
          open={addBoothFormOpen}
          onClose={() => setAddBoothFormOpen(false)}
          onSubmit={handleAddBooth}
          isLoading={isLoading}
          error={error}
        />

        {/* Assign Exhibitor Dialog */}
        {selectedBooth && (
          <AssignExhibitorDialog
            open={assignDialogOpen}
            booth={selectedBooth}
            exhibitors={approvedExhibitors}
            onAssign={handleAssignExhibitor}
            onClose={() => {
              setAssignDialogOpen(false);
              setSelectedBooth(null);
            }}
            isLoading={isLoading}
            error={error}
          />
        )}
      </Container>
    </Box>
  );
}

