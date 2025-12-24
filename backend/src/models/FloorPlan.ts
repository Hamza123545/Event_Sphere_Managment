/**
 * Floor Plan Model
 * Represents the physical layout of an expo
 * Implements FR-012
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IFloorPlan extends Document {
  expo: ObjectId;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl?: string;
  metadata: {
    scale: number;
    totalBooths: number;
    availableBooths: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FloorPlanSchema = new Schema<IFloorPlan>(
  {
    expo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
      required: true,
      unique: true, // One floor plan per expo
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    dimensions: {
      width: {
        type: Number,
        required: true,
        min: 10,
        max: 1000,
      },
      height: {
        type: Number,
        required: true,
        min: 10,
        max: 1000,
      },
    },
    imageUrl: {
      type: String,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Image URL must be valid',
      },
    },
    metadata: {
      scale: {
        type: Number,
        default: 10, // 10 pixels per meter
        min: 1,
        max: 100,
      },
      totalBooths: {
        type: Number,
        default: 0,
        min: 0,
      },
      availableBooths: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  baseSchemaOptions as any
);

export const FloorPlan = mongoose.model<IFloorPlan>('FloorPlan', FloorPlanSchema);

