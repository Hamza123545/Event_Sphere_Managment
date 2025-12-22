/**
 * ExpoEvent Model
 * Represents a trade show or expo with complete details
 * Implements FR-008, FR-009 (Organizer creates and manages expo events)
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IExpoEvent extends Document {
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  organizer: ObjectId; // Reference to User
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  floorPlan?: ObjectId; // Reference to FloorPlan
  createdAt: Date;
  updatedAt: Date;
}

const ExpoEventSchema = new Schema<IExpoEvent>(
  {
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
      maxlength: 5000,
    },
    theme: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
        validate: {
          validator: function (_v: Date) {
            // Allow dates in the past for draft expos (flexibility for editing)
            return true;
          },
          message: 'Invalid start date',
        },
      },
      endDate: {
        type: Date,
        required: true,
        validate: {
          validator: function (this: IExpoEvent, v: Date) {
            return v > this.dateRange.startDate;
          },
          message: 'End date must be after start date',
        },
      },
    },
    location: {
      venueName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      zipCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    floorPlan: {
      type: Schema.Types.ObjectId,
      ref: 'FloorPlan',
    },
  },
  baseSchemaOptions as any
);

// Indexes for performance
ExpoEventSchema.index({ organizer: 1, status: 1 });
ExpoEventSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
ExpoEventSchema.index({ 'location.city': 1, 'location.country': 1 });

// Pre-save hook to validate organizer role (optional - can be done in service layer for better error handling)
ExpoEventSchema.pre('save', async function (this: IExpoEvent, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.isNew && this.organizer) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.organizer);
      if (!user || ((user as any).role !== 'organizer' && (user as any).role !== 'admin')) {
        return next(new Error('Organizer must have organizer or admin role'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Export the model
export const ExpoEvent = mongoose.model<IExpoEvent>('ExpoEvent', ExpoEventSchema);

