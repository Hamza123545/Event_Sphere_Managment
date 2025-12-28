/**
 * MessageList Component
 * Displays list of messages sorted by timestamp with read/unread indicators
 * Implements T171
 */

import { List, ListItem, ListItemButton, ListItemText, Chip, Avatar, Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { Message } from '../../types/messaging';
import {
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
  selectedMessageId?: string;
  isLoading?: boolean;
}

export default function MessageList({ messages, onMessageClick, selectedMessageId }: MessageListProps) {

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getContextColorValue = (context: string) => {
    switch (context) {
      case 'exhibitor-collaboration':
        return activeTheme.accent;
      case 'support-request':
        return activeTheme.warning;
      case 'organizer-communication':
        return activeTheme.info;
      default:
        return activeTheme.textSecondary;
    }
  };

  if (messages.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
            No messages found
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {messages.map((message, index) => (
        <MotionBox
          key={message.messageId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlassCard sx={{ mb: 2, p: 0, overflow: 'hidden' }}>
            <ListItem
              disablePadding
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                  <Chip
                    label={message.context.replace('-', ' ')}
                    size="small"
                    sx={{
                      bgcolor: `${getContextColorValue(message.context)}20`,
                      color: getContextColorValue(message.context),
                      border: `1px solid ${getContextColorValue(message.context)}30`,
                      fontWeight: 600
                    }}
                  />
                  {message.isRead && (
                    <CheckCircle sx={{ fontSize: 18, color: activeTheme.success }} />
                  )}
                </Box>
              }
            >
              <ListItemButton
                selected={selectedMessageId === message.messageId}
                onClick={() => onMessageClick(message)}
                sx={{
                  py: 2,
                  px: 2,
                  borderLeft: selectedMessageId === message.messageId ? `4px solid ${activeTheme.accent}` : 'none',
                  bgcolor: selectedMessageId === message.messageId ? activeTheme.surface : 'transparent',
                  '&:hover': {
                    bgcolor: activeTheme.surfaceLight,
                  },
                }}
              >
                <Avatar
                  sx={{
                    mr: 2,
                    bgcolor: message.isRead ? activeTheme.surfaceLight : activeTheme.accent,
                    color: message.isRead ? activeTheme.textSecondary : activeTheme.textPrimary,
                    width: 48,
                    height: 48,
                    border: `2px solid ${message.isRead ? activeTheme.border : activeTheme.accentGlow}`,
                    fontWeight: 700
                  }}
                >
                  {getInitials(message.sender.name)}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: message.isRead ? 600 : 800,
                          flex: 1,
                          color: activeTheme.textPrimary,
                        }}
                      >
                        {message.sender.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      {message.subject && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: message.isRead ? 600 : 700,
                            mb: 0.5,
                            color: activeTheme.textPrimary,
                          }}
                        >
                          {message.subject}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: activeTheme.textSecondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.6,
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                  }
                />
                {!message.isRead && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: activeTheme.accent,
                      ml: 1,
                      boxShadow: `0 0 8px ${activeTheme.accentGlow}`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </GlassCard>
        </MotionBox>
      ))}
    </List>
  );
}

