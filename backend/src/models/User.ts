/**
 * User Model
 * Represents all platform users with role-based differentiation (Admin/Organizer, Exhibitor, Attendee)
 * Implements FR-001, FR-002, FR-004, FR-007 (Authentication, Password security, GDPR compliance)
 */

import mongoose, { Schema, Document } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin' | 'organizer' | 'exhibitor' | 'attendee';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  gdprConsent: {
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
        message: 'Invalid email format',
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash in queries
    },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'exhibitor', 'attendee'],
      required: true,
      index: true,
    },
    profile: {
      firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
      },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: (v: string) => !v || /^\+?[\d\s\-()]+$/.test(v),
          message: 'Invalid phone number format',
        },
      },
      avatar: {
        type: String, // URL or file path
        validate: {
          validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
          message: 'Avatar must be a valid URL',
        },
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    gdprConsent: {
      marketingConsent: {
        type: Boolean,
        default: false,
      },
      dataProcessingConsent: {
        type: Boolean,
        required: true,
      },
      consentDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    lastLogin: Date,
  },
  baseSchemaOptions as any
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });

// Export the model
export const User = mongoose.model<IUser>('User', UserSchema);

