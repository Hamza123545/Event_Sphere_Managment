/**
 * Messaging Service
 * Handles message sending, retrieval, and read status updates
 * Implements FR-023, FR-024, T162, T165, T166
 */

import { Message } from '../models/Message';
import { User } from '../models/User';
import { ExpoEvent } from '../models/ExpoEvent';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToUser } from './realtime';

export interface SendMessageInput {
  recipientId: string;
  subject?: string;
  content: string;
  context: 'general-inquiry' | 'exhibitor-collaboration' | 'support-request' | 'organizer-communication';
  relatedExpoId?: string;
}

export interface MessageDetail {
  messageId: string;
  sender: {
    userId: string;
    name: string;
    role: string;
  };
  recipient: {
    userId: string;
    name: string;
  };
  subject?: string;
  content: string;
  context: string;
  relatedExpo?: {
    expoId: string;
    title: string;
  };
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
}

/**
 * Send a message from one user to another
 * Implements T162, T165, T166
 */
export async function sendMessage(
  senderId: string,
  input: SendMessageInput
): Promise<MessageDetail> {
  try {
    // Verify sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new CustomError('Sender not found', 404, 'USER_NOT_FOUND');
    }

    // Verify recipient exists and is accessible
    const recipient = await User.findById(input.recipientId);
    if (!recipient) {
      throw new CustomError('Recipient not found', 404, 'RECIPIENT_NOT_FOUND');
    }

    // Cannot send message to yourself
    if (senderId === input.recipientId) {
      throw new CustomError('Cannot send message to yourself', 400, 'INVALID_RECIPIENT');
    }

    // Verify related expo exists if provided
    let relatedExpo = null;
    if (input.relatedExpoId) {
      relatedExpo = await ExpoEvent.findById(input.relatedExpoId);
      if (!relatedExpo) {
        throw new CustomError('Related expo not found', 404, 'EXPO_NOT_FOUND');
      }
    }

    // Create message
    const message = new Message({
      sender: senderId,
      recipient: input.recipientId,
      subject: input.subject,
      content: input.content,
      context: input.context,
      relatedExpo: input.relatedExpoId,
      timestamp: new Date(),
      isRead: false,
    });

    await message.save();

    // Populate references for response
    await message.populate('sender', 'email profile.firstName profile.lastName role');
    await message.populate('recipient', 'email profile.firstName profile.lastName');
    if (relatedExpo) {
      await message.populate('relatedExpo', 'title');
    }

    // Send email notification (optional, based on user preferences) (T165)
    try {
      // TODO: Check user preferences for email notifications
      // For now, we'll send email notifications
      const recipientUser = await User.findById(input.recipientId);
      if (recipientUser) {
        // Email notification would be sent here if email service is configured
        // await emailService.sendMessageNotification({ ... });
        logger.debug('Message email notification would be sent', {
          recipientEmail: recipientUser.email,
          messageId: message._id.toString(),
        });
      }
    } catch (emailError) {
      logger.warn('Failed to send message email notification', { error: emailError });
      // Don't fail the message send if email fails
    }

    // Broadcast real-time notification to recipient (if WebSocket is connected)
    try {
      broadcastToUser(input.recipientId, 'new-message', {
        type: 'new-message',
        messageId: message._id.toString(),
        sender: {
          userId: senderId,
          name: `${sender.profile.firstName} ${sender.profile.lastName}`,
          role: sender.role,
        },
        subject: input.subject,
        preview: input.content.substring(0, 100),
        timestamp: message.timestamp.toISOString(),
      });
    } catch (broadcastError) {
      logger.warn('Failed to broadcast message notification', { error: broadcastError });
      // Don't fail the message send if broadcast fails
    }

    // Audit logging (T166)
    logger.info('Message sent successfully', {
      action: 'send_message',
      messageId: message._id.toString(),
      senderId,
      recipientId: input.recipientId,
      context: input.context,
      relatedExpoId: input.relatedExpoId,
      contentLength: input.content.length,
      timestamp: new Date().toISOString(),
    });

    // Content moderation check (T166)
    // Basic profanity/spam detection could be added here
    const suspiciousKeywords = ['spam', 'scam', 'phishing']; // Example keywords
    const contentLower = input.content.toLowerCase();
    const hasSuspiciousContent = suspiciousKeywords.some((keyword) => contentLower.includes(keyword));

    if (hasSuspiciousContent) {
      logger.warn('Message flagged for content moderation review', {
        messageId: message._id.toString(),
        senderId,
        flaggedKeywords: suspiciousKeywords.filter((keyword) => contentLower.includes(keyword)),
      });
    }

    return formatMessage(message as any);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in sendMessage service:', error);
    throw new CustomError('Failed to send message', 500, 'SEND_MESSAGE_ERROR');
  }
}

