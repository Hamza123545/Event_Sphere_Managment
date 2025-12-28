/**
 * Exhibitor Routes
 * API routes for exhibitor portal
 * Per contracts/exhibitor-api.yaml
 */

import { Router, type Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import * as exhibitorService from '../services/exhibitorService';
import * as boothService from '../services/boothService';
import * as messagingService from '../services/messagingService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  validate,
  validateObjectId,
  validateMessageContent,
  validateMessageSubject,
  validateMessageContext,
  validateRecipientId,
  validateRelatedExpoId,
} from '../middleware/validator';
import { uploadExhibitorFiles, handleUploadError } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(requireAuth);

// Most routes require exhibitor role, but messaging routes allow organizers/admins too
// Apply exhibitor role requirement to all routes except messaging
router.use((req: Request, res: Response, next: NextFunction) => {
  // Allow messaging routes for organizers/admins too
  if (req.path.startsWith('/messages')) {
    requireRole('admin', 'organizer', 'exhibitor')(req as AuthRequest, res, next);
  } else {
    requireRole('exhibitor')(req as AuthRequest, res, next);
  }
});

/**
 * Browse available expos
 * GET /exhibitor/expos
 */
router.get(
  '/expos',
  validate([
    query('status').optional().isIn(['upcoming', 'active']).withMessage('Invalid status filter'),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, category } = req.query;
    
    // Import ExpoEvent model directly for browsing
    const { ExpoEvent } = await import('../models/ExpoEvent');
    
    // Build query for available expos (upcoming or active)
    const query: any = {
      status: status ? (status as string) : { $in: ['upcoming', 'active'] },
    };
    
    // Filter by category/theme if provided
    if (category) {
      query.theme = { $regex: category as string, $options: 'i' };
    }

    // Get expos
    const expos = await ExpoEvent.find(query)
      .select('title description theme dateRange location status')
      .limit(100)
      .sort({ 'dateRange.startDate': 1 });

    // Format response
    const formattedExpos = expos.map((expo: any) => ({
      expoId: expo._id.toString(),
      title: expo.title,
      description: expo.description,
      theme: expo.theme,
      dateRange: {
        startDate: expo.dateRange.startDate,
        endDate: expo.dateRange.endDate,
      },
      location: {
        venueName: expo.location.venueName,
        city: expo.location.city,
        country: expo.location.country,
      },
      status: expo.status,
    }));

    res.json({
      success: true,
      data: {
        expos: formattedExpos,
      },
    });
  })
);

/**
 * Register for expo
 * POST /exhibitor/expos/:expoId/register
 */
router.post(
  '/expos/:expoId/register',
  validate([validateObjectId('expoId')]),
  (req: Request, res: Response, next: NextFunction) => {
    uploadExhibitorFiles(req, res, (err: any) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  validate([
    body('companyName').trim().isLength({ min: 2, max: 200 }).withMessage('Company name must be 2-200 characters'),
    body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
    body('productsServices')
      .custom((value) => {
        // Handle array format
        if (Array.isArray(value)) {
          const validItems = value.filter((item) => item && String(item).trim().length > 0);
          return validItems.length > 0;
        }
        // Handle JSON string format (from FormData)
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              const validItems = parsed.filter((item) => item && String(item).trim().length > 0);
              return validItems.length > 0;
            }
          } catch {
            // If it's not JSON, treat as single string
            return value && value.trim().length > 0;
          }
        }
        return false;
      })
      .withMessage('At least one product/service is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('contactEmail').trim().isEmail().withMessage('Invalid email format'),
    body('contactPhone').optional().trim(),
    body('website').optional().trim().isURL().withMessage('Invalid website URL'),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { expoId } = req.params;
    const userId = req.user!.userId;

    // Parse productsServices from form data (could be JSON string or array)
    let productsServices: string[] = [];
    if (typeof req.body.productsServices === 'string') {
      try {
        productsServices = JSON.parse(req.body.productsServices);
      } catch {
        productsServices = [req.body.productsServices];
      }
    } else if (Array.isArray(req.body.productsServices)) {
      productsServices = req.body.productsServices;
    }

    const logo = (req.files as any)?.logo?.[0];
    const documents = (req.files as any)?.documents || [];

    const input: exhibitorService.RegisterForExpoInput = {
      companyName: req.body.companyName,
      description: req.body.description,
      productsServices,
      category: req.body.category,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      website: req.body.website,
      logo,
      documents,
    };

    const profile = await exhibitorService.registerForExpo(userId, expoId, input);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending organizer approval.',
      data: profile,
    });
  })
);

/**
 * Get all exhibitor profiles for authenticated user
 * GET /exhibitor/profile
 */
router.get(
  '/profile',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const profiles = await exhibitorService.getProfiles(userId);

    res.json({
      success: true,
      data: {
        profiles,
      },
    });
  })
);

/**
 * Get exhibitor profile details
 * GET /exhibitor/profile/:profileId
 */
router.get(
  '/profile/:profileId',
  validate([validateObjectId('profileId')]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const userId = req.user!.userId;

    const profile = await exhibitorService.getProfile(profileId, userId);

    res.json({
      success: true,
      data: profile,
    });
  })
);

/**
 * Update exhibitor profile
 * PUT /exhibitor/profile/:profileId
 */
