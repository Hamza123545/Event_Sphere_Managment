/**
 * Metrics Collection Middleware
 * Implements T260 - Prometheus metrics: request count, latency histogram, error rate, active connections
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register the metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

/**
 * HTTP Request Counter
 * Counts total HTTP requests by method, route, and status code
 */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

/**
 * HTTP Request Duration Histogram
 * Measures request duration in seconds
 */
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Custom buckets for latency
  registers: [register],
});

/**
 * Active Connections Gauge
 * Tracks number of active HTTP connections
 */
export const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

/**
 * Socket.io Active Connections Gauge
 * Tracks number of active Socket.io connections
 */
export const socketIoConnectionsActive = new client.Gauge({
  name: 'socket_io_connections_active',
  help: 'Number of active Socket.io connections',
  registers: [register],
});

/**
 * Database Connection Pool Gauge
 * Tracks MongoDB connection pool size
 */
export const mongodbConnectionsCurrent = new client.Gauge({
  name: 'mongodb_connections_current',
  help: 'Current number of MongoDB connections',
  labelNames: ['state'],
  registers: [register],
});

/**
 * Database Operations Counter
 * Counts MongoDB operations
 */
export const mongodbOperationsTotal = new client.Counter({
  name: 'mongodb_operations_total',
  help: 'Total number of MongoDB operations',
  labelNames: ['operation', 'collection'],
  registers: [register],
});

/**
 * Database Query Duration Histogram
 * Measures MongoDB query duration
 */
export const mongodbQueryDurationSeconds = new client.Histogram({
  name: 'mongodb_query_duration_seconds',
  help: 'Duration of MongoDB queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

/**
 * Cache Hit/Miss Counters
 * Tracks Redis cache performance
 */
export const redisCacheHitsTotal = new client.Counter({
  name: 'redis_cache_hits_total',
  help: 'Total number of Redis cache hits',
  registers: [register],
});

export const redisCacheMissesTotal = new client.Counter({
  name: 'redis_cache_misses_total',
  help: 'Total number of Redis cache misses',
  registers: [register],
});

/**
 * Job Queue Metrics
 * Tracks Bull queue status
 */
export const bullQueueWaiting = new client.Gauge({
  name: 'bull_queue_waiting',
  help: 'Number of jobs waiting in Bull queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullQueueActive = new client.Gauge({
  name: 'bull_queue_active',
  help: 'Number of active jobs in Bull queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullQueueCompleted = new client.Counter({
  name: 'bull_queue_completed',
  help: 'Total number of completed jobs in Bull queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullQueueFailed = new client.Counter({
  name: 'bull_queue_failed',
  help: 'Total number of failed jobs in Bull queue',
  labelNames: ['queue'],
  registers: [register],
});

/**
 * Metrics collection middleware
 * Collects HTTP request metrics: count, latency, error rate
 * Implements T260
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Increment active connections
  activeConnections.inc();

  // Get route path (normalize to handle params)
  const route = req.route?.path || req.path || 'unknown';

  // Start timer for request duration
  const startTime = Date.now();

  // Track response finish
  res.on('finish', () => {
    // Calculate duration in seconds
    const duration = (Date.now() - startTime) / 1000;

    // Decrement active connections
    activeConnections.dec();

    // Record request metrics
    const labels = {
      method: req.method,
      route: route,
      status: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, duration);
  });

  next();
}

/**
 * Metrics endpoint handler
 * Serves Prometheus metrics at /metrics
 * Implements T260
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end('Error generating metrics');
  }
}

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  activeConnections,
  socketIoConnectionsActive,
  mongodbConnectionsCurrent,
  mongodbOperationsTotal,
  mongodbQueryDurationSeconds,
  redisCacheHitsTotal,
  redisCacheMissesTotal,
  bullQueueWaiting,
  bullQueueActive,
  bullQueueCompleted,
  bullQueueFailed,
};

