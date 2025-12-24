/**
 * Feedback Routes
 * API routes for feedback submission and management
 * Implements FR-037, FR-038, FR-039, T212
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import * as feedbackService from '../services/feedbackService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  validate,
  validateObjectId,
  validateFeedbackCategory,
  validateFeedbackSubject,
  validateFeedbackMessage,
  validateFeedbackStatus,
} from '../middleware/validator';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /feedback
 * Submit feedback
 * Per FR-037, FR-038, FR-039
 */
router.post(
  '/',
  validate([
    validateFeedbackCategory,
    validateFeedbackSubject,
    validateFeedbackMessage,
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const feedback = await feedbackService.submitFeedback(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. A confirmation email has been sent.',
      data: feedback,
    });
  })
);

/**
 * GET /feedback
 * Get feedback queue (for organizers/admins) or user's own feedback
 * Per FR-037, FR-038, FR-039
 */
router.get(
  '/',
  validate([
    query('status')
      .optional()
      .isIn(['pending', 'reviewed', 'resolved', 'closed'])
      .withMessage('Invalid status'),
    query('category')
      .optional()
      .isIn(['suggestion', 'bug-report', 'support-request'])
      .withMessage('Invalid category'),
    query('assignedTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid assignedTo ID'),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const userRole = req.user!.role;

    // If admin/organizer, return queue with filters
    if (userRole === 'admin' || userRole === 'organizer') {
      const queue = await feedbackService.getFeedbackQueue(
        req.user!.userId,
        userRole,
        {
          status: req.query.status as any,
          category: req.query.category as any,
          assignedTo: req.query.assignedTo as string,
        }
      );
      res.json({
        success: true,
        data: queue,
      });
      return;
    }

    // Otherwise, return user's own feedback
    const userFeedback = await feedbackService.getUserFeedback(req.user!.userId);
    res.json({
      success: true,
      data: userFeedback,
    });
    return;
  })
);

/**
 * GET /feedback/:id
 * Get single feedback detail
 */
router.get(
  '/:id',
  validate([validateObjectId('id')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const feedbackId = req.params.id;
    const userRole = req.user!.role;

    // Get queue or user feedback and find the specific one
    if (userRole === 'admin' || userRole === 'organizer') {
      const queue = await feedbackService.getFeedbackQueue(req.user!.userId, userRole);
      const feedback = queue.find((f) => f.feedbackId === feedbackId);
      if (!feedback) {
        res.status(404).json({
          success: false,
          message: 'Feedback not found',
        });
        return;
      }
      res.json({
        success: true,
        data: feedback,
      });
      return;
    }

    // User can only see their own feedback
    const userFeedback = await feedbackService.getUserFeedback(req.user!.userId);
    const feedback = userFeedback.find((f) => f.feedbackId === feedbackId);
    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
      return;
    }
    res.json({
      success: true,
      data: feedback,
    });
  })
);

/**
 * PUT /feedback/:id/status
 * Update feedback status (organizers/admins only)
 * Per FR-037, FR-038, FR-039
 */
router.put(
  '/:id/status',
  validate([
    validateObjectId('id'),
    validateFeedbackStatus,
  ]),
  (req: AuthRequest, res, next) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer') {
      res.status(403).json({
        success: false,
        message: 'Only admins and organizers can access this endpoint',
      });
      return;
    }
    next();
  },
  asyncHandler(async (req: AuthRequest, res) => {
    const feedback = await feedbackService.updateFeedbackStatus(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body.status
    );
    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback,
    });
  })
);

/**
 * POST /feedback/:id/assign
 * Assign feedback to staff member (organizers/admins only)
 * Per FR-037, FR-038, FR-039
 */
router.post(
  '/:id/assign',
  validate([
    validateObjectId('id'),
    body('assignedTo')
      .notEmpty()
      .withMessage('assignedTo is required')
      .isMongoId()
      .withMessage('Invalid assignedTo ID'),
  ]),
  (req: AuthRequest, res, next) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer') {
      res.status(403).json({
        success: false,
        message: 'Only admins and organizers can access this endpoint',
      });
      return;
    }
    next();
  },
  asyncHandler(async (req: AuthRequest, res) => {
    const feedback = await feedbackService.assignFeedback(
      req.params.id,
      req.body.assignedTo,
      req.user!.userId,
      req.user!.role
    );
    res.json({
      success: true,
      message: 'Feedback assigned successfully',
      data: feedback,
    });
  })
);

/**
 * POST /feedback/:id/respond
 * Respond to feedback (organizers/admins only)
 * Per FR-037, FR-038, FR-039
 */
router.post(
  '/:id/respond',
  validate([
    validateObjectId('id'),
    body('response')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Response must be between 1 and 5000 characters'),
  ]),
  (req: AuthRequest, res, next) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer') {
      res.status(403).json({
        success: false,
        message: 'Only admins and organizers can access this endpoint',
      });
      return;
    }
    next();
  },
  asyncHandler(async (req: AuthRequest, res) => {
    const feedback = await feedbackService.respondToFeedback(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body.response
    );
    res.json({
      success: true,
      message: 'Response sent successfully',
      data: feedback,
    });
  })
);

export default router;

