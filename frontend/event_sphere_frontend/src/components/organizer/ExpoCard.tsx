/**
 * ExpoCard Component
 * Implements T058: User Story 1 - Display expo summary with edit/delete actions
 */

import { Typography, Chip, Box, Snackbar, Badge } from '@mui/material';
import { Edit, Delete, Map, Assignment, Analytics } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { getSocket } from '../../services/socket';
import { Alert } from '@mui/material';
import type { ExpoSummary } from '../../types/expo';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface ExpoCardProps {
  expo: ExpoSummary;
  onEdit: (expo: ExpoSummary) => void;
  onDelete: (expo: ExpoSummary) => void;
  onManageFloorPlan?: (expo: ExpoSummary) => void;
  onReviewApplications?: (expo: ExpoSummary) => void;
  onViewAnalytics?: (expo: ExpoSummary) => void;
  pendingApplicationsCount?: number;
}

export default function ExpoCard({
  expo,
  onEdit,
  onDelete,
  onManageFloorPlan,
  onReviewApplications,
  onViewAnalytics,
  pendingApplicationsCount = 0,
}: ExpoCardProps) {
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);

  // Listen for expo updates (T142)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleExpoUpdated = (event: any) => {
      if (event.expoId === expo.expoId) {
        const criticalChanges = event.changes?.filter((c: any) =>
          ['dateRange', 'status'].includes(c.field)
        );

        if (criticalChanges && criticalChanges.length > 0) {
          const changeMessages = criticalChanges.map((c: any) => {
            if (c.field === 'dateRange') {
              return 'Event dates have been updated';
            } else if (c.field === 'status' && c.newValue === 'cancelled') {
              return 'This event has been cancelled';
            }
            return `Event ${c.field} has been updated`;
          });

          setNotification({
            message: changeMessages.join(', '),
            type: criticalChanges.some((c: any) => c.newValue === 'cancelled') ? 'warning' : 'info',
          });

          setTimeout(() => {
            setNotification(null);
          }, 10000); // 10 seconds for critical changes
        }
      }
    };

    socket.on('expo-updated', handleExpoUpdated);

    return () => {
      socket.off('expo-updated', handleExpoUpdated);
    };
  }, [expo.expoId]);

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'primary';
      case 'draft':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Toast Notification (T142) */}
      <Snackbar
        open={!!notification}
        autoHideDuration={10000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          sx={{ 
            width: '100%',
            bgcolor: notification?.type === 'warning' ? `${activeTheme.warning}20` : `${activeTheme.info}20`,
            border: `1px solid ${notification?.type === 'warning' ? activeTheme.warning : activeTheme.info}30`,
            color: activeTheme.textPrimary
          }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
      >
        <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
          {/* Expo Image */}
          {expo.imageUrl && (
            <Box
              component="img"
              src={expo.imageUrl}
              alt={expo.title}
              sx={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
          <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, flex: 1, color: activeTheme.textPrimary }}>
                {expo.title}
              </Typography>
              <Chip
                label={expo.status}
                size="small"
                sx={{ 
                  ml: 1,
                  bgcolor: getStatusColor(expo.status) === 'success' ? `${activeTheme.success}20` :
                           getStatusColor(expo.status) === 'primary' ? `${activeTheme.accent}20` :
                           getStatusColor(expo.status) === 'error' ? `${activeTheme.error}20` :
                           activeTheme.surfaceLight,
                  color: getStatusColor(expo.status) === 'success' ? activeTheme.success :
                         getStatusColor(expo.status) === 'primary' ? activeTheme.accent :
                         getStatusColor(expo.status) === 'error' ? activeTheme.error :
                         activeTheme.textSecondary,
                  border: `1px solid ${getStatusColor(expo.status) === 'success' ? activeTheme.success :
                           getStatusColor(expo.status) === 'primary' ? activeTheme.accent :
                           getStatusColor(expo.status) === 'error' ? activeTheme.error :
                           activeTheme.border}30`,
                  fontWeight: 700
                }}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              {expo.dateRange && (
                <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
                  <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Dates:</span>{' '}
                  {formatDate(expo.dateRange.startDate)} - {formatDate(expo.dateRange.endDate)}
                </Typography>
              )}

              {expo.location && (
                <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
                  <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Location:</span>{' '}
                  {expo.location.venueName
                    ? `${expo.location.venueName}, ${expo.location.city}, ${expo.location.country}`
                    : `${expo.location.city}, ${expo.location.country}`}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 'auto', pt: 3, px: 3, pb: 3, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
            {onReviewApplications && (
              <ActionButton
                size="small"
                startIcon={
                  pendingApplicationsCount && pendingApplicationsCount > 0 ? (
                    <Badge badgeContent={pendingApplicationsCount} sx={{ '& .MuiBadge-badge': { bgcolor: activeTheme.warning } }}>
                      <Assignment />
                    </Badge>
                  ) : (
                    <Assignment />
                  )
                }
                onClick={() => onReviewApplications(expo)}
                sx={{ mr: 'auto' }}
              >
                Applications {pendingApplicationsCount && pendingApplicationsCount > 0 ? `(${pendingApplicationsCount})` : ''}
              </ActionButton>
            )}
            {onViewAnalytics && (
              <ActionButton
                size="small"
                startIcon={<Analytics />}
                onClick={() => onViewAnalytics(expo)}
                sx={{ mr: 'auto' }}
              >
                Analytics
              </ActionButton>
            )}
            {onManageFloorPlan && (
              <ActionButton
                size="small"
                primary
                startIcon={<Map />}
                onClick={() => onManageFloorPlan(expo)}
              >
                Floor Plan
              </ActionButton>
            )}
            <ActionButton
              size="small"
              startIcon={<Edit />}
              onClick={() => onEdit(expo)}
            >
              Edit
            </ActionButton>
            <ActionButton
              size="small"
              startIcon={<Delete />}
              onClick={() => onDelete(expo)}
              sx={{ color: activeTheme.error, '&:hover': { bgcolor: `${activeTheme.error}20` } }}
            >
              Delete
            </ActionButton>
          </Box>
        </GlassCard>
      </MotionBox>
    </>
  );
}

