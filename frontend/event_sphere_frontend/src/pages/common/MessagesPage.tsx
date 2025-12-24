/**
 * MessagesPage Component
 * Displays messages list, compose button, unread badge, filter by context
 * Implements T170
 */

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Badge,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
} from '@mui/material';
import { Add, Inbox, Send } from '@mui/icons-material';
import { useMessagingStore } from '../../stores/messagingStore';
import { useAuthStore } from '../../stores/authStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import MessageList from '../../components/common/MessageList';
import MessageThread from '../../components/common/MessageThread';
import ComposeMessage from '../../components/common/ComposeMessage';
import type { Message, SendMessageRequest } from '../../types/messaging';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`messages-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MessagesPage() {
  const {
    messages,
    inboxMessages,
    sentMessages,
    unreadCount,
    selectedMessage,
    isLoading,
    error,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    setSelectedMessage,
    clearError,
    subscribeToMessageUpdates,
    unsubscribeFromMessageUpdates,
    newMessageNotification,
    clearNewMessageNotification,
  } = useMessagingStore();
  const { user } = useAuthStore();

  const [tabValue, setTabValue] = useState(0);
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [availableRecipients, setAvailableRecipients] = useState<Array<{ userId: string; name: string; role: string }>>(
    []
  );

  const role = user?.role === 'attendee' ? 'attendee' : 'exhibitor';

  // Load messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      const type = tabValue === 0 ? 'inbox' : 'sent';
      await getMessages({
        type,
        context: contextFilter !== 'all' ? contextFilter : undefined,
      });
      await getUnreadCount(role);
    };
    loadMessages();
  }, [tabValue, contextFilter, getMessages, getUnreadCount, role]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user?.userId) {
      subscribeToMessageUpdates(user.userId);
      return () => {
        unsubscribeFromMessageUpdates();
      };
    }
  }, [user?.userId, subscribeToMessageUpdates, unsubscribeFromMessageUpdates]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedMessage(null);
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    // Mark as read if viewing inbox message
    if (tabValue === 0 && !message.isRead) {
      try {
        await markAsRead(message.messageId, role);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleSendMessage = async (data: SendMessageRequest) => {
    await sendMessage(data, role);
    // Refresh messages after sending
    const type = tabValue === 0 ? 'inbox' : 'sent';
    await getMessages({
      type,
      context: contextFilter !== 'all' ? contextFilter : undefined,
    });
    setComposeOpen(false);
  };

  const getFilteredMessages = () => {
    const messagesToShow = tabValue === 0 ? inboxMessages : sentMessages;
    if (contextFilter === 'all') return messagesToShow;
    return messagesToShow.filter((msg) => msg.context === contextFilter);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Messages" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Messages
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setComposeOpen(true)}>
            Compose
          </Button>
        </Box>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={clearError} severity="error" sx={{ mb: 3 }} />}

        {/* New Message Notification */}
        {newMessageNotification && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            onClose={clearNewMessageNotification}
            action={
              <Button color="inherit" size="small" onClick={() => getMessages({ type: 'inbox' })}>
                View
              </Button>
            }
          >
            <Typography variant="subtitle2">New message from {newMessageNotification.message.sender.name}</Typography>
            <Typography variant="body2">{newMessageNotification.preview}</Typography>
          </Alert>
        )}

        {/* Tabs and Filters */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
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

          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Context</InputLabel>
              <Select
                value={contextFilter}
                label="Filter by Context"
                onChange={(e) => setContextFilter(e.target.value)}
              >
                <MenuItem value="all">All Contexts</MenuItem>
                <MenuItem value="general-inquiry">General Inquiry</MenuItem>
                <MenuItem value="exhibitor-collaboration">Exhibitor Collaboration</MenuItem>
                <MenuItem value="support-request">Support Request</MenuItem>
                <MenuItem value="organizer-communication">Organizer Communication</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Loading Spinner */}
        {isLoading && !messages.length && <LoadingSpinner />}

        {/* Messages Grid */}
        {!isLoading && (
          <Grid container spacing={3}>
            {/* Message List */}
            <Grid item xs={12} md={selectedMessage ? 5 : 12}>
              <Paper sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                <TabPanel value={tabValue} index={0}>
                  <MessageList
                    messages={getFilteredMessages()}
                    onMessageClick={handleMessageClick}
                    selectedMessageId={selectedMessage?.messageId}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <MessageList
                    messages={getFilteredMessages()}
                    onMessageClick={handleMessageClick}
                    selectedMessageId={selectedMessage?.messageId}
                  />
                </TabPanel>
              </Paper>
            </Grid>

            {/* Message Thread */}
            {selectedMessage && (
              <Grid item xs={12} md={7}>
                <Paper sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  <MessageThread message={selectedMessage} />
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Compose Message Dialog */}
        <ComposeMessage
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          availableRecipients={availableRecipients}
        />
      </Container>
    </Box>
  );
}