/**
 * Get messages for a user (inbox or sent) with pagination
 * Implements T162, T237
 */
export async function getMessages(
  userId: string,
  options?: {
    type?: 'inbox' | 'sent';
    context?: string;
    relatedExpoId?: string;
    page?: number;
    limit?: number;
    conversationWith?: string; // Get messages between current user and this user
    beforeTimestamp?: string; // Get messages before this timestamp (for pagination)
  }
): Promise<{
  messages: MessageDetail[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}> {
  try {
    const limit = Math.min(options?.limit || 20, 100); // Max 100 items per page, default 20
    const page = options?.page || 1;
    // Only use skip if beforeTimestamp is not provided (for cursor-based pagination)
    const skip = options?.beforeTimestamp ? 0 : (page - 1) * limit;

    let query: any = {};

    // If conversationWith is provided, get messages between current user and that user
    if (options?.conversationWith) {
      query.$or = [
        { sender: userId, recipient: options.conversationWith },
        { sender: options.conversationWith, recipient: userId },
      ];
    } else if (options?.type === 'inbox') {
      query.recipient = userId;
    } else {
      query.sender = userId;
    }

    // If beforeTimestamp is provided, get messages before that timestamp (for infinite scroll)
    if (options?.beforeTimestamp) {
      query.timestamp = { $lt: new Date(options.beforeTimestamp) };
    }

    if (options?.context) {
      query.context = options.context;
    }

    if (options?.relatedExpoId) {
      query.relatedExpo = options.relatedExpoId;
    }

    // Get total count for pagination (only if not using cursor-based pagination)
    const totalItems = options?.beforeTimestamp 
      ? await Message.countDocuments(query) // Approximate count for cursor-based
      : await Message.countDocuments(query);

    const messages = await Message.find(query)
      .populate('sender', 'email profile.firstName profile.lastName role')
      .populate('recipient', 'email profile.firstName profile.lastName')
      .populate('relatedExpo', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      messages: messages.map((msg) => formatMessage(msg as any)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    logger.error('Error in getMessages service:', error);
    throw new CustomError('Failed to retrieve messages', 500, 'GET_MESSAGES_ERROR');
  }
}

/**
 * Mark message as read
 * Implements T162
 */
export async function markAsRead(messageId: string, userId: string): Promise<MessageDetail> {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Only recipient can mark as read
    if (message.recipient.toString() !== userId) {
      throw new CustomError('You can only mark your own messages as read', 403, 'FORBIDDEN');
    }

    // Only mark as read if not already read
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    // Populate for response
    await message.populate('sender', 'email profile.firstName profile.lastName role');
    await message.populate('recipient', 'email profile.firstName profile.lastName');
    if (message.relatedExpo) {
      await message.populate('relatedExpo', 'title');
    }

    // Audit logging (T166)
    logger.info('Message marked as read', {
      action: 'mark_message_read',
      messageId: message._id.toString(),
      userId,
      readAt: message.readAt?.toISOString(),
    });

    return formatMessage(message as any);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in markAsRead service:', error);
    throw new CustomError('Failed to mark message as read', 500, 'MARK_READ_ERROR');
  }
}

/**
 * Get unread message count for a user
 * Implements T162
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return count;
  } catch (error) {
    logger.error('Error in getUnreadCount service:', error);
    throw new CustomError('Failed to get unread count', 500, 'GET_UNREAD_COUNT_ERROR');
  }
}

/**
 * Format message document to MessageDetail
 */
function formatMessage(message: any): MessageDetail {
  return {
    messageId: message._id.toString(),
    sender: {
      userId: message.sender._id ? message.sender._id.toString() : message.sender.toString(),
      name: message.sender.profile
        ? `${message.sender.profile.firstName || ''} ${message.sender.profile.lastName || ''}`.trim() ||
          message.sender.email
        : message.sender.email || 'Unknown',
      role: message.sender.role || 'user',
    },
    recipient: {
      userId: message.recipient._id ? message.recipient._id.toString() : message.recipient.toString(),
      name: message.recipient.profile
        ? `${message.recipient.profile.firstName || ''} ${message.recipient.profile.lastName || ''}`.trim() ||
          message.recipient.email
        : message.recipient.email || 'Unknown',
    },
    subject: message.subject,
    content: message.content,
    context: message.context,
    relatedExpo: message.relatedExpo
      ? {
          expoId: message.relatedExpo._id ? message.relatedExpo._id.toString() : message.relatedExpo.toString(),
          title: message.relatedExpo.title || 'Unknown Expo',
        }
      : undefined,
    timestamp: message.timestamp,
    isRead: message.isRead,
    readAt: message.readAt,
  };
}

