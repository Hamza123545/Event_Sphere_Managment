/**
 * Booth Space Model
 * Represents a physical booth location on the floor plan
 * Implements FR-012, FR-013, FR-020, FR-021
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IBoothSpace extends Document {
  floorPlan: ObjectId;
  expo: ObjectId;
  identifier: string;
  size: {
    width: number;
    height: number;
    area: number;
  };
  location: {
    x: number;
    y: number;
  };
  amenities: string[];
  priceTier?: 'standard' | 'premium' | 'deluxe';
  status: 'available' | 'reserved' | 'occupied';
  exhibitor?: ObjectId;
  reservedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BoothSpaceSchema = new Schema<IBoothSpace>(
  {
    floorPlan: {
      type: Schema.Types.ObjectId,
      ref: 'FloorPlan',
      required: true,
      index: true,
    },
    expo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
      required: true,
      index: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    size: {
      width: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
      },
      height: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
      },
      area: {
        type: Number,
      },
    },
    location: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    priceTier: {
      type: String,
      enum: ['standard', 'premium', 'deluxe'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied'],
      default: 'available',
      index: true,
    },
    exhibitor: {
      type: Schema.Types.ObjectId,
      ref: 'ExhibitorProfile',
      validate: {
        validator: function (this: IBoothSpace, v: ObjectId) {
          // Exhibitor required when status is reserved or occupied
          if (this.status === 'reserved' || this.status === 'occupied') {
            return !!v;
          }
          return true;
        },
        message: 'Exhibitor is required when booth is reserved or occupied',
      },
    },
    reservedAt: Date,
  },
  baseSchemaOptions as any
);

// Compound index to ensure unique booth identifiers per expo
BoothSpaceSchema.index({ expo: 1, identifier: 1 }, { unique: true });
BoothSpaceSchema.index({ floorPlan: 1, status: 1 });

// Pre-save hook to calculate area
BoothSpaceSchema.pre('save', function (next) {
  this.size.area = this.size.width * this.size.height;
  next();
});

export const BoothSpace = mongoose.model<IBoothSpace>('BoothSpace', BoothSpaceSchema);

