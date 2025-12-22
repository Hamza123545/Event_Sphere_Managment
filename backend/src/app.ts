import express, { Application } from 'express';
import corsMiddleware, { corsLogger } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

/**
 * Express application setup
 * Implements constitutional requirements for security, observability, and error handling
 */

const app: Application = express();

// CORS middleware (must be first)
app.use(corsLogger);
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint (before routes)
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: 'EventSphere API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes will be mounted here
// app.use('/api/v1', routes);

// 404 handler (before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

