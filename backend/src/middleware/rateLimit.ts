/**
 * Rate Limiting Middleware
 * Prevents abuse and brute-force attacks
 * Implements T228
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * General rate limiter: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
 * Strict rate limiter for auth endpoints: 5 login attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
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
 * Password reset rate limiter: 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
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

