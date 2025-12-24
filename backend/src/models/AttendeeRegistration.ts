/**
 * Attendee Registration Model
 * Represents attendee sign-ups for expos
 * Implements FR-014
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IAttendeeRegistration extends Document {
  user: ObjectId;
  expo: ObjectId;
  registrationDate: Date;
  attendanceStatus: 'registered' | 'checked-in' | 'no-show';
  preferences: {
    interests: string[];
    dietaryRestrictions?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeRegistrationSchema = new Schema<IAttendeeRegistration>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
      required: true,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['registered', 'checked-in', 'no-show'],
      default: 'registered',
      index: true,
    },
    preferences: {
      interests: {
        type: [String],
        default: [],
      },
      dietaryRestrictions: {
        type: [String],
        default: [],
      },
    },
  },
  baseSchemaOptions as any
);

// Compound index to ensure one registration per user per expo
AttendeeRegistrationSchema.index({ user: 1, expo: 1 }, { unique: true });
AttendeeRegistrationSchema.index({ expo: 1, attendanceStatus: 1 });

export const AttendeeRegistration = mongoose.model<IAttendeeRegistration>(
  'AttendeeRegistration',
  AttendeeRegistrationSchema
);

