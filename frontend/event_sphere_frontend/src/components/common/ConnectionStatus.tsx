/**
 * ConnectionStatus Component
 * WebSocket connection status indicator
 * Implements T139: User Story 5
 */

import { useEffect, useState } from 'react';
import { Badge, Tooltip, Box } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { getSocket } from '../../services/socket';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setStatus('disconnected');
      return;
    }

    // Set initial status
    setStatus(socket.connected ? 'connected' : 'disconnected');

    // Listen for connection events
    const handleConnect = () => {
      setStatus('connected');
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleReconnect = () => {
      setStatus('reconnecting');
    };

    const handleReconnectAttempt = () => {
      setStatus('reconnecting');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  const getStatusColorValue = () => {
    switch (status) {
      case 'connected':
        return '#4caf50';
      case 'reconnecting':
        return '#ff9800';
      case 'disconnected':
        return '#f44336';
    }
  };

  return (
    <Tooltip title={getStatusText()} arrow>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Circle
            sx={{
              fontSize: 12,
              color: getStatusColorValue(),
            }}
          />
        }
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: getStatusColorValue(),
            boxShadow: `0 0 8px ${getStatusColorValue()}80`,
          }}
        />
      </Badge>
    </Tooltip>
  );
}

