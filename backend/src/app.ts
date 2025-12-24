import express, { Application } from 'express';
import path from 'path';
// Note: helmet and compression packages need to be installed:
// npm install helmet compression @types/compression
// For now, commenting out until packages are installed
// import helmet from 'helmet';
// import compression from 'compression';
import corsMiddleware, { corsLogger } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
// import { generalRateLimiter } from './middleware/rateLimit';

/**
 * Express application setup
 * Implements constitutional requirements for security, observability, and error handling
 */

const app: Application = express();

// Security middleware (must be first)
// Helmet sets various HTTP headers to help protect the app (T234)
// Note: Uncomment after installing helmet: npm install helmet
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'"],
//         imgSrc: ["'self'", 'data:', 'https:'],
//         connectSrc: ["'self'"],
//         fontSrc: ["'self'"],
//         objectSrc: ["'none'"],
//         mediaSrc: ["'self'"],
//         frameSrc: ["'none'"],
//       },
//     },
//     crossOriginEmbedderPolicy: false, // Allow embedding if needed
//   })
// );

// Compression middleware (T243)
// Note: compression package needs to be installed: npm install compression @types/compression
// For now, commenting out until package is installed
// app.use(compression({ filter: (req: express.Request, res: express.Response) => {
//   // Compress JSON responses >1KB
//   if (req.headers['x-no-compression']) {
//     return false;
//   }
//   return compression.filter(req, res);
// }}));

// CORS middleware
app.use(corsLogger);
app.use(corsMiddleware);

// Rate limiting (T228)
app.use(generalRateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (before routes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

