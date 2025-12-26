/**
 * ApplicationCard Component
 * Displays exhibitor application summary with approve/reject actions
 * Implements T156
 */

import { Typography, Chip, Box, Avatar, Alert } from '@mui/material';
import { CheckCircle, Cancel, Description, Visibility } from '@mui/icons-material';
import type { ExhibitorApplication } from '../../types/approval';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface ApplicationCardProps {
  application: ExhibitorApplication;
  onReview: (application: ExhibitorApplication) => void;
  onApprove: (application: ExhibitorApplication) => void;
  onReject: (application: ExhibitorApplication) => void;
  isLoading?: boolean;
}

export default function ApplicationCard({
  application,
  onReview,
  onApprove,
  onReject,
  isLoading = false,
}: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const statusColor = getStatusColor(application.registrationStatus);
  const statusBgColor = statusColor === 'success' ? `${activeTheme.success}20` :
                        statusColor === 'error' ? `${activeTheme.error}20` :
                        `${activeTheme.warning}20`;
  const statusTextColor = statusColor === 'success' ? activeTheme.success :
                          statusColor === 'error' ? activeTheme.error :
                          activeTheme.warning;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            {application.logo && (
              <Avatar 
                src={application.logo} 
                alt={application.companyName} 
                sx={{ 
                  mr: 2, 
                  width: 56, 
                  height: 56,
                  border: `2px solid ${activeTheme.accentGlow}`
                }} 
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: activeTheme.textPrimary }}>
                {application.companyName}
              </Typography>
              <Chip
                label={application.registrationStatus.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: statusBgColor,
                  color: statusTextColor,
                  border: `1px solid ${statusTextColor}30`,
                  fontWeight: 700
                }}
              />
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mb: 2, lineHeight: 1.6 }}>
            {application.description.length > 150
              ? `${application.description.substring(0, 150)}...`
              : application.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
              Category: <span style={{ color: activeTheme.textPrimary }}>{application.category}</span>
            </Typography>
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
              Products/Services: <span style={{ color: activeTheme.textPrimary }}>{application.productsServices.length} item(s)</span>
            </Typography>
            {application.documents && application.documents.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Description sx={{ fontSize: 16, mr: 0.5, color: activeTheme.accent }} />
                <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                  {application.documents.length} document(s)
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {application.productsServices.slice(0, 3).map((product, index) => (
              <Chip 
                key={index} 
                label={product} 
                size="small"
                sx={{
                  bgcolor: `${activeTheme.accent}20`,
                  color: activeTheme.accent,
                  border: `1px solid ${activeTheme.accent}30`,
                  fontWeight: 600
                }}
              />
            ))}
            {application.productsServices.length > 3 && (
              <Chip 
                label={`+${application.productsServices.length - 3} more`} 
                size="small"
                sx={{
                  bgcolor: activeTheme.surfaceLight,
                  color: activeTheme.textSecondary,
                  border: `1px solid ${activeTheme.border}`,
                }}
              />
            )}
          </Box>

          {application.registrationStatus === 'rejected' && application.rejectionReason && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                bgcolor: `${activeTheme.error}20`,
                border: `1px solid ${activeTheme.error}30`,
                color: activeTheme.textPrimary
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Rejection Reason: {application.rejectionReason}
              </Typography>
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
          {application.registrationStatus === 'pending' && (
            <>
              <ActionButton
                size="small"
                startIcon={<Visibility />}
                onClick={() => onReview(application)}
              >
                Review
              </ActionButton>
              <ActionButton
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => onApprove(application)}
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
              <ActionButton
                size="small"
                startIcon={<Cancel />}
                onClick={() => onReject(application)}
                disabled={isLoading}
                sx={{ 
                  color: activeTheme.error,
                  border: `1px solid ${activeTheme.error}30`,
                  '&:hover': { bgcolor: `${activeTheme.error}20` }
                }}
              >
                Reject
              </ActionButton>
            </>
          )}
          {application.registrationStatus !== 'pending' && (
            <ActionButton size="small" startIcon={<Visibility />} onClick={() => onReview(application)}>
              View Details
            </ActionButton>
          )}
        </Box>
      </GlassCard>
    </MotionBox>
  );
}

