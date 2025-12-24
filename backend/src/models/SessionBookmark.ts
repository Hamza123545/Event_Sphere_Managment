/**
 * Session Bookmark Model
 * Represents attendee bookmarks for sessions with reminder preferences
 * Implements FR-015, FR-016
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface ISessionBookmark extends Document {
  user: ObjectId;
  session: ObjectId;
  bookmarkDate: Date;
  reminderPreferences: {
    enabled: boolean;
    reminderTime?: number; // minutes before session start (5-1440)
    channels?: ('email' | 'in-app')[];
  };
  attended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionBookmarkSchema = new Schema<ISessionBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    bookmarkDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reminderPreferences: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: Number,
        default: 60,
        min: 5,
        max: 1440, // 24 hours in minutes
      },
      channels: {
        type: [String],
        enum: ['email', 'in-app'],
        default: ['email', 'in-app'],
      },
    },
    attended: {
      type: Boolean,
    },
  },
  baseSchemaOptions as any
);

// Compound index to ensure one bookmark per user per session
SessionBookmarkSchema.index({ user: 1, session: 1 }, { unique: true });
SessionBookmarkSchema.index({ user: 1, bookmarkDate: 1 });

export const SessionBookmark = mongoose.model<ISessionBookmark>(
  'SessionBookmark',
  SessionBookmarkSchema
);

