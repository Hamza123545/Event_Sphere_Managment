import { Router, type Router as ExpressRouter } from 'express';

/**
 * API routing structure
 * Versioned routes: /api/v1
 * Implements constitutional requirement for organized API structure
 */

const router: ExpressRouter = Router();

// Import route modules
import authRoutes from './authRoutes';
import expoRoutes from './expoRoutes';
import exhibitorRoutes from './exhibitorRoutes';
import attendeeRoutes from './attendeeRoutes';
import feedbackRoutes from './feedbackRoutes';
// Note: Health routes are mounted in app.ts before API routes

// Mount routes
router.use('/auth', authRoutes);
router.use('/expos', expoRoutes);
router.use('/exhibitor', exhibitorRoutes);
router.use('/attendee', attendeeRoutes);
router.use('/feedback', feedbackRoutes);
// Note: Messaging routes are integrated within exhibitorRoutes and attendeeRoutes
// per T163 - no separate messagingRoutes file needed

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'EventSphere Management Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      expos: '/api/v1/expos',
      exhibitor: '/api/v1/exhibitor',
      attendee: '/api/v1/attendee',
    },
  });
});

export default router;

