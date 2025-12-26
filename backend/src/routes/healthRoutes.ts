/**
 * Health Check Routes
 * Implements T259 - Health check endpoint with status, uptime, database connection, version
 */

import { Router, Request, Response } from 'express';
import database from '../config/database';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 * Returns: status, uptime, database connection status, version
 * Per T259
 */
router.get('/', async (_req: Request, res: Response) => {
  const startTime = process.uptime();
  const isConnected = database.getConnectionStatus();
  const dbStatus = isConnected ? 'connected' : 'disconnected';
  
  const status = isConnected ? 'healthy' : 'unhealthy';
  const httpStatus = isConnected ? 200 : 503;
  
  res.status(httpStatus).json({
    success: isConnected,
    status,
    message: 'EventSphere API Health Check',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(startTime),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    version: '1.0.0',
    checks: {
      database: isConnected,
    },
  });
});

export default router;
