/**
 * Expo Event Routes
 * Implements expo management endpoints per contracts/expo-api.yaml
 * Routes: GET /expos, POST /expos, GET /expos/:id, PUT /expos/:id, DELETE /expos/:id
 */

import { Router, type Router as ExpressRouter } from 'express';
import { body, query } from 'express-validator';
import * as expoService from '../services/expoService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, validateObjectId, validateString } from '../middleware/validator';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(requireAuth);
// All routes require organizer or admin role
router.use(requireRole('admin', 'organizer'));

/**
 * GET /expos
 * List all expos for organizer
 */
router.get(
  '/',
  validate([
    query('status')
      .optional()
      .isIn(['draft', 'upcoming', 'active', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await expoService.listOrganizerExpos(req.user!.userId, {
        status: req.query.status as any,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /expos
 * Create new expo event
 */
router.post(
  '/',
  validate([
    validateString('title', { min: 5, max: 200 }),
    validateString('description', { min: 20, max: 5000 }),
    validateString('theme', { max: 200, required: false }),
    body('dateRange.startDate')
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date')
      .toDate(),
    body('dateRange.endDate')
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
      .toDate(),
    body('location.venueName')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Venue name must be between 1 and 200 characters'),
    body('location.address')
      .trim()
      .isLength({ min: 1, max: 300 })
      .withMessage('Address must be between 1 and 300 characters'),
    body('location.city')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be between 1 and 100 characters'),
    body('location.state').optional().trim().isLength({ max: 100 }),
    body('location.country')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Country must be between 1 and 100 characters'),
    body('location.zipCode').optional().trim().isLength({ max: 20 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const expo = await expoService.createExpo(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Expo created successfully',
        data: expo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /expos/:id
 * Get expo details
 */
router.get(
  '/:id',
  validate([validateObjectId('id')]),
  async (req: AuthRequest, res, next) => {
    try {
      const expo = await expoService.getExpoById(req.params.id, req.user!.userId, req.user!.role);
      res.status(200).json({
        success: true,
        data: expo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /expos/:id
 * Update expo event
 */
router.put(
  '/:id',
  validate([
    validateObjectId('id'),
    validateString('title', { min: 5, max: 200, required: false }),
    validateString('description', { min: 20, max: 5000, required: false }),
    validateString('theme', { max: 200, required: false }),
    body('dateRange.startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date')
      .toDate(),
    body('dateRange.endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
      .toDate(),
    body('location.venueName').optional().trim().isLength({ min: 1, max: 200 }),
    body('location.address').optional().trim().isLength({ min: 1, max: 300 }),
    body('location.city').optional().trim().isLength({ min: 1, max: 100 }),
    body('location.state').optional().trim().isLength({ max: 100 }),
    body('location.country').optional().trim().isLength({ min: 1, max: 100 }),
    body('location.zipCode').optional().trim().isLength({ max: 20 }),
    body('status')
      .optional()
      .isIn(['draft', 'upcoming', 'active', 'cancelled'])
      .withMessage('Invalid status (completed status cannot be set manually)'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const expo = await expoService.updateExpo(req.params.id, req.user!.userId, req.user!.role, req.body);
      res.status(200).json({
        success: true,
        message: 'Expo updated successfully. Changes propagated to all users.',
        data: expo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /expos/:id
 * Delete expo event
 */
router.delete(
  '/:id',
  validate([validateObjectId('id')]),
  async (req: AuthRequest, res, next) => {
    try {
      await expoService.deleteExpo(req.params.id, req.user!.userId, req.user!.role);
      res.status(200).json({
        success: true,
        message: 'Expo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


