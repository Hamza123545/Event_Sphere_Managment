import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

type UserRole = 'admin' | 'organizer' | 'exhibitor' | 'attendee';

/**
 * Role-based access control middleware
 * Implements constitutional requirement for Role-Based Access Control (NON-NEGOTIABLE)
 * Each API endpoint MUST validate user role and permissions before processing requests
 */

/**
 * Middleware factory to require specific user role(s)
 * @param allowedRoles Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export function requireRole(
  ...allowedRoles: UserRole[]
): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first (should be called after requireAuth)
    if (!req.user) {
      logger.warn('Role check failed: user not authenticated', {
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

    const userRole = req.user.role;

    // Admin has access to everything
    if (userRole === 'admin') {
      logger.debug('Admin access granted', {
        userId: req.user.userId,
        path: req.path,
      });
      next();
      return;
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role check failed: insufficient permissions', {
        userId: req.user.userId,
        userRole,
        allowedRoles,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errorCode: 'FORBIDDEN',
        details: {
          requiredRoles: allowedRoles,
          userRole,
        },
      });
      return;
    }

    logger.debug('Role check passed', {
      userId: req.user.userId,
      userRole,
      path: req.path,
    });

    next();
  };
}

/**
 * Middleware to check if user has permission based on custom permission checker
 * @param permissionChecker Function that returns true if user has permission
 * @returns Express middleware function
 */
export function checkPermissions(
  permissionChecker: (user: { userId: string; role: UserRole; email: string }) => boolean
): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Permission check failed: user not authenticated', {
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

    const hasPermission = permissionChecker(req.user);

    if (!hasPermission) {
      logger.warn('Permission check failed', {
        userId: req.user.userId,
        role: req.user.role,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errorCode: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Convenience middleware functions for common role checks
 */
export const requireAdmin = requireRole('admin');
export const requireOrganizer = requireRole('admin', 'organizer');
export const requireExhibitor = requireRole('admin', 'exhibitor');
export const requireAttendee = requireRole('admin', 'attendee');
export const requireAuthenticated = requireRole(
  'admin',
  'organizer',
  'exhibitor',
  'attendee'
);

