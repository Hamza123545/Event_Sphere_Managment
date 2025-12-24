/**
 * ApplicationQueuePage Component
 * Displays exhibitor applications for review and approval
 * Implements T155
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  Badge,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useApprovalStore } from '../../stores/approvalStore';
import { useExpoStore } from '../../stores/expoStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ApplicationCard from '../../components/organizer/ApplicationCard';
import ReviewApplicationDialog from '../../components/organizer/ReviewApplicationDialog';
import type { ExhibitorApplication } from '../../types/approval';
import { parseApiError } from '../../utils/errorHandler';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`status-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

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
    } catch (error: any) {
      setActionError(parseApiError(error));
    }
  };

  const handleReject = async (application: ExhibitorApplication, reason: string) => {
    if (!expoId) return;
    setActionError(null);
    try {
      await rejectExhibitor(expoId, application.profileId, reason);
      setReviewDialogOpen(false);
      // Reload applications to update the list
      const status = statusFilter === 'all' ? undefined : statusFilter;
      await listApplications(expoId, status);
    } catch (error: any) {
      setActionError(parseApiError(error));
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
      <Container>
        <Alert severity="error">Invalid expo ID</Alert>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar title={selectedExpo?.title || 'Application Queue'} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Exhibitor Applications
              </Typography>
              {selectedExpo && (
                <Typography variant="body2" color="text.secondary">
                  {selectedExpo.title}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Error Alert */}
        {(error || actionError) && (
          <ErrorAlert
            message={error || actionError || 'An error occurred'}
            onClose={() => {
              clearError();
              setActionError(null);
            }}
            sx={{ mb: 3 }}
          />
        )}

        {/* Status Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
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
        </Box>

        {/* Loading Spinner */}
        {isLoading && <LoadingSpinner />}

        {/* Applications Grid */}
        {!isLoading && (
          <>
            {getApplicationsForTab().length === 0 ? (
              <Alert severity="info">No applications found for the selected filter.</Alert>
            ) : (
              <Grid container spacing={3}>
                {getApplicationsForTab().map((application) => (
                  <Grid item xs={12} sm={6} md={4} key={application.profileId}>
                    <ApplicationCard
                      application={application}
                      onReview={handleReview}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isLoading={isLoading}
                    />
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
      </Container>
    </Box>
  );
}

