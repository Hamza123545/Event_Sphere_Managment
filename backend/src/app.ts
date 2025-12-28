import express, { Application } from 'express';
import path from 'path';
import helmet from 'helmet';
// @ts-expect-error - compression types not available, but package is installed
import compression from 'compression';
import corsMiddleware, { corsLogger } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimit';
import healthRoutes from './routes/healthRoutes';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';
import apiDocsRoutes from './routes/apiDocsRoutes';

/**
 * Express application setup
 * Implements constitutional requirements for security, observability, and error handling
 */

const app: Application = express();

// Security middleware (must be first)
// Helmet sets various HTTP headers to help protect the app (T234)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://localhost:7860', 'ws://localhost:5000', 'ws://localhost:7860', 'https://unpkg.com', 'https://event-sphere-managment.vercel.app', 'https://event-sphere-managment-vqvw.vercel.app'],
        fontSrc: ["'self'", 'https://unpkg.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
    crossOriginResourcePolicy: false, // Allow cross-origin resources for API endpoints
  })
);

// Compression middleware (T243)
// Compress JSON responses >1KB
app.use(compression({
  filter: (req: express.Request, res: express.Response) => {
    // Don't compress responses with this header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter for JSON/text content
    return compression.filter(req, res);
  },
}));

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

// Structured request logging middleware - Implements T257
app.use(requestLogger);

// Metrics collection middleware - Implements T260
app.use(metricsMiddleware);

// Health check routes (before API routes) - Implements T259
app.use('/health', healthRoutes);

// API Documentation (Swagger UI) - Implements T268
app.use('/api-docs', apiDocsRoutes);

// Metrics endpoint - Implements T260
app.get('/metrics', metricsHandler);

// Import API routes
import routes from './routes';

// API routes
app.use('/api/v1', routes);

// 404 handler (before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

