/**
 * ReviewApplicationDialog Component
 * Full application details modal with approve/reject functionality
 * Implements T157
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Link,
  Paper,
} from '@mui/material';
import { CheckCircle, Cancel, Description, Email, Phone, Language } from '@mui/icons-material';
import type { ExhibitorApplication } from '../../types/approval';

interface ReviewApplicationDialogProps {
  open: boolean;
  application: ExhibitorApplication | null;
  onClose: () => void;
  onApprove: (application: ExhibitorApplication) => Promise<void>;
  onReject: (application: ExhibitorApplication, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ReviewApplicationDialog({
  open,
  application,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: ReviewApplicationDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const handleClose = () => {
    setShowRejectForm(false);
    setRejectionReason('');
    setRejectionError(null);
    onClose();
  };

  const handleApprove = async () => {
    if (application) {
      try {
        await onApprove(application);
        handleClose();
      } catch (error) {
        // Error handled by parent
      }
    }
  };

  const handleReject = async () => {
    if (!application) return;

    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters');
      return;
    }

    if (rejectionReason.trim().length > 500) {
      setRejectionError('Rejection reason must be at most 500 characters');
      return;
    }

    setRejectionError(null);
    try {
      await onReject(application, rejectionReason.trim());
      handleClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  if (!application) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {application.logo && (
              <Avatar src={application.logo} alt={application.companyName} sx={{ mr: 2, width: 48, height: 48 }} />
            )}
            <Box>
              <Typography variant="h6">{application.companyName}</Typography>
              <Chip
                label={application.registrationStatus.toUpperCase()}
                color={
                  application.registrationStatus === 'approved'
                    ? 'success'
                    : application.registrationStatus === 'rejected'
                      ? 'error'
                      : 'warning'
                }
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Company Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {application.description}
            </Typography>
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Category
            </Typography>
            <Chip label={application.category} variant="outlined" />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{application.contactInfo.email}</Typography>
              </Box>
              {application.contactInfo.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{application.contactInfo.phone}</Typography>
                </Box>
              )}
              {application.contactInfo.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Language fontSize="small" color="action" />
                  <Link href={application.contactInfo.website} target="_blank" rel="noopener noreferrer">
                    {application.contactInfo.website}
                  </Link>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Products/Services */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Products/Services ({application.productsServices.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {application.productsServices.map((product, index) => (
                <Chip key={index} label={product} variant="outlined" />
              ))}
            </Box>
          </Grid>

          {/* Documents */}
          {application.documents && application.documents.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Documents ({application.documents.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {application.documents.map((doc, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{doc.filename}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                      >
                        View
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Grid>
          )}

          {/* Rejection Reason (if rejected) */}
          {application.registrationStatus === 'rejected' && application.rejectionReason && (
            <Grid item xs={12}>
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>
                  Rejection Reason
                </Typography>
                <Typography variant="body2">{application.rejectionReason}</Typography>
              </Alert>
            </Grid>
          )}

          {/* Reject Form */}
          {showRejectForm && application.registrationStatus === 'pending' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Rejection Reason (Required)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError(null);
                }}
                error={!!rejectionError}
                helperText={rejectionError || 'Please provide a detailed reason for rejection (10-500 characters)'}
                placeholder="Enter rejection reason..."
                disabled={isLoading}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          {application.registrationStatus === 'pending' && !showRejectForm ? 'Close' : 'Cancel'}
        </Button>
        {application.registrationStatus === 'pending' && !showRejectForm && (
          <>
            <Button
              onClick={() => setShowRejectForm(true)}
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              variant="contained"
              color="success"
              startIcon={isLoading ? <CircularProgress size={16} /> : <CheckCircle />}
              disabled={isLoading}
            >
              Approve
            </Button>
          </>
        )}
        {showRejectForm && (
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            startIcon={isLoading ? <CircularProgress size={16} /> : <Cancel />}
            disabled={isLoading || !rejectionReason.trim()}
          >
            Confirm Rejection
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