router.put(
  '/profile/:profileId',
  validate([validateObjectId('profileId')]),
  (req: Request, res: Response, next: NextFunction) => {
    uploadExhibitorFiles(req, res, (err: any) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  validate([
    body('companyName').optional().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().trim().isLength({ min: 20, max: 2000 }),
    body('productsServices').optional().isArray({ min: 1 }),
    body('category').optional().trim().notEmpty(),
    body('contactEmail').optional().trim().isEmail(),
    body('contactPhone').optional().trim(),
    body('website').optional().trim().isURL(),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const userId = req.user!.userId;

    let productsServices: string[] | undefined;
    if (req.body.productsServices) {
      if (typeof req.body.productsServices === 'string') {
        try {
          productsServices = JSON.parse(req.body.productsServices);
        } catch {
          productsServices = [req.body.productsServices];
        }
      } else if (Array.isArray(req.body.productsServices)) {
        productsServices = req.body.productsServices;
      }
    }

    const logo = (req.files as any)?.logo?.[0];
    const documents = (req.files as any)?.documents || [];

    const input: exhibitorService.UpdateProfileInput = {
      companyName: req.body.companyName,
      description: req.body.description,
      productsServices,
      category: req.body.category,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      website: req.body.website,
      logo,
      documents: documents.length > 0 ? documents : undefined,
    };

    const profile = await exhibitorService.updateProfile(profileId, userId, input);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  })
);

/**
 * Get floor plan for expo
 * GET /exhibitor/expos/:expoId/floor-plan
 */
router.get(
  '/expos/:expoId/floor-plan',
  validate([validateObjectId('expoId')]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { expoId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const floorPlan = await boothService.viewFloorPlan(expoId, userId, userRole);

    res.json({
      success: true,
      data: floorPlan,
    });
  })
);

/**
 * Reserve booth
 * POST /exhibitor/expos/:expoId/booths/:boothId/reserve
 */
router.post(
  '/expos/:expoId/booths/:boothId/reserve',
  validate([validateObjectId('expoId'), validateObjectId('boothId')]),
  validate([
    body('profileId').trim().isMongoId().withMessage('Valid profile ID is required'),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { expoId, boothId } = req.params;
    const { profileId } = req.body;
    const userId = req.user!.userId;

    const booth = await boothService.reserveBooth(expoId, boothId, profileId, userId);

    res.json({
      success: true,
      message: 'Booth reserved successfully',
      data: booth,
    });
  })
);

/**
 * Get assigned booth details
 * GET /exhibitor/profile/:profileId/booth
 */
router.get(
  '/profile/:profileId/booth',
  validate([validateObjectId('profileId')]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const userId = req.user!.userId;

    const profile = await exhibitorService.getProfile(profileId, userId);

    if (!profile.booth) {
      res.status(404).json({
        success: false,
        message: 'No booth assigned to this profile',
        errorCode: 'NO_BOOTH_ASSIGNED',
      });
      return;
    }

    res.json({
      success: true,
      data: profile.booth,
    });
  })
);

/**
 * Update booth details
 * PUT /exhibitor/profile/:profileId/booth
 */
router.put(
  '/profile/:profileId/booth',
  validate([validateObjectId('profileId')]),
  validate([
    body('productsShowcased').optional().isArray(),
    body('staff').optional().isArray(),
    body('staff.*.name').optional().trim().notEmpty(),
    body('staff.*.role').optional().trim().notEmpty(),
    body('staff.*.email').optional().trim().isEmail(),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const userId = req.user!.userId;

    const input: boothService.UpdateBoothDetailsInput = {
      productsShowcased: req.body.productsShowcased,
      staff: req.body.staff,
    };

    await boothService.updateBoothDetails(profileId, userId, input);

    res.json({
      success: true,
      message: 'Booth details updated successfully',
    });
  })
);

/**
 * GET /exhibitor/messages
 * Get messages for exhibitor
 * Per contracts/exhibitor-api.yaml
 */
router.get(
  '/messages',
  validate([
    query('context')
      .optional()
      .isIn(['general-inquiry', 'exhibitor-collaboration', 'support-request', 'organizer-communication'])
      .withMessage('Invalid context'),
    query('type').optional().isIn(['inbox', 'sent']).withMessage('Type must be inbox or sent'),
    query('relatedExpoId').optional().isMongoId().withMessage('Invalid related expo ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('conversationWith').optional().isMongoId().withMessage('Invalid conversation user ID'),
    query('beforeTimestamp').optional().isISO8601().withMessage('Invalid timestamp format'),
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messagingService.getMessages(req.user!.userId, {
      type: (req.query.type as 'inbox' | 'sent') || 'inbox',
      context: req.query.context as string,
      relatedExpoId: req.query.relatedExpoId as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      conversationWith: req.query.conversationWith as string,
      beforeTimestamp: req.query.beforeTimestamp as string,
    });

    res.json({
      success: true,
      data: {
        messages: result.messages,
        pagination: result.pagination,
      },
    });
  })
);

/**
 * POST /exhibitor/messages
 * Send message
 * Per contracts/exhibitor-api.yaml
 */
router.post(
  '/messages',
  validate([
    validateRecipientId,
    validateMessageSubject,
    validateMessageContent,
    validateMessageContext,
    validateRelatedExpoId,
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await messagingService.sendMessage(req.user!.userId, {
      recipientId: req.body.recipientId,
      subject: req.body.subject,
      content: req.body.content,
      context: req.body.context,
      relatedExpoId: req.body.relatedExpoId,
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  })
);

/**
 * PUT /exhibitor/messages/:id/read
 * Mark message as read
 * Per contracts/exhibitor-api.yaml
 */
router.put(
  '/messages/:id/read',
  validate([validateObjectId('id')]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await messagingService.markAsRead(req.params.id, req.user!.userId);
    res.json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  })
);

/**
 * GET /exhibitor/messages/unread/count
 * Get unread message count
 */
router.get(
  '/messages/unread/count',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await messagingService.getUnreadCount(req.user!.userId);
    res.json({
      success: true,
      data: {
        count,
      },
    });
  })
);

export default router;

