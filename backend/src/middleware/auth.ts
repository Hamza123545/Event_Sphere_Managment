import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import { logger } from '../utils/logger';

/**
 * Express Request interface extended with user information
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Extract JWT token from Authorization header
 * @param req Express request object
 * @returns Token string or null if not found
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to extract and verify JWT token from request
 * Adds user information to request object if token is valid
 * Does not require authentication (for optional auth scenarios)
 */
export function extractUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
      logger.debug('User extracted from token', {
        userId: decoded.userId,
        role: decoded.role,
      });
    }
  } catch (error) {
    // Log error but don't fail request (for optional auth)
    logger.debug('Token extraction failed (optional auth):', error);
  }

  next();
}

/**
 * Middleware to require authentication
 * Returns 401 if no valid token is present
 * Implements constitutional requirement for Security-First principle
 * Security audit logging: T235
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      // Security audit logging (T235)
      logger.warn('Authentication attempt failed: no token provided', {
        action: 'auth_failed',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    // Security audit logging (T235) - successful authentication
    logger.info('User authenticated successfully', {
      action: 'auth_success',
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    next();
  } catch (error) {
    // Security audit logging (T235) - authentication failure
    logger.warn('Authentication attempt failed: invalid token', {
      action: 'auth_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
    });

    res.status(401).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Authentication failed',
      errorCode: 'UNAUTHORIZED',
    });
  }
}

/**
 * Middleware to verify token (alias for requireAuth for clarity)
 */
export const verifyTokenMiddleware = requireAuth;

