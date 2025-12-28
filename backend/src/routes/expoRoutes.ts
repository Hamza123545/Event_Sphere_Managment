/**
 * Expo Event Routes
 * Implements expo management endpoints per contracts/expo-api.yaml
 * Routes: GET /expos, POST /expos, GET /expos/:id, PUT /expos/:id, DELETE /expos/:id
 */

import { Router, type Router as ExpressRouter } from 'express';
import { body, query } from 'express-validator';
import * as expoService from '../services/expoService';
import * as floorPlanService from '../services/floorPlanService';
import * as sessionService from '../services/sessionService';
import * as exhibitorApprovalService from '../services/exhibitorApprovalService';
import * as analyticsService from '../services/analyticsService';
import * as exportService from '../services/exportService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import logger from '../utils/logger';
import {
  validate,
  validateObjectId,
  validateString,
  validateFloorPlanName,
  validateFloorPlanDimensions,
  validateBoothIdentifier,
  validateBoothSize,
  validateBoothLocation,
  validateBoothPriceTier,
} from '../middleware/validator';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadFloorPlanImage, uploadExpoImage, handleUploadError } from '../middleware/upload';
import { saveFileInfo } from '../services/uploadService';

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
 * Supports both image file upload and imageUrl
 */
router.post(
  '/',
  (req: any, res: any, next: any) => {
    // Handle file upload if present
    uploadExpoImage(req, res, (err: any) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
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
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
  ]),
  asyncHandler(async (req: AuthRequest, res, next) => {
    try {
      // If file was uploaded, process it and get URL
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        const fileInfo = saveFileInfo(req.file);
        imageUrl = fileInfo.url;
      }

      // Parse FormData nested fields (when using multipart/form-data)
      const expoData: any = {
        title: req.body.title,
        description: req.body.description,
        theme: req.body.theme,
        dateRange: {
          startDate: req.body['dateRange.startDate'] || req.body.dateRange?.startDate || req.body.dateRange?.[0]?.startDate,
          endDate: req.body['dateRange.endDate'] || req.body.dateRange?.endDate || req.body.dateRange?.[0]?.endDate,
        },
        location: {
          venueName: req.body['location.venueName'] || req.body.location?.venueName || req.body.location?.[0]?.venueName,
          address: req.body['location.address'] || req.body.location?.address || req.body.location?.[0]?.address,
          city: req.body['location.city'] || req.body.location?.city || req.body.location?.[0]?.city,
          state: req.body['location.state'] || req.body.location?.state || req.body.location?.[0]?.state,
          country: req.body['location.country'] || req.body.location?.country || req.body.location?.[0]?.country,
          zipCode: req.body['location.zipCode'] || req.body.location?.zipCode || req.body.location?.[0]?.zipCode,
        },
        imageUrl,
      };

      const expo = await expoService.createExpo(req.user!.userId, expoData);
      res.status(201).json({
        success: true,
        message: 'Expo created successfully',
        data: expo,
      });
    } catch (error) {
      next(error);
    }
  })
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
 * Supports both image file upload and imageUrl
 */
