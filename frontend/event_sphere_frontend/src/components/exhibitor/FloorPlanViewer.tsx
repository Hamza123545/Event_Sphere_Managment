/**
 * FloorPlanViewer Component
 * Implements T083: User Story 2 - Interactive floor plan with booth status colors and click to select
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Alert, Paper, Chip, Snackbar } from '@mui/material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import BoothCard from './BoothCard';
import ReserveBoothDialog from './ReserveBoothDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { getSocket } from '../../services/socket';
import type { BoothDetails } from '../../types/exhibitor';

interface FloorPlanViewerProps {
  expoId: string;
  profileId: string;
}

export default function FloorPlanViewer({ expoId, profileId }: FloorPlanViewerProps) {
  const {
    floorPlan,
    isLoading,
    error,
    viewFloorPlan,
    reserveBooth,
    clearError,
    subscribeToBoothUpdates,
    unsubscribeFromBoothUpdates,
  } = useExhibitorStore();
  const [selectedBooth, setSelectedBooth] = useState<BoothDetails | null>(null);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [highlightedBoothId, setHighlightedBoothId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);

  useEffect(() => {
    viewFloorPlan(expoId);
    subscribeToBoothUpdates(expoId);

    return () => {
      unsubscribeFromBoothUpdates(expoId);
    };
  }, [expoId, viewFloorPlan, subscribeToBoothUpdates, unsubscribeFromBoothUpdates]);

  // Listen for real-time booth updates (T141)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBoothAllocated = (event: any) => {
      if (event.expoId === expoId && event.boothId) {
        setHighlightedBoothId(event.boothId);
        setNotification({
          message: `Booth ${event.booth?.identifier || event.boothId} has been allocated`,
          type: 'info',
        });

        setTimeout(() => {
          setHighlightedBoothId(null);
        }, 5000);

        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    };

    const handleBoothReleased = (event: any) => {
      if (event.expoId === expoId && event.boothId) {
        setNotification({
          message: `A booth has been released and is now available`,
          type: 'info',
        });
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    };

    socket.on('booth-allocated', handleBoothAllocated);
    socket.on('booth-released', handleBoothReleased);

    return () => {
      socket.off('booth-allocated', handleBoothAllocated);
      socket.off('booth-released', handleBoothReleased);
    };
  }, [expoId]);

  const handleBoothClick = (booth: BoothDetails) => {
    if (booth.status === 'available') {
      setSelectedBooth(booth);
      setReserveDialogOpen(true);
      setReserveError(null);
    }
  };

  const handleReserve = async () => {
    if (!selectedBooth) return;

    setIsReserving(true);
    setReserveError(null);

    try {
      await reserveBooth(expoId, selectedBooth.boothId, profileId);
      setReserveDialogOpen(false);
      setSelectedBooth(null);
      // Refresh floor plan to show updated status
      await viewFloorPlan(expoId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reserve booth';
      setReserveError(errorMessage);
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading && !floorPlan) {
    return <LoadingSpinner />;
  }

  if (error && !floorPlan) {
    return <ErrorAlert message={error} onClose={clearError} severity="error" />;
  }

  if (!floorPlan) {
    return <Alert severity="info">Floor plan not available for this expo.</Alert>;
  }

  const availableBooths = floorPlan.booths.filter((b) => b.status === 'available');
  const reservedBooths = floorPlan.booths.filter((b) => b.status === 'reserved');
  const occupiedBooths = floorPlan.booths.filter((b) => b.status === 'occupied');

  return (
    <Box>
      {/* Toast Notification (T141) */}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {floorPlan.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dimensions: {floorPlan.dimensions.width}m × {floorPlan.dimensions.height}m
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`Total: ${floorPlan.metadata.totalBooths}`} />
          <Chip label={`Available: ${floorPlan.metadata.availableBooths}`} color="success" />
          <Chip label={`Reserved: ${reservedBooths.length}`} color="warning" />
          <Chip label={`Occupied: ${occupiedBooths.length}`} />
        </Box>

        {floorPlan.imageUrl && (
          <Box
            sx={{
              mt: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'action.hover',
              position: 'relative',
              minHeight: 400,
            }}
          >
            <Box
              component="img"
              src={floorPlan.imageUrl}
              alt={floorPlan.name}
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            {/* Note: For interactive floor plan, you would overlay clickable areas here */}
          </Box>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Available Booths ({availableBooths.length})
      </Typography>

      {availableBooths.length === 0 ? (
        <Alert severity="info">No available booths. All booths have been reserved or occupied.</Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {availableBooths.map((booth) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={booth.boothId}>
              <BoothCard
                booth={booth}
                onReserve={() => handleBoothClick(booth)}
                canReserve={true}
                highlighted={highlightedBoothId === booth.boothId}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ReserveBoothDialog
        open={reserveDialogOpen}
        booth={selectedBooth}
        profileId={profileId}
        onConfirm={handleReserve}
        onCancel={() => {
          setReserveDialogOpen(false);
          setSelectedBooth(null);
          setReserveError(null);
        }}
        isLoading={isReserving}
        error={reserveError}
      />
    </Box>
  );
}

