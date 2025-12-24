/**
 * Authentication Routes
 * Implements authentication endpoints per contracts/auth-api.yaml
 * Routes: POST /register, POST /login, POST /logout, GET /me, PUT /me/profile, etc.
 */

import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/authService';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { validate, validateEmail, validatePassword } from '../middleware/validator';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit';

const router: ExpressRouter = Router();

/**
 * POST /auth/register
 * Register new user account
 */
router.post(
  '/register',
  validate([
    validateEmail,
    validatePassword,
    body('role')
      .isIn(['organizer', 'exhibitor', 'attendee'])
      .withMessage('Role must be organizer, exhibitor, or attendee'),
    body('profile.firstName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be between 1 and 100 characters'),
    body('profile.lastName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be between 1 and 100 characters'),
    body('profile.phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number too long'),
    body('gdprConsent.dataProcessingConsent')
      .isBoolean()
      .equals('true')
      .withMessage('Data processing consent is required'),
    body('gdprConsent.marketingConsent').optional().isBoolean(),
  ]),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful. Verification email sent.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * User login
 * Protected with strict rate limiting (T228)
 */
router.post(
  '/login',
  // authRateLimiter, // Strict rate limiting: 5 attempts per 15 minutes (uncomment after installing express-rate-limit)
  validate([validateEmail, body('password').notEmpty().withMessage('Password is required')]),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * User logout (token blacklisting handled client-side)
 */
router.post('/logout', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await authService.logout(req.user!.userId);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const profile = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /auth/me/profile
 * Update user profile
 */
router.put(
  '/me/profile',
  requireAuth,
  validate([
    body('profile.firstName').optional().trim().isLength({ min: 1, max: 100 }),
    body('profile.lastName').optional().trim().isLength({ min: 1, max: 100 }),
    body('profile.phone').optional().trim().isLength({ max: 20 }),
    body('profile.avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ]),
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const profile = await authService.updateProfile(req.user.userId, req.body.profile || {});
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/verify-email
 * Verify email address (TODO: implement)
 */
router.post(
  '/verify-email',
  validate([body('token').notEmpty().withMessage('Verification token is required')]),
  async (req, res, next) => {
    try {
      await authService.verifyEmail(req.body.token);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/forgot-password
 * Request password reset
 * Protected with rate limiting (T228)
 */
router.post(
  '/forgot-password',
  // passwordResetRateLimiter, // 3 requests per hour (uncomment after installing express-rate-limit)
  validate([validateEmail]),
  async (req, res, next) => {
    try {
      await authService.forgotPassword(req.body.email);
      // Always return 200 to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    validatePassword,
  ]),
  async (req, res, next) => {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/me/gdpr-export
 * Export all user data (GDPR compliance)
 * Implements T233, FR-007
 */
router.get(
  '/me/gdpr-export',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { exportUserData } = await import('../services/gdprService');
      const userData = await exportUserData(req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'User data export successful',
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /auth/me/gdpr-delete
 * Delete user account and anonymize data (GDPR compliance)
 * Implements T233, FR-007
 */
router.delete(
  '/me/gdpr-delete',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { deleteUserAccount } = await import('../services/gdprService');
      await deleteUserAccount(req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'Account deletion initiated. Your data will be anonymized and permanently deleted after 30 days.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