router.put(
  '/:id',
  (req: any, res: any, next: any) => {
    // Handle file upload if present
    uploadExpoImage(req, res, (err: any) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
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
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
  ]),
  asyncHandler(async (req: AuthRequest, res, next) => {
    try {
      // If file was uploaded, process it and get URL
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        const fileInfo = saveFileInfo(req.file);
        imageUrl = fileInfo.url;
      }
      // Handle image removal (send null if explicitly set to empty string)
      if (req.body.removeImage === 'true' || req.body.removeImage === true) {
        imageUrl = null;
      }

      // Build update object (handle both JSON and FormData)
      const updateData: any = {};
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.theme !== undefined) updateData.theme = req.body.theme;
      if (req.body.dateRange) {
        updateData.dateRange = {
          startDate: req.body['dateRange.startDate'] || req.body.dateRange?.startDate,
          endDate: req.body['dateRange.endDate'] || req.body.dateRange?.endDate,
        };
      }
      if (req.body.location) {
        updateData.location = {
          venueName: req.body['location.venueName'] || req.body.location?.venueName,
          address: req.body['location.address'] || req.body.location?.address,
          city: req.body['location.city'] || req.body.location?.city,
          state: req.body['location.state'] || req.body.location?.state,
          country: req.body['location.country'] || req.body.location?.country,
          zipCode: req.body['location.zipCode'] || req.body.location?.zipCode,
        };
      }
      if (req.body.status) updateData.status = req.body.status;
      // Only set imageUrl if it's explicitly provided (including null for removal)
      if (req.body.removeImage === 'true' || req.body.removeImage === true || req.file || req.body.imageUrl !== undefined) {
        updateData.imageUrl = imageUrl;
      }

      const expo = await expoService.updateExpo(req.params.id, req.user!.userId, req.user!.role, updateData);
      res.status(200).json({
        success: true,
        message: 'Expo updated successfully. Changes propagated to all users.',
        data: expo,
      });
    } catch (error) {
      next(error);
    }
  })
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

/**
 * GET /expos/:id/floor-plan
 * Get floor plan for expo
 */
