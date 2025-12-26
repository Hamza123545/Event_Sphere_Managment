/**
 * Structured Request Logging Middleware
 * Implements T257 - Add structured logging for all API requests
 * Logs: request ID, method, path, status, duration, user ID
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

/**
 * Extend Request interface to include request ID
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Request logging middleware
 * Adds request ID and logs all API requests with structured data
 * Implements T257
 */
export function requestLogger(
  req: Request | AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID using Node.js crypto.randomUUID()
  const requestId = randomUUID();
  req.requestId = requestId;
  req.startTime = Date.now();

  // Log request start
  logger.info('Incoming API request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as AuthRequest).user?.userId,
    userRole: (req as AuthRequest).user?.role,
    timestamp: new Date().toISOString(),
  });

  // Capture response finish to log duration and status
  const originalSend = res.send;
  res.send = function (body: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    // Log request completion
    logger.info('API request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as AuthRequest).user?.userId,
      userRole: (req as AuthRequest).user?.role,
      timestamp: new Date().toISOString(),
    });

    // Call original send
    return originalSend.call(this, body);
  };

  next();
}

