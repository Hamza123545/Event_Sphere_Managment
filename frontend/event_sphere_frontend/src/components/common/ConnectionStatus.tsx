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

  const getStatusColor = (): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'reconnecting':
        return 'warning';
      case 'disconnected':
        return 'error';
    }
  };

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

  return (
    <Tooltip title={getStatusText()} arrow>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Circle
            sx={{
              fontSize: 12,
              color: status === 'connected' ? '#4caf50' : status === 'reconnecting' ? '#ff9800' : '#f44336',
            }}
          />
        }
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: status === 'connected' ? '#4caf50' : status === 'reconnecting' ? '#ff9800' : '#f44336',
          }}
        />
      </Badge>
    </Tooltip>
  );
}

