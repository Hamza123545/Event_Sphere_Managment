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
} from '@mui/material';
import { CheckCircle, Cancel, Description, Email, Phone, Language } from '@mui/icons-material';
import type { ExhibitorApplication } from '../../types/approval';
import {
  GlassCard,
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

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
      } catch {
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
    } catch {
      // Error handled by parent
    }
  };

  if (!application) return null;

  const statusColor = application.registrationStatus === 'approved' ? activeTheme.success :
                     application.registrationStatus === 'rejected' ? activeTheme.error :
                     activeTheme.warning;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {application.logo && (
              <Avatar 
                src={application.logo} 
                alt={application.companyName} 
                sx={{ 
                  width: 56, 
                  height: 56,
                  border: `2px solid ${activeTheme.accentGlow}`
                }} 
              />
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
                {application.companyName}
              </Typography>
              <Chip
                label={application.registrationStatus.toUpperCase()}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: `${statusColor}20`,
                  color: statusColor,
                  border: `1px solid ${statusColor}30`,
                  fontWeight: 700
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: activeTheme.surface }}>
        <Grid container spacing={3}>
          {/* Company Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              DESCRIPTION
            </Typography>
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary, lineHeight: 1.7 }}>
              {application.description}
            </Typography>
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              CATEGORY
            </Typography>
            <Chip 
              label={application.category}
              sx={{
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 700
              }}
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              CONTACT INFORMATION
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: activeTheme.accent }} />
                <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                  {application.contactInfo.email}
                </Typography>
              </Box>
              {application.contactInfo.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 18, color: activeTheme.accent }} />
                  <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                    {application.contactInfo.phone}
                  </Typography>
                </Box>
              )}
              {application.contactInfo.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Language sx={{ fontSize: 18, color: activeTheme.accent }} />
                  <Link 
                    href={application.contactInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ color: activeTheme.accent, fontWeight: 600, '&:hover': { color: activeTheme.accentGlow } }}
                  >
                    {application.contactInfo.website}
                  </Link>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Products/Services */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              PRODUCTS/SERVICES ({application.productsServices.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {application.productsServices.map((product, index) => (
                <Chip 
                  key={index} 
                  label={product}
                  sx={{
                    bgcolor: `${activeTheme.accent}20`,
                    color: activeTheme.accent,
                    border: `1px solid ${activeTheme.accent}30`,
                    fontWeight: 600
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Documents */}
          {application.documents && application.documents.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2, borderColor: activeTheme.border }} />
              <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 2 }}>
                DOCUMENTS ({application.documents.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {application.documents.map((doc, index) => (
                  <GlassCard key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Description sx={{ fontSize: 24, color: activeTheme.accent }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: activeTheme.textPrimary, mb: 0.5 }}>
                          {doc.filename}
                        </Typography>
                        <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <ActionButton
                        size="small"
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        component="a"
                      >
                        View
                      </ActionButton>
                    </Box>
                  </GlassCard>
                ))}
              </Box>
            </Grid>
          )}

          {/* Rejection Reason (if rejected) */}
          {application.registrationStatus === 'rejected' && application.rejectionReason && (
            <Grid item xs={12}>
              <Alert 
                severity="error"
                sx={{
                  bgcolor: `${activeTheme.error}20`,
                  border: `1px solid ${activeTheme.error}30`,
                  color: activeTheme.textPrimary
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Rejection Reason
                </Typography>
                <Typography variant="body2">{application.rejectionReason}</Typography>
              </Alert>
            </Grid>
          )}

          {/* Reject Form */}
          {showRejectForm && application.registrationStatus === 'pending' && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2, borderColor: activeTheme.border }} />
              <Typography variant="subtitle2" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 2 }}>
                REJECTION REASON (Required)
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: activeTheme.surfaceLight,
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
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={handleClose} disabled={isLoading}>
          {application.registrationStatus === 'pending' && !showRejectForm ? 'Close' : 'Cancel'}
        </ActionButton>
        {application.registrationStatus === 'pending' && !showRejectForm && (
          <>
            <ActionButton
              onClick={() => setShowRejectForm(true)}
              startIcon={<Cancel />}
              disabled={isLoading}
              sx={{
                color: activeTheme.error,
                border: `1px solid ${activeTheme.error}30`,
                '&:hover': { bgcolor: `${activeTheme.error}20` }
              }}
            >
              Reject
            </ActionButton>
            <ActionButton
              onClick={handleApprove}
              startIcon={isLoading ? <CircularProgress size={16} /> : <CheckCircle />}
              disabled={isLoading}
              sx={{
                bgcolor: `${activeTheme.success}20`,
                color: activeTheme.success,
                border: `1px solid ${activeTheme.success}30`,
                '&:hover': { bgcolor: `${activeTheme.success}30` }
              }}
            >
              Approve
            </ActionButton>
          </>
        )}
        {showRejectForm && (
          <ActionButton
            onClick={handleReject}
            startIcon={isLoading ? <CircularProgress size={16} /> : <Cancel />}
            disabled={isLoading || !rejectionReason.trim()}
            sx={{
              color: activeTheme.error,
              border: `1px solid ${activeTheme.error}30`,
              '&:hover': { bgcolor: `${activeTheme.error}20` }
            }}
          >
            Confirm Rejection
          </ActionButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

