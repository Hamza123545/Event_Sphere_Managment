/**
 * Rate Limiting Middleware
 * Prevents abuse and brute-force attacks
 * Implements T228
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * General rate limiter
 * Development: 1000 requests per 15 minutes (more lenient for testing)
 * Production: 500 requests per 15 minutes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 500, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Strict rate limiter for auth endpoints
 * Development: 20 login attempts per 15 minutes (more lenient for testing)
 * Production: 5 login attempts per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 20 : 5, // More lenient in development
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Password reset rate limiter
 * Development: 10 requests per hour (more lenient for testing)
 * Production: 3 requests per hour
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 10 : 3, // More lenient in development
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

