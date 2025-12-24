/**
 * ExpoCard Component
 * Implements T058: User Story 1 - Display expo summary with edit/delete actions
 */

import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Snackbar, Badge } from '@mui/material';
import { Edit, Delete, Map, Assignment, Analytics } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { getSocket } from '../../services/socket';
import { Alert } from '@mui/material';
import type { ExpoSummary } from '../../types/expo';

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
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
            {expo.title}
          </Typography>
          <Chip
            label={expo.status}
            color={getStatusColor(expo.status)}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>

        {/* Note: theme and description are not in ExpoSummary type, only in ExpoDetail */}

        <Box sx={{ mt: 2 }}>
          {expo.dateRange && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Dates:</strong>{' '}
              {formatDate(expo.dateRange.startDate)} - {formatDate(expo.dateRange.endDate)}
            </Typography>
          )}

          {expo.location && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Location:</strong>{' '}
              {expo.location.venueName
                ? `${expo.location.venueName}, ${expo.location.city}, ${expo.location.country}`
                : `${expo.location.city}, ${expo.location.country}`}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        {onReviewApplications && (
          <Button
            size="small"
            startIcon={
              pendingApplicationsCount && pendingApplicationsCount > 0 ? (
                <Badge badgeContent={pendingApplicationsCount} color="warning">
                  <Assignment />
                </Badge>
              ) : (
                <Assignment />
              )
            }
            onClick={() => onReviewApplications(expo)}
            variant="contained"
            color="secondary"
            sx={{ mr: 'auto' }}
          >
            Applications {pendingApplicationsCount && pendingApplicationsCount > 0 ? `(${pendingApplicationsCount})` : ''}
          </Button>
        )}
        {onViewAnalytics && (
          <Button
            size="small"
            startIcon={<Analytics />}
            onClick={() => onViewAnalytics(expo)}
            variant="contained"
            color="success"
            sx={{ mr: 'auto' }}
          >
            Analytics
          </Button>
        )}
        {onManageFloorPlan && (
          <Button
            size="small"
            startIcon={<Map />}
            onClick={() => onManageFloorPlan(expo)}
            variant="contained"
            color="primary"
          >
            Floor Plan
          </Button>
        )}
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => onEdit(expo)}
          variant="outlined"
        >
          Edit
        </Button>
        <Button
          size="small"
          startIcon={<Delete />}
          onClick={() => onDelete(expo)}
          variant="outlined"
          color="error"
        >
          Delete
        </Button>
      </CardActions>
    </Card>
    </>
  );
}

