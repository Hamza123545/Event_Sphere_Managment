/**
 * Organizer Dashboard Page
 * Implements T055: User Story 1 - Expo list with key details, create button, status filter
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useExpoStore } from '../../stores/expoStore';
import { useAuthStore } from '../../stores/authStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ExpoCard from '../../components/organizer/ExpoCard';
import CreateExpoForm from '../../components/organizer/CreateExpoForm';
import EditExpoForm from '../../components/organizer/EditExpoForm';
import DeleteExpoDialog from '../../components/organizer/DeleteExpoDialog';
import type { ExpoSummary, ExpoDetail, CreateExpoRequest, UpdateExpoRequest } from '../../types/expo';
import {
  PageContainer,
  SectionTitle,
  ActionButton,
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

type ExpoStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled' | 'all';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
    // Only fetch expos if user is authenticated
    if (!user || !user.userId) {
      return;
    }

    const loadExpos = async () => {
      await listExpos({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 12,
      });
    };

    loadExpos();
  }, [statusFilter, currentPage, listExpos, user]);

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

  const handleCreateExpo = async (data: CreateExpoRequest) => {
    await createExpo(data);
    setCreateDialogOpen(false);
    // Refresh list
    await listExpos({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: currentPage,
      limit: 12,
    });
  };

  const handleEditExpo = async (expo: ExpoSummary) => {
    await getExpo(expo.expoId);
    // selectedExpo will be set by the store after getExpo completes
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (expoId: string, data: UpdateExpoRequest) => {
    await updateExpo(expoId, data);
    setEditDialogOpen(false);
    setSelectedExpo(null);
    // Refresh list
    await listExpos({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: currentPage,
      limit: 12,
    });
  };

  const handleDeleteExpo = async (expo: ExpoSummary) => {
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

    await deleteExpo(expoToDelete.expoId);
    setDeleteDialogOpen(false);
    setExpoToDelete(null);
    // Refresh list
    await listExpos({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: currentPage,
      limit: 12,
    });
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <PageContainer>
      <ModernNavbar onCreateExpo={() => setCreateDialogOpen(true)} />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1 }}>
        <SectionTitle
          subtitle={`${expos.length} ${expos.length === 1 ? 'expo' : 'expos'} ${statusFilter !== 'all' ? `(${statusFilter})` : ''}`}
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl 
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: activeTheme.surface,
                    color: activeTheme.textPrimary,
                    '& fieldset': {
                      borderColor: activeTheme.border,
                    },
                    '&:hover fieldset': {
                      borderColor: activeTheme.accent,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: activeTheme.textSecondary,
                  },
                }}
              >
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ExpoStatus);
                    setCurrentPage(1);
                  }}
                  sx={{ color: activeTheme.textPrimary }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <ActionButton
                primary
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Expo
              </ActionButton>
            </Box>
          }
        >
          My Expo Events
        </SectionTitle>

        {error && error !== 'Failed to load expos' && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert
              message={error}
              onClose={clearError}
              severity="error"
            />
          </Box>
        )}

        {isLoading && expos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : expos.length === 0 ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                No expos found. Create your first expo to get started!
              </Typography>
              <ActionButton
                primary
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Expo
              </ActionButton>
            </Box>
          </GlassCard>
        ) : (
          <>
            <AnimatePresence>
              <Grid container spacing={3}>
                {expos.map((expo, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={expo.expoId}>
                    <MotionBox
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ExpoCard
                        expo={expo}
                        onEdit={handleEditExpo}
                        onDelete={handleDeleteExpo}
                        onManageFloorPlan={handleManageFloorPlan}
                        onReviewApplications={handleReviewApplications}
                        onViewAnalytics={handleViewAnalytics}
                        pendingApplicationsCount={0}
                      />
                    </MotionBox>
                  </Grid>
                ))}
              </Grid>
            </AnimatePresence>

            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: activeTheme.textPrimary,
                      '&.Mui-selected': {
                        bgcolor: activeTheme.accent,
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#7c3aed',
                        },
                      },
                    },
                  }}
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>

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
    </PageContainer>
  );
}

