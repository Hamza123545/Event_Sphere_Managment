/**
 * Base Mongoose schema configuration
 * Provides common schema options for all models including timestamps and JSON transformation
 * Implements constitutional requirements for data consistency and observability
 */

import mongoose, { Schema, SchemaOptions } from 'mongoose';

/**
 * Common schema options for all models
 * - timestamps: Automatically adds createdAt and updatedAt fields
 * - toJSON: Transform documents when converting to JSON (removes _id, adds id, removes __v)
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      // Transform _id to id for JSON output
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }

      // Remove __v version key
      if (ret.__v !== undefined) {
        delete ret.__v;
      }

      return ret;
    },
  },
  toObject: {
    transform: (_doc: any, ret: any) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      if (ret.__v !== undefined) {
        delete ret.__v;
      }
      return ret;
    },
  },
};

/**
 * Base schema class that extends mongoose.Schema with common options
 */
export class BaseSchema<T> extends Schema<T> {
  constructor(definition?: mongoose.SchemaDefinition<T>, options?: SchemaOptions) {
    super(definition, {
      ...(baseSchemaOptions as any),
      ...(options as any),
    } as any);
  }
}

/**
 * Helper function to create a schema with base options
 */
export function createBaseSchema<T>(
  definition?: mongoose.SchemaDefinition<T>,
  options?: SchemaOptions
): Schema<T> {
  return new Schema<T>(definition, {
    ...(baseSchemaOptions as any),
    ...options,
  } as any);
}

