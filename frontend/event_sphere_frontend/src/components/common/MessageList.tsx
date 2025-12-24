/**
 * MessageList Component
 * Displays list of messages sorted by timestamp with read/unread indicators
 * Implements T171
 */

import { List, ListItem, ListItemButton, ListItemText, Chip, Avatar, Box, Typography, Divider } from '@mui/material';
import { Email, Draft, CheckCircle } from '@mui/icons-material';
import type { Message } from '../../types/messaging';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
  selectedMessageId?: string;
  isLoading?: boolean;
}

export default function MessageList({ messages, onMessageClick, selectedMessageId, isLoading = false }: MessageListProps) {
  const getContextColor = (context: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' => {
    switch (context) {
      case 'exhibitor-collaboration':
        return 'primary';
      case 'support-request':
        return 'warning';
      case 'organizer-communication':
        return 'secondary';
      default:
        return 'default';
    }
  };

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

  if (messages.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No messages found
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {messages.map((message, index) => (
        <Box key={message.messageId}>
          <ListItem
            disablePadding
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={message.context.replace('-', ' ')}
                  size="small"
                  color={getContextColor(message.context)}
                  variant="outlined"
                />
                {message.isRead && (
                  <CheckCircle fontSize="small" color="action" sx={{ fontSize: 16 }} />
                )}
              </Box>
            }
          >
            <ListItemButton
              selected={selectedMessageId === message.messageId}
              onClick={() => onMessageClick(message)}
              sx={{
                py: 1.5,
                borderLeft: selectedMessageId === message.messageId ? '3px solid' : 'none',
                borderColor: 'primary.main',
                bgcolor: selectedMessageId === message.messageId ? 'action.selected' : 'transparent',
              }}
            >
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: message.isRead ? 'action.disabledBackground' : 'primary.main',
                  width: 40,
                  height: 40,
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
                        fontWeight: message.isRead ? 'normal' : 'bold',
                        flex: 1,
                      }}
                    >
                      {message.sender.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
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
                          fontWeight: message.isRead ? 'normal' : 'medium',
                          mb: 0.5,
                        }}
                      >
                        {message.subject}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
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
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    ml: 1,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
          {index < messages.length - 1 && <Divider />}
        </Box>
      ))}
    </List>
  );
}

