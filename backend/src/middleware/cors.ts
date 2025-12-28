import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * CORS middleware configuration
 * Implements constitutional requirement for secure communication
 * Whitelisted origins from environment variables
 */

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'https://eventsphere.edvo.app', 'https://event-sphere-managment.vercel.app', 'https://event-sphere-managment-vqvw.vercel.app'];

// Normalize origin by removing trailing slash
const normalizeOrigin = (origin: string): string => {
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
};

/**
 * CORS configuration with origin whitelist
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Normalize the origin (remove trailing slash)
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedAllowed = allowedOrigins.map(normalizeOrigin);

    if (normalizedAllowed.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Origin not allowed', { 
        origin, 
        normalizedOrigin,
        allowedOrigins: normalizedAllowed 
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
});

/**
 * Custom CORS middleware for logging
 */
export function corsLogger(req: Request, _res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    logger.debug('CORS preflight request', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
    });
  }
  next();
}

export default corsMiddleware;

