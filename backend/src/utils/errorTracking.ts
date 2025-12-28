/**
 * Error Tracking Service
 * Implements T258 - Error tracking service integration (Sentry or similar)
 * Captures exceptions, stack traces, and user context
 */

import { logger } from './logger';

/**
 * Error context information to include with error reports
 */
export interface ErrorContext {
  userId?: string;
  userRole?: string;
  requestId?: string;
  path?: string;
  method?: string;
  environment?: string;
  [key: string]: unknown;
}

/**
 * Error tracking service interface
 * Supports integration with error tracking services like Sentry, Rollbar, etc.
 */
class ErrorTrackingService {
  private isInitialized = false;
  // @ts-expect-error - Reserved for future Sentry integration (will be used when Sentry code is uncommented)
  private _service: 'sentry' | 'console' | null = null;

  /**
   * Initialize error tracking service
   * In production, this would initialize Sentry or similar service
   * For now, logs to console/logger
   */
  public initialize(service: 'sentry' | 'console' = 'console'): void {
    if (this.isInitialized) {
      return;
    }

    this._service = service;

    if (service === 'sentry') {
      // In production, initialize Sentry here
      // Example:
      // import * as Sentry from '@sentry/node';
      // Sentry.init({
      //   dsn: process.env.SENTRY_DSN,
      //   environment: process.env.NODE_ENV,
      //   tracesSampleRate: 1.0,
      // });
      logger.info('Error tracking initialized (Sentry - placeholder)');
    } else {
      logger.info('Error tracking initialized (console logger)');
    }

    this.isInitialized = true;
  }

  /**
   * Capture exception with context
   * @param error Error object
   * @param context Additional context information
   */
  public captureException(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Log error with context
    logger.error('Exception captured', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
    });

    // In production with Sentry:
    // if (this.service === 'sentry') {
    //   Sentry.captureException(error, {
    //     tags: {
    //       userRole: context?.userRole,
    //     },
    //     user: context?.userId ? { id: context.userId } : undefined,
    //     extra: context,
    //   });
    // }
  }

  /**
   * Capture message with severity level
   * @param message Error message
   * @param level Severity level
   * @param context Additional context
   */
  public captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' = 'error',
    context?: ErrorContext
  ): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    logger[level]('Error tracking message', {
      message,
      level,
      context,
    });

    // In production with Sentry:
    // if (this.service === 'sentry') {
    //   Sentry.captureMessage(message, {
    //     level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
    //     tags: {
    //       userRole: context?.userRole,
    //     },
    //     user: context?.userId ? { id: context.userId } : undefined,
    //     extra: context,
    //   });
    // }
  }

  /**
   * Set user context for error tracking
   * @param userId User ID
   * @param userRole User role
   * @param additionalContext Additional user context
   */
  public setUser(userId: string, userRole?: string, additionalContext?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    logger.info('Error tracking user context set', {
      userId,
      userRole,
      additionalContext,
    });

    // In production with Sentry:
    // if (this.service === 'sentry') {
    //   Sentry.setUser({
    //     id: userId,
    //     role: userRole,
    //     ...additionalContext,
    //   });
    // }
  }

  /**
   * Clear user context
   */
  public clearUser(): void {
    logger.info('Error tracking user context cleared');

    // In production with Sentry:
    // if (this.service === 'sentry') {
    //   Sentry.setUser(null);
    // }
  }
}

// Export singleton instance
export const errorTracking = new ErrorTrackingService();
export default errorTracking;

