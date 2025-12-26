import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { ValidationError } from 'express-validator';
import errorTracking from '../utils/errorTracking';

/**
 * Custom application error class
 * Also exported as CustomError for backward compatibility
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Export as CustomError for backward compatibility
export { AppError as CustomError };

/**
 * Global error handling middleware
 * Implements constitutional requirement for observability and error handling
 * Handles various error types: AppError, MongoDB errors, validation errors, etc.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle AppError (application errors)
  if (err instanceof AppError) {
    // Log 404 errors (not found) at warn level since they're expected conditions
    // Log other errors at error level
    const isNotFound = err.statusCode === 404;
    const logMethod = isNotFound ? logger.warn : logger.error;
    
    logMethod(isNotFound ? 'Resource not found' : 'Error handler invoked', {
      error: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      stack: isNotFound ? undefined : err.stack, // Don't log stack for 404s
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    // Only capture non-404 exceptions in error tracking (T258)
    if (!isNotFound) {
      errorTracking.captureException(err, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: (req as any).user?.userId,
        userRole: (req as any).user?.role,
        requestId: (req as any).requestId,
        environment: process.env.NODE_ENV,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
    });
    return;
  }

  // Log error with context for non-AppError exceptions
  logger.error('Error handler invoked', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Capture exception in error tracking service (T258)
  errorTracking.captureException(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
    userRole: (req as any).user?.role,
    requestId: (req as any).requestId,
    environment: process.env.NODE_ENV,
  });

  // Handle MongoDB/Mongoose errors
  if (err.name === 'ValidationError' && (err as any).errors) {
    const validationErrors: Record<string, string> = {};
    const mongooseError = err as mongoose.Error.ValidationError;
    Object.keys(mongooseError.errors).forEach((key) => {
      validationErrors[key] = mongooseError.errors[key].message;
    });

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errorCode: 'VALIDATION_ERROR',
      details: validationErrors,
    });
    return;
  }

  if (err.name === 'CastError') {
    const castError = err as mongoose.Error.CastError;
    res.status(400).json({
      success: false,
      message: `Invalid ${castError.kind} value: ${castError.value}`,
      errorCode: 'INVALID_ID',
    });
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    // Duplicate key error
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errorCode: 'DUPLICATE_ENTRY',
      details: {
        field: Object.keys((err as any).keyPattern || {})[0],
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      errorCode: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      errorCode: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle validation errors from express-validator
  if (Array.isArray((err as any).errors)) {
    const validationErrors: Record<string, string> = {};
    (err as any).errors.forEach((error: ValidationError) => {
      if (error.type === 'field') {
        validationErrors[error.path] = error.msg;
      }
    });

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errorCode: 'VALIDATION_ERROR',
      details: validationErrors,
    });
    return;
  }

  // Default error response (500)
  const statusCode = process.env.NODE_ENV === 'production' ? 500 : 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    errorCode: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: 'NOT_FOUND',
  });
}

/**
 * Async error wrapper to catch errors in async route handlers
 * @param fn Async route handler function
 * @returns Wrapped function that catches and forwards errors to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

