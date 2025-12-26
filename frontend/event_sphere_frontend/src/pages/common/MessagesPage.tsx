/**
 * MessagesPage Component
 * WhatsApp-like messaging interface with conversation grouping
 * Displays messages list, compose button, unread badge, filter by context
 * Implements T170
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import { Add, Inbox, Send } from '@mui/icons-material';
import { useMessagingStore } from '../../stores/messagingStore';
import { useAuthStore } from '../../stores/authStore';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  PageContainer,
  BackgroundGlows,
  GlassContainer,
  GlassCard,
  ActionButton,
  getActiveTheme,
  MotionBox,
} from '../../theme/designSystem';
import ChatView from '../../components/common/ChatView';
import ComposeMessage from '../../components/common/ComposeMessage';
import type { Message, SendMessageRequest } from '../../types/messaging';
import { useThemeStore } from '../../stores/themeStore';

interface Conversation {
  otherUser: {
    userId: string;
    name: string;
    role?: string;
  };
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const {
    messages,
    inboxMessages,
    sentMessages,
    unreadCount,
    isLoading,
    error,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    clearError,
    subscribeToMessageUpdates,
    unsubscribeFromMessageUpdates,
    newMessageNotification,
    clearNewMessageNotification,
  } = useMessagingStore();
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const activeTheme = getActiveTheme(mode);

  const [tabValue, setTabValue] = useState(0);
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const role = user?.role === 'attendee' ? 'attendee' : 'exhibitor';

  // Load messages on mount - load both inbox and sent for conversation grouping
  useEffect(() => {
    const loadMessages = async () => {
      // Load both inbox and sent messages for conversation grouping
      await Promise.all([
        getMessages({
          type: 'inbox',
          context: contextFilter !== 'all' ? contextFilter : undefined,
        }),
        getMessages({
          type: 'sent',
          context: contextFilter !== 'all' ? contextFilter : undefined,
        }),
      ]);
      await getUnreadCount(role);
    };
    loadMessages();
  }, [contextFilter, getMessages, getUnreadCount, role]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user?.userId) {
      subscribeToMessageUpdates(user.userId);
      return () => {
        unsubscribeFromMessageUpdates();
      };
    }
    return undefined;
  }, [user?.userId, subscribeToMessageUpdates, unsubscribeFromMessageUpdates]);

  // Group messages by conversation (other user)
  const conversations = useMemo(() => {
    if (!user?.userId) return [];

    const allMessages = [...inboxMessages, ...sentMessages];
    const conversationMap = new Map<string, Conversation>();
    const currentUserId = String(user.userId);

    allMessages.forEach((message) => {
      // Convert IDs to strings for reliable comparison
      const senderId = String(message.sender.userId);
      const recipientId = String(message.recipient.userId);
      
      // Determine the other user in the conversation
      const otherUserId = senderId === currentUserId 
        ? recipientId 
        : senderId;
      const otherUserName = senderId === currentUserId 
        ? message.recipient.name 
        : message.sender.name;
      const otherUserRole = senderId === currentUserId 
        ? undefined 
        : message.sender.role;

      const key = otherUserId;
      
      // Safety check: skip if other user is the current user (shouldn't happen, but just in case)
      if (otherUserId === currentUserId) {
        console.warn('Skipping message where other user matches current user', message);
        return;
      }

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          otherUser: {
            userId: otherUserId,
            name: otherUserName,
            role: otherUserRole,
          },
          messages: [],
          lastMessage: message,
          unreadCount: 0,
        });
      }

      const conversation = conversationMap.get(key)!;
      conversation.messages.push(message);

      // Update last message if this one is newer
      if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = message;
      }

      // Count unread messages (only for messages sent to current user)
      if (String(message.recipient.userId) === currentUserId && !message.isRead) {
        conversation.unreadCount++;
      }
    });

    // Sort conversations by last message timestamp
    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }, [inboxMessages, sentMessages, user]);

  // Update selected conversation when messages change
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      // Find the updated conversation
      const updatedConversation = conversations.find(
        (conv) => conv.otherUser.userId === selectedConversation.otherUser.userId
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedConversation(null);
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark all unread messages in this conversation as read
    conversation.messages
      .filter((msg) => msg.recipient.userId === user?.userId && !msg.isRead)
      .forEach((msg) => {
        markAsRead(msg.messageId, role).catch(() => {
          // Error handled by store
        });
      });
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !user?.userId) return;

    // Ensure we're not sending to ourselves - convert to strings for reliable comparison
    const recipientId = String(selectedConversation.otherUser.userId);
    const currentUserId = String(user.userId);
    
    if (recipientId === currentUserId) {
      console.error('Cannot send message to yourself. Recipient ID matches current user ID.', {
        recipientId,
        currentUserId,
      });
      return;
    }

    const data: SendMessageRequest = {
      recipientId,
      content,
      context: 'general-inquiry', // Default context, can be enhanced
    };

    try {
      await sendMessage(data, role);
      
      // Refresh messages after sending - load both inbox and sent
      await Promise.all([
        getMessages({
          type: 'inbox',
          context: contextFilter !== 'all' ? contextFilter : undefined,
        }),
        getMessages({
          type: 'sent',
          context: contextFilter !== 'all' ? contextFilter : undefined,
        }),
      ]);
    } catch (err) {
      // Error is handled by the store and displayed in the error alert
      console.error('Error sending message:', err);
    }
  };

  const getFilteredConversations = () => {
    if (contextFilter === 'all') return conversations;
    return conversations.filter((conv) => 
      conv.messages.some((msg) => msg.context === contextFilter)
    );
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar />
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px' }}>
            Messages
          </Typography>
          <ActionButton primary startIcon={<Add />} onClick={() => setComposeOpen(true)}>
            Compose
          </ActionButton>
        </MotionBox>

        {/* Error Alert */}
        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {/* New Message Notification */}
        {newMessageNotification && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            onClose={clearNewMessageNotification}
            action={
              <ActionButton size="small" onClick={() => getMessages({ type: 'inbox' })}>
                View
              </ActionButton>
            }
          >
            <Typography variant="subtitle2">New message from {newMessageNotification.message.sender.name}</Typography>
            <Typography variant="body2">{newMessageNotification.preview}</Typography>
          </Alert>
        )}

        {/* Tabs and Filters */}
        <GlassContainer sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: `1px solid ${activeTheme.border}` }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: activeTheme.textSecondary,
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: activeTheme.accent,
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: activeTheme.accent,
                },
              }}
            >
              <Tab
                label={
                  <Badge badgeContent={tabValue === 0 ? unreadCount : 0} color="primary">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inbox />
                      Inbox
                    </Box>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Send />
                    Sent
                  </Box>
                }
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: activeTheme.textSecondary }}>Filter by Context</InputLabel>
              <Select
                value={contextFilter}
                label="Filter by Context"
                onChange={(e) => setContextFilter(e.target.value)}
                sx={{
                  bgcolor: activeTheme.surface,
                  color: activeTheme.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeTheme.border,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeTheme.accent,
                  },
                }}
              >
                <MenuItem value="all">All Contexts</MenuItem>
                <MenuItem value="general-inquiry">General Inquiry</MenuItem>
                <MenuItem value="exhibitor-collaboration">Exhibitor Collaboration</MenuItem>
                <MenuItem value="support-request">Support Request</MenuItem>
                <MenuItem value="organizer-communication">Organizer Communication</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </GlassContainer>

        {/* Loading Spinner */}
        {isLoading && !messages.length && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        )}

        {/* Messages Grid - WhatsApp-like Layout */}
        {!isLoading && (
          <Grid container spacing={3} sx={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
            {/* Conversations List */}
            <Grid item xs={12} md={selectedConversation ? 4 : 12}>
              <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${activeTheme.border}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
                    Conversations
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {getFilteredConversations().length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
                        No conversations found
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {getFilteredConversations().map((conversation, index) => (
                        <Box key={conversation.otherUser.userId}>
                          <ListItem disablePadding>
                            <ListItemButton
                              selected={selectedConversation?.otherUser.userId === conversation.otherUser.userId}
                              onClick={() => handleConversationClick(conversation)}
                              sx={{
                                py: 2,
                                px: 2,
                                bgcolor: selectedConversation?.otherUser.userId === conversation.otherUser.userId 
                                  ? activeTheme.surface 
                                  : 'transparent',
                                '&:hover': {
                                  bgcolor: activeTheme.surfaceLight,
                                },
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar
                                  sx={{
                                    bgcolor: activeTheme.accent,
                                    width: 48,
                                    height: 48,
                                    border: `2px solid ${activeTheme.accentGlow}`,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(conversation.otherUser.name)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography
                                    component="div"
                                    variant="subtitle2"
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontWeight: conversation.unreadCount > 0 ? 800 : 600,
                                      color: activeTheme.textPrimary,
                                    }}
                                  >
                                    <span>{conversation.otherUser.name}</span>
                                    <Typography component="span" variant="caption" sx={{ color: activeTheme.textSecondary }}>
                                      {formatTime(conversation.lastMessage.timestamp)}
                                    </Typography>
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    component="div"
                                    variant="body2"
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mt: 0.5,
                                      color: activeTheme.textSecondary,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                                    }}
                                  >
                                    <span
                                      style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                      }}
                                    >
                                      {conversation.lastMessage.content.substring(0, 50)}
                                      {conversation.lastMessage.content.length > 50 ? '...' : ''}
                                    </span>
                                    {conversation.unreadCount > 0 && (
                                      <Badge
                                        badgeContent={conversation.unreadCount}
                                        color="primary"
                                        sx={{
                                          ml: 1,
                                          '& .MuiBadge-badge': {
                                            bgcolor: activeTheme.accent,
                                          },
                                        }}
                                      />
                                    )}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                          {index < getFilteredConversations().length - 1 && (
                            <Divider sx={{ borderColor: activeTheme.border }} />
                          )}
                        </Box>
                      ))}
                    </List>
                  )}
                </Box>
              </GlassCard>
            </Grid>

            {/* Chat View */}
            {selectedConversation && (
              <Grid item xs={12} md={8}>
                <GlassCard sx={{ height: '100%', p: 0 }}>
                  <ChatView
                    otherUser={selectedConversation.otherUser}
                    onSendMessage={handleSendMessage}
                    role={role}
                  />
                </GlassCard>
              </Grid>
            )}
          </Grid>
        )}

        {/* Compose Message Dialog */}
        <ComposeMessage
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onSubmit={async (data: SendMessageRequest) => {
            // Ensure we're not sending to ourselves - convert to strings for reliable comparison
            if (!user?.userId) return;
            
            const recipientId = String(data.recipientId);
            const currentUserId = String(user.userId);
            
            if (recipientId === currentUserId) {
              console.error('Cannot send message to yourself. Recipient ID matches current user ID.', {
                recipientId,
                currentUserId,
              });
              return;
            }

            try {
              await sendMessage(data, role);
              // Refresh messages after sending - load both inbox and sent
              await Promise.all([
                getMessages({
                  type: 'inbox',
                  context: contextFilter !== 'all' ? contextFilter : undefined,
                }),
                getMessages({
                  type: 'sent',
                  context: contextFilter !== 'all' ? contextFilter : undefined,
                }),
              ]);
              setComposeOpen(false);
            } catch (err) {
              // Error is handled by the store and displayed in the error alert
              console.error('Error sending message:', err);
            }
          }}
          isLoading={isLoading}
        />
      </Box>
    </PageContainer>
  );
}

