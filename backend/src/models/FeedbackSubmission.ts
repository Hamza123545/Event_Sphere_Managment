/**
 * Feedback Submission Model
 * Represents user feedback and support requests
 * Implements FR-037, FR-038, FR-039, T210
 */

import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { baseSchemaOptions } from './index';

export interface IFeedbackSubmission extends Document {
  submitter: ObjectId;
  category: 'suggestion' | 'bug-report' | 'support-request';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  assignedTo?: ObjectId;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSubmissionSchema = new Schema<IFeedbackSubmission>(
  {
    submitter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['suggestion', 'bug-report', 'support-request'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    response: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    ...(baseSchemaOptions as any),
  }
);

// Indexes for performance
FeedbackSubmissionSchema.index({ status: 1, createdAt: -1 });
FeedbackSubmissionSchema.index({ submitter: 1, category: 1 });
FeedbackSubmissionSchema.index({ assignedTo: 1, status: 1 });

export const FeedbackSubmission = mongoose.model<IFeedbackSubmission>(
  'FeedbackSubmission',
  FeedbackSubmissionSchema
);

