/**
 * Floor Plan Editor Page
 * Main page for creating and managing floor plans
 * Implements T124: User Story 4
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';
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
  const [approvedExhibitors, setApprovedExhibitors] = useState<Array<{ profileId: string; companyName: string; category: string }>>([]);

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
      // Using setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setApprovedExhibitors([]);
      }, 0);
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
          <ActionButton startIcon={<ArrowBack />} onClick={() => navigate('/organizer')} sx={{ mb: 3 }}>
            Back to Dashboard
          </ActionButton>
        </MotionBox>

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {isLoading && !floorPlan ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : !floorPlan ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
                No Floor Plan Found
              </Typography>
              <Typography variant="body1" sx={{ color: activeTheme.textSecondary, mb: 4 }}>
                Create a floor plan to start managing booth spaces for this expo.
              </Typography>
              <ActionButton primary startIcon={<Add />} onClick={() => setCreateFormOpen(true)}>
                Create Floor Plan
              </ActionButton>
            </Box>
          </GlassCard>
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
      </Box>
    </PageContainer>
  );
}

