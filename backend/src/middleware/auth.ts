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
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn('Authentication required but no token provided', {
        path: req.path,
        method: req.method,
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

    logger.debug('User authenticated', {
      userId: decoded.userId,
      role: decoded.role,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
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