router.get(
  '/:id/floor-plan',
  validate([validateObjectId('id')]),
  async (req: AuthRequest, res, next) => {
    try {
      const floorPlan = await floorPlanService.getFloorPlan(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: floorPlan,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /expos/:id/floor-plan
 * Create floor plan for expo
 * Supports both image file upload and imageUrl
 */
router.post(
  '/:id/floor-plan',
  validate([validateObjectId('id')]),
  (req: any, res: any, next: any) => {
    // Handle file upload if present
    uploadFloorPlanImage(req, res, (err: any) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  validate([
    validateFloorPlanName,
    ...validateFloorPlanDimensions,
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('metadata.scale').optional().isFloat({ min: 1, max: 100 }).withMessage('Scale must be between 1 and 100'),
  ]),
  asyncHandler(async (req: AuthRequest, res, next) => {
    try {
      // If file was uploaded, process it and get URL
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        const fileInfo = saveFileInfo(req.file);
        imageUrl = fileInfo.url;
      }

      // Parse FormData nested fields (when using multipart/form-data)
      const floorPlanData: any = {
        name: req.body.name,
        dimensions: {
          width: parseFloat(req.body['dimensions.width'] || req.body.dimensions?.width || req.body.dimensions?.[0]?.width || 0),
          height: parseFloat(req.body['dimensions.height'] || req.body.dimensions?.height || req.body.dimensions?.[0]?.height || 0),
        },
        imageUrl,
        metadata: {
          scale: req.body['metadata.scale'] || req.body.metadata?.scale ? parseFloat(req.body['metadata.scale'] || req.body.metadata.scale) : 10,
        },
      };

      const floorPlan = await floorPlanService.createFloorPlan(req.params.id, req.user!.userId, floorPlanData);
      res.status(201).json({
        success: true,
        message: 'Floor plan created successfully',
        data: floorPlan,
      });
    } catch (error) {
      next(error);
    }
  })
);

/**
 * POST /expos/:id/booths
 * Add booth space to floor plan
 */
router.post(
  '/:id/booths',
  validate([
    validateObjectId('id'),
    validateBoothIdentifier,
    ...validateBoothSize,
    ...validateBoothLocation,
    validateBoothPriceTier,
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('amenities.*').optional().trim().isLength({ min: 1, max: 50 }),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const booth = await floorPlanService.addBoothSpace(req.params.id, req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Booth space added successfully',
        data: booth,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /expos/:id/booths/:boothId/assign
 * Assign exhibitor to booth
 */
router.post(
  '/:id/booths/:boothId/assign',
  validate([
    validateObjectId('id'),
    validateObjectId('boothId'),
    body('profileId')
      .notEmpty()
      .withMessage('Profile ID is required')
      .isMongoId()
      .withMessage('Invalid profile ID format'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const booth = await floorPlanService.assignExhibitorToBooth(
        req.params.id,
        req.params.boothId,
        req.body.profileId,
        req.user!.userId
      );
      res.status(200).json({
        success: true,
        message: 'Exhibitor assigned to booth successfully',
        data: booth,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /expos/:id/sessions/:sessionId
 * Delete session
 * Per contracts/expo-api.yaml
 */
router.delete(
  '/:id/sessions/:sessionId',
  validate([validateObjectId('id'), validateObjectId('sessionId')]),
  async (req: AuthRequest, res, next) => {
    try {
      await sessionService.deleteSession(
        req.params.sessionId,
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.status(200).json({
        success: true,
        message: 'Session deleted. Attendees notified.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /expos/:id/exhibitors
 * List exhibitor applications for expo
 * Per contracts/expo-api.yaml
 */
router.get(
  '/:id/exhibitors',
  validate([
    validateObjectId('id'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await exhibitorApprovalService.listPendingApplications(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        {
          status: req.query.status as 'pending' | 'approved' | 'rejected' | undefined,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        }
      );
      res.status(200).json({
        success: true,
        data: {
          applications: result.applications,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /expos/:id/exhibitors/:exhibitorId/approve
 * Approve exhibitor application
 * Per contracts/expo-api.yaml
 */
router.post(
  '/:id/exhibitors/:exhibitorId/approve',
  requireAuth,
  requireRole('admin', 'organizer'),
  validate([validateObjectId('id'), validateObjectId('exhibitorId')]),
  async (req: AuthRequest, res, next) => {
    try {
      const application = await exhibitorApprovalService.approveExhibitor(
        req.params.id,
        req.params.exhibitorId,
        req.user!.userId,
        req.user!.role
      );
      res.status(200).json({
        success: true,
        message: 'Exhibitor approved successfully',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /expos/:id/exhibitors/:exhibitorId/reject
 * Reject exhibitor application
 * Per contracts/expo-api.yaml
 */
router.post(
  '/:id/exhibitors/:exhibitorId/reject',
  requireAuth,
  requireRole('admin', 'organizer'),
  validate([
    validateObjectId('id'),
    validateObjectId('exhibitorId'),
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters')
      .trim(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const application = await exhibitorApprovalService.rejectExhibitor(
        req.params.id,
        req.params.exhibitorId,
        req.user!.userId,
        req.user!.role,
        req.body.reason
      );
      res.status(200).json({
        success: true,
        message: 'Exhibitor application rejected',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /expos/:id/analytics
 * Get expo analytics
 * Per contracts/expo-api.yaml
 */
router.get(
  '/:id/analytics',
  validate([
    validateObjectId('id'),
    query('metricType')
      .optional()
      .isIn(['attendee-count', 'session-popularity', 'booth-traffic', 'engagement-rate'])
      .withMessage('Invalid metric type'),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const analytics = await analyticsService.getExpoAnalytics(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.query.metricType as string
    );
    res.status(200).json({
      success: true,
      data: analytics,
    });
  })
);

/**
 * GET /expos/:id/analytics/export
 * Export analytics report
 * Per contracts/expo-api.yaml
 */
router.get(
  '/:id/analytics/export',
  validate([
    validateObjectId('id'),
    query('format')
      .optional()
      .isIn(['pdf', 'csv', 'json'])
      .withMessage('Format must be pdf, csv, or json'),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const format = (req.query.format as 'pdf' | 'csv' | 'json') || 'pdf';
      const expoId = req.params.id;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Get analytics data
      const analytics = await analyticsService.getExpoAnalytics(expoId, userId, userRole);

      // Export based on format
      if (format === 'pdf') {
        const pdfBuffer = await exportService.generatePDF(analytics);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${expoId}-${Date.now()}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'csv') {
        const csvContent = await exportService.generateCSV(analytics);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${expoId}-${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        // JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${expoId}-${Date.now()}.json"`);
        res.json(analytics);
      }

      // Log export (T183)
      logger.info('Analytics report exported', {
        action: 'export_analytics',
        expoId,
        format,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
