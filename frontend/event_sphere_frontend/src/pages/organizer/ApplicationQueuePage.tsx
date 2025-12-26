/**
 * ApplicationQueuePage Component
 * Displays exhibitor applications for review and approval
 * Implements T155
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Badge,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useApprovalStore } from '../../stores/approvalStore';
import { useExpoStore } from '../../stores/expoStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  PageContainer,
  BackgroundGlows,
  GlassContainer,
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';
import ApplicationCard from '../../components/organizer/ApplicationCard';
import ReviewApplicationDialog from '../../components/organizer/ReviewApplicationDialog';
import type { ExhibitorApplication } from '../../types/approval';
import { parseApiError } from '../../utils/errorHandler';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';


export default function ApplicationQueuePage() {
  const { expoId } = useParams<{ expoId: string }>();
  const navigate = useNavigate();
  const {
    applications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    isLoading,
    error,
    listApplications,
    approveExhibitor,
    rejectExhibitor,
    clearError,
  } = useApprovalStore();

  const { getExpo, selectedExpo } = useExpoStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<ExhibitorApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load expo details if not loaded
  useEffect(() => {
    if (expoId && (!selectedExpo || selectedExpo.expoId !== expoId)) {
      getExpo(expoId);
    }
  }, [expoId, selectedExpo, getExpo]);

  // Load applications
  useEffect(() => {
    if (expoId) {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      listApplications(expoId, status);
    }
  }, [expoId, statusFilter, listApplications]);

  const handleReview = (application: ExhibitorApplication) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
    setActionError(null);
  };

  const handleApprove = async (application: ExhibitorApplication) => {
    if (!expoId) return;
    setActionError(null);
    try {
      await approveExhibitor(expoId, application.profileId);
      setReviewDialogOpen(false);
      // Reload applications to update the list
      const status = statusFilter === 'all' ? undefined : statusFilter;
      await listApplications(expoId, status);
    } catch (err: unknown) {
      setActionError(parseApiError(err));
    }
  };

  const handleReject = async (application: ExhibitorApplication, reason?: string) => {
    if (!expoId) return;
    // If no reason provided, open review dialog instead
    if (!reason) {
      handleReview(application);
      return;
    }
    setActionError(null);
    try {
      await rejectExhibitor(expoId, application.profileId, reason);
      setReviewDialogOpen(false);
      // Reload applications to update the list
      const status = statusFilter === 'all' ? undefined : statusFilter;
      await listApplications(expoId, status);
    } catch (err: unknown) {
      setActionError(parseApiError(err));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const statuses: StatusFilter[] = ['all', 'pending', 'approved', 'rejected'];
    setStatusFilter(statuses[newValue]);
  };

  const getApplicationsForTab = () => {
    switch (tabValue) {
      case 0:
        return applications;
      case 1:
        return pendingApplications;
      case 2:
        return approvedApplications;
      case 3:
        return rejectedApplications;
      default:
        return [];
    }
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
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}
        >
          <ActionButton startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Back
          </ActionButton>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px', mb: 0.5 }}>
              Exhibitor Applications
            </Typography>
            {selectedExpo && (
              <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                {selectedExpo.title}
              </Typography>
            )}
          </Box>
        </MotionBox>

        {/* Error Alert */}
        {(error || actionError) && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert
              message={error || actionError || 'An error occurred'}
              onClose={() => {
                clearError();
                setActionError(null);
              }}
            />
          </Box>
        )}

        {/* Status Tabs */}
        <GlassContainer sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: activeTheme.textSecondary,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: activeTheme.accent,
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: activeTheme.accent,
              },
            }}
          >
            <Tab label="All" />
            <Tab
              label={
                <Badge badgeContent={pendingApplications.length} color="warning">
                  Pending
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={approvedApplications.length} color="success">
                  Approved
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={rejectedApplications.length} color="error">
                  Rejected
                </Badge>
              }
            />
          </Tabs>
        </GlassContainer>

        {/* Loading Spinner */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        )}

        {/* Applications Grid */}
        {!isLoading && (
          <>
            {getApplicationsForTab().length === 0 ? (
              <GlassCard>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: activeTheme.textSecondary }}>
                    No applications found for the selected filter.
                  </Typography>
                </Box>
              </GlassCard>
            ) : (
              <Grid container spacing={3}>
                {getApplicationsForTab().map((application, index) => (
                  <Grid item xs={12} sm={6} md={4} key={application.profileId}>
                    <MotionBox
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ApplicationCard
                        application={application}
                        onReview={handleReview}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isLoading={isLoading}
                      />
                    </MotionBox>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Review Dialog */}
        <ReviewApplicationDialog
          open={reviewDialogOpen}
          application={selectedApplication}
          onClose={() => {
            setReviewDialogOpen(false);
            setSelectedApplication(null);
            setActionError(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={isLoading}
        />
      </Box>
    </PageContainer>
  );
}

