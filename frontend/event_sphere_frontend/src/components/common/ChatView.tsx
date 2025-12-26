/**
 * ChatView Component
 * WhatsApp-like chat interface for messaging
 * Shows conversation thread with messages and input at bottom
 * Implements pagination with infinite scroll - loads 15 messages initially, then 15 more when scrolling to top
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types/messaging';
import { useAuthStore } from '../../stores/authStore';
import { getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';
import { getConversationMessages } from '../../services/messagingApi';
import { getSocket, onSocketEvent, offSocketEvent } from '../../services/socket';
import type { NewMessageEvent } from '../../types/messaging';

interface ChatViewProps {
  otherUser: {
    userId: string;
    name: string;
    role?: string;
  };
  onSendMessage: (content: string) => Promise<void>;
  role: 'exhibitor' | 'attendee';
}

export default function ChatView({ otherUser, onSendMessage, role }: ChatViewProps) {
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const activeTheme = getActiveTheme(mode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  // Load initial messages (15 most recent)
  useEffect(() => {
    const loadInitialMessages = async () => {
      setLoading(true);
      try {
        const result = await getConversationMessages(otherUser.userId, role, { limit: 15 });
        setMessages(result.messages);
        setHasMore(result.hasMore);
        isInitialLoadRef.current = true;
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialMessages();
  }, [otherUser.userId, role]);

  // Auto-scroll to bottom on initial load or when new message is sent
  useEffect(() => {
    if (isInitialLoadRef.current || sending) {
      setTimeout(() => {
        scrollToBottom();
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [messages.length, sending]);

  // Listen for new messages via socket
  useEffect(() => {
    const handleNewMessage = async (data: unknown) => {
      const event = data as NewMessageEvent;
      // Only reload if the message is from or to the current conversation
      const isFromConversation = 
        event.sender.userId === otherUser.userId || 
        (user?.userId && event.sender.userId === user.userId);
      
      if (isFromConversation) {
        // Reload the latest messages
        const result = await getConversationMessages(otherUser.userId, role, { limit: 15 });
        setMessages(result.messages);
        setHasMore(result.hasMore);
      }
    };

    const socket = getSocket();
    if (socket) {
      onSocketEvent('new-message', handleNewMessage);
      return () => {
        offSocketEvent('new-message', handleNewMessage);
      };
    }
    return undefined;
  }, [otherUser.userId, role, user?.userId]);

  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      // Get the oldest message timestamp to load messages before it
      const oldestMessage = messages[0];
      const beforeTimestamp = oldestMessage.timestamp;

      // Save current scroll position
      const container = chatContainerRef.current;
      if (container) {
        scrollPositionRef.current = container.scrollHeight - container.scrollTop;
      }

      const result = await getConversationMessages(otherUser.userId, role, {
        limit: 15,
        beforeTimestamp,
      });

      if (result.messages.length > 0) {
        // Prepend older messages to the beginning
        setMessages((prev) => [...result.messages, ...prev]);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }

      // Restore scroll position after loading
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollPositionRef.current;
        }
      }, 50);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, otherUser.userId, role]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || loadingMore || !hasMore) return;

    const container = chatContainerRef.current;
    const scrollTop = container.scrollTop;
    
    // If scrolled near the top (within 100px), load more messages
    if (scrollTop < 100) {
      loadMoreMessages();
    }
  }, [loadingMore, hasMore, loadMoreMessages]);

  // Attach scroll listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
    return undefined;
  }, [handleScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await onSendMessage(content);
      // Reload messages to get the latest (including the one we just sent)
      const result = await getConversationMessages(otherUser.userId, role, { limit: 15 });
      setMessages(result.messages);
      setHasMore(result.hasMore);
    } catch {
      // Error handled by parent
      setMessageText(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: activeTheme.bg,
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: `1px solid ${activeTheme.border}`,
          bgcolor: activeTheme.surface,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: activeTheme.accent,
            width: 48,
            height: 48,
            border: `2px solid ${activeTheme.accentGlow}`,
            fontWeight: 700,
          }}
        >
          {getInitials(otherUser.name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
            {otherUser.name}
          </Typography>
          {otherUser.role && (
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              {otherUser.role}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Messages Container */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: activeTheme.bg,
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: activeTheme.surface,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: activeTheme.border,
            borderRadius: '4px',
            '&:hover': {
              bgcolor: activeTheme.textSecondary,
            },
          },
        }}
      >
        {/* Loading More Indicator */}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: activeTheme.accent }} />
          </Box>
        )}

        {/* Loading State */}
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress sx={{ color: activeTheme.accent }} />
          </Box>
        ) : (
          <AnimatePresence>
          {sortedMessages.map((message, index) => {
            const isOwnMessage = message.sender.userId === user?.userId;
            const showAvatar = index === 0 || sortedMessages[index - 1].sender.userId !== message.sender.userId;

            return (
              <motion.div
                key={message.messageId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {!isOwnMessage && showAvatar && (
                  <Avatar
                    sx={{
                      bgcolor: activeTheme.accent,
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      mb: 0.5,
                    }}
                  >
                    {getInitials(message.sender.name)}
                  </Avatar>
                )}
                {!isOwnMessage && !showAvatar && <Box sx={{ width: 32 }} />}

                <Box
                  sx={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  {!isOwnMessage && showAvatar && (
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, px: 1, fontWeight: 600 }}>
                      {message.sender.name}
                    </Typography>
                  )}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: isOwnMessage ? activeTheme.accent : activeTheme.surface,
                      color: isOwnMessage ? '#fff' : activeTheme.textPrimary,
                      borderRadius: 2,
                      border: `1px solid ${isOwnMessage ? activeTheme.accentGlow : activeTheme.border}`,
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {message.content}
                    </Typography>
                  </Paper>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      gap: 1,
                      px: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontSize: '0.7rem' }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                    {isOwnMessage && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {message.isRead ? (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: activeTheme.success,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: activeTheme.textSecondary,
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                {isOwnMessage && <Box sx={{ width: 32 }} />}
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderTop: `1px solid ${activeTheme.border}`,
          bgcolor: activeTheme.surface,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <IconButton
            size="small"
            sx={{
              color: activeTheme.textSecondary,
              '&:hover': { bgcolor: activeTheme.surfaceLight },
            }}
          >
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending || loading}
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
                '&.Mui-focused fieldset': {
                  borderColor: activeTheme.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: activeTheme.textSecondary,
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!messageText.trim() || sending || loading}
            sx={{
              bgcolor: activeTheme.accent,
              color: '#fff',
              '&:hover': {
                bgcolor: activeTheme.accentGlow,
              },
              '&:disabled': {
                bgcolor: activeTheme.surfaceLight,
                color: activeTheme.textSecondary,
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}

