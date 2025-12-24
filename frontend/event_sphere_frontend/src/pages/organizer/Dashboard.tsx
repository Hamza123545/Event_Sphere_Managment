/**
 * Organizer Dashboard Page
 * Implements T055: User Story 1 - Expo list with key details, create button, status filter
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
} from '@mui/material';
import { useExpoStore } from '../../stores/expoStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ExpoCard from '../../components/organizer/ExpoCard';
import CreateExpoForm from '../../components/organizer/CreateExpoForm';
import EditExpoForm from '../../components/organizer/EditExpoForm';
import DeleteExpoDialog from '../../components/organizer/DeleteExpoDialog';
import type { ExpoSummary, ExpoDetail } from '../../types/expo';

type ExpoStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled' | 'all';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    expos,
    selectedExpo,
    isLoading,
    error,
    pagination,
    listExpos,
    createExpo,
    updateExpo,
    deleteExpo,
    getExpo,
    setSelectedExpo,
    clearError,
    subscribeToExpoUpdates,
    unsubscribeFromExpoUpdates,
  } = useExpoStore();

  const [statusFilter, setStatusFilter] = useState<ExpoStatus>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expoToDelete, setExpoToDelete] = useState<ExpoDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load expos on mount and when filters change
  useEffect(() => {
    const loadExpos = async () => {
      await listExpos({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 12,
      });
    };

    loadExpos();
  }, [statusFilter, currentPage, listExpos]);

  // Subscribe to real-time updates for all loaded expos
  useEffect(() => {
    expos.forEach((expo) => {
      subscribeToExpoUpdates(expo.expoId);
    });

    return () => {
      // Cleanup: unsubscribe from all expos when component unmounts
      expos.forEach((expo) => {
        unsubscribeFromExpoUpdates(expo.expoId);
      });
    };
  }, [expos, subscribeToExpoUpdates, unsubscribeFromExpoUpdates]);

  const handleCreateExpo = async (data: any) => {
    try {
      await createExpo(data);
      setCreateDialogOpen(false);
      // Refresh list
      await listExpos({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 12,
      });
    } catch (error) {
      // Error is handled by store
      throw error;
    }
  };

  const handleEditExpo = async (expo: ExpoSummary) => {
    try {
      await getExpo(expo.expoId);
      // selectedExpo will be set by the store after getExpo completes
      setEditDialogOpen(true);
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleSaveEdit = async (expoId: string, data: any) => {
    try {
      await updateExpo(expoId, data);
      setEditDialogOpen(false);
      setSelectedExpo(null);
      // Refresh list
      await listExpos({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 12,
      });
    } catch (error) {
      // Error is handled by store
      throw error;
    }
  };

  const handleDeleteExpo = async (expo: ExpoSummary) => {
    try {
      await getExpo(expo.expoId);
      // The getExpo call will update selectedExpo in the store
      // For the delete dialog, we can use a minimal detail from the summary
      // The dialog doesn't need all the detailed fields
      const expoDetail: ExpoDetail = {
        ...expo,
        description: '',
        theme: '',
        dateRange: expo.dateRange,
        location: {
          venueName: expo.location.venueName || '',
          address: '',
          city: expo.location.city,
          country: expo.location.country,
        },
        organizer: {
          userId: '',
          name: '',
        },
        createdAt: '',
        updatedAt: '',
      };
      setExpoToDelete(expoDetail);
      setDeleteDialogOpen(true);
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleManageFloorPlan = (expo: ExpoSummary) => {
    navigate(`/organizer/expos/${expo.expoId}/floor-plan`);
  };

  const handleReviewApplications = (expo: ExpoSummary) => {
    navigate(`/organizer/expos/${expo.expoId}/applications`);
  };

  const handleViewAnalytics = (expo: ExpoSummary) => {
    navigate(`/organizer/expos/${expo.expoId}/analytics`);
  };

  const handleConfirmDelete = async () => {
    if (!expoToDelete) return;

    try {
      await deleteExpo(expoToDelete.expoId);
      setDeleteDialogOpen(false);
      setExpoToDelete(null);
      // Refresh list
      await listExpos({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 12,
      });
    } catch (error) {
      // Error is handled by store
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar onCreateExpo={() => setCreateDialogOpen(true)} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            My Expo Events
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => {
                setStatusFilter(e.target.value as ExpoStatus);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <ErrorAlert
            message={error}
            onClose={clearError}
            severity="error"
          />
        )}

        {isLoading && expos.length === 0 ? (
          <LoadingSpinner fullScreen />
        ) : expos.length === 0 ? (
          <Alert severity="info">
            No expos found. Click "Create Expo" to get started!
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {expos.map((expo) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={expo.expoId}>
                  <ExpoCard
                    expo={expo}
                    onEdit={handleEditExpo}
                    onDelete={handleDeleteExpo}
                    onManageFloorPlan={handleManageFloorPlan}
                    onReviewApplications={handleReviewApplications}
                    onViewAnalytics={handleViewAnalytics}
                    pendingApplicationsCount={0}
                  />
                </Grid>
              ))}
            </Grid>

            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Create Expo Dialog */}
      <CreateExpoForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateExpo}
      />

      {/* Edit Expo Dialog */}
      <EditExpoForm
        open={editDialogOpen}
        expo={selectedExpo}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedExpo(null);
        }}
        onSubmit={handleSaveEdit}
      />

      {/* Delete Expo Dialog */}
      <DeleteExpoDialog
        open={deleteDialogOpen}
        expo={expoToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setExpoToDelete(null);
        }}
        isLoading={isLoading}
      />
    </Box>
  );
}

