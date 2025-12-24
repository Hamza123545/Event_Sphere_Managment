/**
 * Exhibitor Profile Model
 * Represents an exhibiting company with registration details
 * Implements FR-017, FR-018, FR-019
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IExhibitorProfile extends Document {
  user: ObjectId;
  expo: ObjectId;
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  documents: {
    filename: string;
    url: string;
    uploadedAt: Date;
  }[];
  contactInfo: {
    website?: string;
    email: string;
    phone?: string;
  };
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  booth?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExhibitorProfileSchema = new Schema<IExhibitorProfile>(
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
    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
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
    logo: {
      type: String,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Logo must be a valid URL',
      },
    },
    productsServices: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one product/service is required',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    documents: [
      {
        filename: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
          validate: {
            validator: (v: string) => /^https?:\/\/.+/.test(v),
            message: 'Document URL must be valid',
          },
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contactInfo: {
      website: {
        type: String,
        trim: true,
        validate: {
          validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
          message: 'Website must be a valid URL',
        },
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
          validator: (v: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
          message: 'Invalid email format',
        },
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    booth: {
      type: Schema.Types.ObjectId,
      ref: 'BoothSpace',
    },
  },
  baseSchemaOptions as any
);

// Compound index to ensure one profile per user per expo
ExhibitorProfileSchema.index({ user: 1, expo: 1 }, { unique: true });
ExhibitorProfileSchema.index({ expo: 1, registrationStatus: 1 });
ExhibitorProfileSchema.index({ category: 1, expo: 1 });

export const ExhibitorProfile = mongoose.model<IExhibitorProfile>(
  'ExhibitorProfile',
  ExhibitorProfileSchema
);

