/**
 * MessageThread Component
 * Displays conversation view with sender/recipient headers and timestamps
 * Implements T172
 */

import { Box, Typography, Paper, Avatar, Chip, Divider } from '@mui/material';
import type { Message } from '../../types/messaging';

interface MessageThreadProps {
  message: Message;
  onReply?: () => void;
}

export default function MessageThread({ message, onReply }: MessageThreadProps) {
  const formatFullTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getContextLabel = (context: string) => {
    return context
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              {getInitials(message.sender.name)}
            </Avatar>
            <Box>
              <Typography variant="h6">{message.sender.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {message.sender.role} • {message.sender.userId}
              </Typography>
            </Box>
          </Box>
          <Chip label={getContextLabel(message.context)} size="small" variant="outlined" />
        </Box>

        {message.subject && (
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
            {message.subject}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>To:</strong> {message.recipient.name}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            <strong>From:</strong> {message.sender.name}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            {formatFullTimestamp(message.timestamp)}
          </Typography>
          {message.isRead && message.readAt && (
            <>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                Read: {formatFullTimestamp(message.readAt)}
              </Typography>
            </>
          )}
        </Box>

        {message.relatedExpo && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Related Expo:</strong> {message.relatedExpo.title}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Message Content */}
      <Box sx={{ flexGrow: 1, mb: 3 }}>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.8,
          }}
        >
          {message.content}
        </Typography>
      </Box>
    </Paper>
  );
}

