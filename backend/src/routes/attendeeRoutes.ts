/**
 * Attendee Routes
 * API routes for attendee interface
 * Per contracts/attendee-api.yaml
 */

import { Router, type Router as ExpressRouter } from 'express';
import { body, param, query } from 'express-validator';
import * as attendeeService from '../services/attendeeService';
import * as sessionService from '../services/sessionService';
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
import { asyncHandler } from '../middleware/errorHandler';

const router: ExpressRouter = Router();

// All routes require authentication and attendee role
router.use(requireAuth);
router.use(requireRole('attendee'));

/**
 * Browse expo directory
 * GET /attendee/expos
 */
router.get(
  '/expos',
  validate([
    query('status').optional().isIn(['upcoming', 'active']).withMessage('Invalid status filter'),
    query('category').optional().trim(),
    query('location').optional().trim(),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const expos = await attendeeService.browseExpos({
      status: req.query.status as any,
      category: req.query.category as string,
      location: req.query.location as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });

    res.json({
      success: true,
      data: {
        expos,
      },
    });
  })
);

/**
 * Get expo details
 * GET /attendee/expos/:expoId
 */
router.get(
  '/expos/:expoId',
  validate([validateObjectId('expoId')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId } = req.params;
    const userId = req.user!.userId;

    const expoDetail = await attendeeService.getExpoDetails(expoId, userId);

    res.json({
      success: true,
      data: expoDetail,
    });
  })
);

/**
 * Register for expo
 * POST /attendee/expos/:expoId/register
 */
router.post(
  '/expos/:expoId/register',
  validate([
    validateObjectId('expoId'),
    body('preferences.interests').optional().isArray(),
    body('preferences.dietaryRestrictions').optional().isArray(),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId } = req.params;
    const userId = req.user!.userId;

    await attendeeService.registerForExpo(expoId, userId, {
      preferences: req.body.preferences,
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for expo',
    });
  })
);

/**
 * Get expo schedule (sessions)
 * GET /attendee/expos/:expoId/sessions
 */
router.get(
  '/expos/:expoId/sessions',
  validate([
    validateObjectId('expoId'),
    query('category').optional().trim(),
    query('topic').optional().trim(),
    query('date').optional().isISO8601().withMessage('Invalid date format'),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId } = req.params;
    const userId = req.user!.userId;

    const sessions = await sessionService.getExpoSchedule(expoId, userId, {
      category: req.query.category as string,
      topic: req.query.topic as string,
      date: req.query.date as string,
    });

    res.json({
      success: true,
      data: {
        sessions,
      },
    });
  })
);

/**
 * Bookmark session
 * POST /attendee/expos/:expoId/sessions/:sessionId/bookmark
 */
router.post(
  '/expos/:expoId/sessions/:sessionId/bookmark',
  validate([validateObjectId('expoId'), validateObjectId('sessionId')]),
  validate([
    body('reminderPreferences.enabled').optional().isBoolean(),
    body('reminderPreferences.reminderTime').optional().isInt({ min: 5, max: 1440 }),
    body('reminderPreferences.channels').optional().isArray(),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // Check for conflicts first
    const conflicts = await sessionService.checkSchedulingConflicts(sessionId, userId);

    const session = await sessionService.bookmarkSession(sessionId, userId, req.body.reminderPreferences);

    res.json({
      success: true,
      message: 'Session bookmarked successfully',
      data: {
        session,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
    });
  })
);

/**
 * Remove bookmark
 * DELETE /attendee/expos/:expoId/sessions/:sessionId/bookmark
 */
router.delete(
  '/expos/:expoId/sessions/:sessionId/bookmark',
  validate([validateObjectId('expoId'), validateObjectId('sessionId')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    await sessionService.removeBookmark(sessionId, userId);

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  })
);

/**
 * Get personal schedule
 * GET /attendee/schedule
 */
router.get(
  '/schedule',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    const schedule = await sessionService.getPersonalSchedule(userId);

    res.json({
      success: true,
      data: {
        schedule,
      },
    });
  })
);

/**
 * Search exhibitors
 * GET /attendee/expos/:expoId/exhibitors
 */
router.get(
  '/expos/:expoId/exhibitors',
  validate([validateObjectId('expoId')]),
  validate([
    query('category').optional().trim(),
    query('productKeyword').optional().trim(),
    query('companyName').optional().trim(),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId } = req.params;

    const exhibitors = await attendeeService.searchExhibitors(expoId, {
      category: req.query.category as string,
      productKeyword: req.query.productKeyword as string,
      companyName: req.query.companyName as string,
    });

    res.json({
      success: true,
      data: {
        exhibitors,
      },
    });
  })
);

/**
 * Get exhibitor profile
 * GET /attendee/expos/:expoId/exhibitors/:exhibitorId
 */
router.get(
  '/expos/:expoId/exhibitors/:exhibitorId',
  validate([validateObjectId('expoId'), validateObjectId('exhibitorId')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId, exhibitorId } = req.params;

    const exhibitor = await attendeeService.getExhibitorProfile(expoId, exhibitorId);

    res.json({
      success: true,
      data: exhibitor,
    });
  })
);

/**
 * View floor plan
 * GET /attendee/expos/:expoId/floor-plan
 */
router.get(
  '/expos/:expoId/floor-plan',
  validate([validateObjectId('expoId')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { expoId } = req.params;

    const floorPlan = await attendeeService.viewFloorPlan(expoId);

    res.json({
      success: true,
      data: floorPlan,
    });
  })
);

/**
 * GET /attendee/messages
 * Get messages for attendee
 * Per contracts/attendee-api.yaml
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
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const messages = await messagingService.getMessages(req.user!.userId, {
      type: (req.query.type as 'inbox' | 'sent') || 'inbox',
      context: req.query.context as string,
      relatedExpoId: req.query.relatedExpoId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        messages,
      },
    });
  })
);

/**
 * POST /attendee/messages
 * Send message
 * Per contracts/attendee-api.yaml
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
  asyncHandler(async (req: AuthRequest, res) => {
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
 * PUT /attendee/messages/:id/read
 * Mark message as read
 * Per contracts/attendee-api.yaml
 */
router.put(
  '/messages/:id/read',
  validate([validateObjectId('id')]),
  asyncHandler(async (req: AuthRequest, res) => {
    const message = await messagingService.markAsRead(req.params.id, req.user!.userId);
    res.json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  })
);

/**
 * GET /attendee/messages/unread/count
 * Get unread message count
 */
router.get(
  '/messages/unread/count',
  asyncHandler(async (req: AuthRequest, res) => {
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

