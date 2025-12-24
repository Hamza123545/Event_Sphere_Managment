/**
 * Session Model
 * Represents scheduled event activities (workshops, sessions)
 * Implements FR-010, FR-015
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface ISession extends Document {
  expo: ObjectId;
  title: string;
  description: string;
  speakers: {
    name: string;
    title?: string;
    bio?: string;
  }[];
  schedule: {
    startTime: Date;
    endTime: Date;
    duration: number; // minutes
  };
  location: {
    room: string;
    building?: string;
  };
  capacity: number;
  currentAttendees: number;
  topic: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    expo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    speakers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
        },
        bio: {
          type: String,
          trim: true,
          maxlength: 500,
        },
      },
    ],
    schedule: {
      startTime: {
        type: Date,
        required: true,
        index: true,
      },
      endTime: {
        type: Date,
        required: true,
        validate: {
          validator: function (this: ISession, v: Date) {
            return v > this.schedule.startTime;
          },
          message: 'End time must be after start time',
        },
      },
      duration: {
        type: Number,
        required: true,
        min: 15,
        max: 480, // 8 hours max
      },
    },
    location: {
      room: {
        type: String,
        required: true,
        trim: true,
      },
      building: {
        type: String,
        trim: true,
      },
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    currentAttendees: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (this: ISession, v: number) {
          return v <= this.capacity;
        },
        message: 'Current attendees cannot exceed capacity',
      },
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  baseSchemaOptions as any
);

// Indexes for performance
SessionSchema.index({ expo: 1, 'schedule.startTime': 1 });
SessionSchema.index({ expo: 1, category: 1 });
SessionSchema.index({ topic: 1 });

// Pre-save hook to calculate duration
SessionSchema.pre('save', function (next) {
  if (this.schedule.startTime && this.schedule.endTime) {
    const durationMs = this.schedule.endTime.getTime() - this.schedule.startTime.getTime();
    this.schedule.duration = Math.round(durationMs / 60000); // Convert to minutes
  }
  next();
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);

