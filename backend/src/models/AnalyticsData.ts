/**
 * AnalyticsData Model
 * Represents aggregated metrics for reporting
 * Implements FR-014, T177
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IAnalyticsData extends Document {
  expo: ObjectId;
  metricType: 'attendee-count' | 'session-popularity' | 'booth-traffic' | 'engagement-rate';
  timePeriod: {
    start: Date;
    end: Date;
  };
  metrics: {
    [key: string]: number | string;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsDataSchema = new Schema<IAnalyticsData>(
  {
    expo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpoEvent',
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      enum: ['attendee-count', 'session-popularity', 'booth-traffic', 'engagement-rate'],
      required: true,
      index: true,
    },
    timePeriod: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
        validate: {
          validator: function (this: IAnalyticsData, v: Date) {
            return v > this.timePeriod.start;
          },
          message: 'End time must be after start time',
        },
      },
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  baseSchemaOptions as any
);

// Indexes for performance
AnalyticsDataSchema.index({ expo: 1, metricType: 1, 'timePeriod.start': -1 });

export const AnalyticsData = mongoose.model<IAnalyticsData>('AnalyticsData', AnalyticsDataSchema);

