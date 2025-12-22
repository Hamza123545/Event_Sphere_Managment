// Load environment variables FIRST before any other imports
// Using require to ensure this runs before ES module imports
require('dotenv').config();

import http from 'http';
import app from './app';
import database from './config/database';
import { logger } from './utils/logger';
import routes from './routes';
import { setupSocketIO } from './services/realtime';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

/**
 * Server entry point
 * Handles HTTP server, MongoDB connection, Socket.io initialization, and graceful shutdown
 * Implements constitutional requirements for reliability and observability
 */

// Mount API routes
app.use('/api/v1', routes);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io for real-time updates
setupSocketIO(server);

/**
 * Start server function
 */
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await database.connect(MONGODB_URI as string);
    logger.info('MongoDB connected successfully');

    // Create logs directory if it doesn't exist (for Winston file transports)
    const fs = await import('fs');
    const path = await import('path');
    const winston = await import('winston');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      // Re-add file transports after directory is created
      logger.add(
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
        })
      );
      logger.add(
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
        })
      );
    }

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connection
      await database.disconnect();
      logger.info('Database disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
}

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default server;

