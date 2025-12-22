import winston from 'winston';
import fs from 'fs';
import path from 'path';

/**
 * Structured logging utility using Winston
 * Implements constitutional requirement for observability and monitoring
 * Logs all critical operations with appropriate detail levels
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  // Write all logs to console
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
];

// Add file transports if logs directory exists (will be created in server startup)
function addFileTransportsIfAvailable(): void {
  const logsDir = path.join(process.cwd(), 'logs');
  if (fs.existsSync(logsDir)) {
    transports.push(
      // Write error logs to error.log
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
      }),
      // Write all logs to combined.log
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
      })
    );
  }
}

// Try to add file transports on module load (will be re-added in server.ts after directory creation)
addFileTransportsIfAvailable();

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  format: logFormat,
  defaultMeta: { service: 'eventsphere-backend' },
  transports,
});

export default logger;
