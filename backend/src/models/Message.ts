/**
 * Message Model
 * Represents messages between users (organizers, exhibitors, attendees)
 * Implements FR-023, FR-024, T161
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IMessage extends Document {
  sender: ObjectId;
  recipient: ObjectId;
  subject?: string;
  content: string;
  context: 'general-inquiry' | 'exhibitor-collaboration' | 'support-request' | 'organizer-communication';
  relatedExpo?: ObjectId;
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
    context: {
      type: String,
      enum: ['general-inquiry', 'exhibitor-collaboration', 'support-request', 'organizer-communication'],
      required: true,
      index: true,
    },
    relatedExpo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  baseSchemaOptions as any
);

// Indexes for performance
MessageSchema.index({ recipient: 1, isRead: 1, timestamp: -1 });
MessageSchema.index({ sender: 1, timestamp: -1 });
MessageSchema.index({ relatedExpo: 1, context: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

