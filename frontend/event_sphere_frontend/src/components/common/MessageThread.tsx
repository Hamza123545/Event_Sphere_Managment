/**
 * MessageThread Component
 * Displays conversation view with sender/recipient headers and timestamps
 * Implements T172
 */

import { Box, Typography, Avatar, Chip, Divider } from '@mui/material';
import type { Message } from '../../types/messaging';
import {
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: activeTheme.accent, width: 56, height: 56, border: `2px solid ${activeTheme.accentGlow}`, fontWeight: 700 }}>
                {getInitials(message.sender.name)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
                  {message.sender.name}
                </Typography>
                <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                  {message.sender.role} • {message.sender.userId}
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={getContextLabel(message.context)} 
              size="small"
              sx={{
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 700
              }}
            />
          </Box>

          {message.subject && (
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, color: activeTheme.textPrimary }}>
              {message.subject}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              <span style={{ color: activeTheme.textPrimary, fontWeight: 700 }}>To:</span> {message.recipient.name}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: activeTheme.border }} />
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              <span style={{ color: activeTheme.textPrimary, fontWeight: 700 }}>From:</span> {message.sender.name}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: activeTheme.border }} />
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              {formatFullTimestamp(message.timestamp)}
            </Typography>
            {message.isRead && message.readAt && (
              <>
                <Divider orientation="vertical" flexItem sx={{ borderColor: activeTheme.border }} />
                <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                  Read: {formatFullTimestamp(message.readAt)}
                </Typography>
              </>
            )}
          </Box>

          {message.relatedExpo && (
            <Box sx={{ mt: 3, p: 2, bgcolor: activeTheme.surface, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
              <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                <span style={{ color: activeTheme.textPrimary, fontWeight: 700 }}>Related Expo:</span> {message.relatedExpo.title}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3, borderColor: activeTheme.border }} />

        {/* Message Content */}
        <Box sx={{ flexGrow: 1, mb: 3 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.8,
              color: activeTheme.textSecondary,
            }}
          >
            {message.content}
          </Typography>
        </Box>
      </GlassCard>
    </MotionBox>
  );
}

