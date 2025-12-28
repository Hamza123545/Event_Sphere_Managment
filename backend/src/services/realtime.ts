import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyToken, TokenPayload } from '../utils/auth';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Socket.io server setup for real-time updates
 * Implements constitutional requirement for Real-Time Architecture
 * Per contracts/realtime-events.md: JWT authentication, room management
 */

let io: SocketIOServer | null = null;

// Connection tracking (T135)
const activeConnections = new Map<string, Set<string>>(); // room -> Set<socketId>
const socketToRooms = new Map<string, Set<string>>(); // socketId -> Set<room>

// Broadcast queue for optimization
interface QueuedBroadcast {
  expoId: string;
  event: string;
  data: unknown;
  timestamp: number;
}

let broadcastQueue: QueuedBroadcast[] = [];
let broadcastTimer: NodeJS.Timeout | null = null;

/**
 * Extract and verify JWT token from socket handshake
 * @param socket Socket.IO socket instance
 * @returns Decoded token payload or null if invalid
 */
function authenticateSocket(socket: Socket): TokenPayload | null {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Socket connection rejected: No token provided', {
        socketId: socket.id,
      });
      return null;
    }

    const decoded = verifyToken(token as string);
    return decoded;
  } catch (error) {
    logger.warn('Socket authentication failed', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Setup Socket.io server with JWT authentication and room management
 * Implements T239 - Redis adapter for Socket.io (enable horizontal scaling)
 * @param httpServer HTTP server instance
 * @returns Socket.IO server instance
 */
export async function setupSocketIO(httpServer: HTTPServer): Promise<SocketIOServer> {
  if (io) {
    return io;
  }

  // Socket.io CORS configuration - match the same origins as regular CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://event-sphere-managment.vercel.app'];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn('Socket.io CORS: Origin not allowed', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup Redis adapter for horizontal scaling (T239)
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    pubClient.on('error', (err) => {
      logger.error('Redis pub client error:', err);
    });

    subClient.on('error', (err) => {
      logger.error('Redis sub client error:', err);
    });

    logger.info('Socket.io Redis adapter initialized for horizontal scaling');
  } catch (error) {
    logger.warn('Failed to setup Redis adapter for Socket.io, using default adapter:', error);
    // Continue without Redis adapter - single instance will work fine
  }

  // Authentication middleware
  io.use((socket, next) => {
    const user = authenticateSocket(socket);

    if (!user) {
      return next(new Error('Authentication failed'));
    }

    // Attach user to socket data
    socket.data.user = user;
    next();
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as TokenPayload;

    logger.info('Socket connected', {
      socketId: socket.id,
      userId: user.userId,
      role: user.role,
    });

    // Join expo-specific room
    socket.on('join-expo', (expoId: string) => {
      const room = `expo-${expoId}`;
      socket.join(room);
      
      // Track connection
      if (!activeConnections.has(room)) {
        activeConnections.set(room, new Set());
      }
      activeConnections.get(room)!.add(socket.id);
      
      if (!socketToRooms.has(socket.id)) {
        socketToRooms.set(socket.id, new Set());
      }
      socketToRooms.get(socket.id)!.add(room);
      
      logger.info('User joined expo room', {
        socketId: socket.id,
        userId: user.userId,
        expoId,
        room,
        connectionsInRoom: activeConnections.get(room)!.size,
      });
    });

    // Join user-specific room for personal updates (e.g., exhibitor approvals)
    socket.on('join-user', () => {
      const userRoom = `user-${user.userId}`;
      socket.join(userRoom);
      logger.debug('User joined personal room', {
        socketId: socket.id,
        userId: user.userId,
        room: userRoom,
      });
    });

    // Auto-join role-specific rooms
    if (user.role === 'exhibitor') {
      const exhibitorRoom = `exhibitor-${user.userId}`;
      socket.join(exhibitorRoom);
      logger.debug('Exhibitor joined role-specific room', {
        socketId: socket.id,
        userId: user.userId,
        room: exhibitorRoom,
      });
    } else if (user.role === 'organizer') {
      const organizerRoom = `organizer-${user.userId}`;
      socket.join(organizerRoom);
      logger.debug('Organizer joined role-specific room', {
        socketId: socket.id,
        userId: user.userId,
        room: organizerRoom,
      });
    }

    // Leave expo room
    socket.on('leave-expo', (expoId: string) => {
      const room = `expo-${expoId}`;
      socket.leave(room);
      
      // Update connection tracking
      activeConnections.get(room)?.delete(socket.id);
      socketToRooms.get(socket.id)?.delete(room);
      
      // Clean up empty rooms
      if (activeConnections.get(room)?.size === 0) {
        activeConnections.delete(room);
      }
      if (socketToRooms.get(socket.id)?.size === 0) {
        socketToRooms.delete(socket.id);
      }
      
      logger.info('User left expo room', {
        socketId: socket.id,
        userId: user.userId,
        expoId,
        room,
        connectionsInRoom: activeConnections.get(room)?.size || 0,
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      // Clean up connection tracking
      const rooms = socketToRooms.get(socket.id);
      if (rooms) {
        rooms.forEach((room) => {
          activeConnections.get(room)?.delete(socket.id);
          if (activeConnections.get(room)?.size === 0) {
            activeConnections.delete(room);
          }
        });
        socketToRooms.delete(socket.id);
      }
      
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: user.userId,
        reason,
        roomsLeft: rooms ? Array.from(rooms) : [],
      });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: user.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  });

  logger.info('Socket.io server initialized');
  
  // Setup MongoDB Change Streams for real-time triggers (T134)
  setupChangeStreams();
  
  return io;
}

/**
 * Setup MongoDB Change Streams to watch collections for real-time updates (T134)
 * Watches ExpoEvent, Session, and BoothSpace collections
 * Note: MongoDB collection names are lowercase pluralized by Mongoose
 */
function setupChangeStreams(): void {
  // Wait for connection to be ready
  if (mongoose.connection.readyState !== 1) {
    logger.warn('MongoDB not connected, Change Streams will be initialized after connection');
    mongoose.connection.once('connected', () => {
      initializeChangeStreams();
    });
    return;
  }

  initializeChangeStreams();
}

function initializeChangeStreams(): void {
  if (!mongoose.connection.db) {
    logger.warn('MongoDB database not available, skipping Change Streams setup');
    return;
  }

  try {
    // Watch ExpoEvent collection for updates
    // Mongoose uses lowercase pluralized collection names: 'expoevents'
    const expoEventStream = mongoose.connection.collection('expoevents').watch(
      [
        {
          $match: {
            operationType: { $in: ['update', 'replace'] },
          },
        },
      ],
      { fullDocument: 'updateLookup' }
    );

    expoEventStream.on('change', (change: any) => {
      logger.debug('ExpoEvent change detected', {
        operationType: change.operationType,
        documentKey: change.documentKey,
      });

      // Handle expo updates via change streams
      // Note: We also handle this in expoService.updateExpo, but this provides redundancy
      // Change streams are mainly for monitoring and catching external database changes
      if (change.operationType === 'update' && change.fullDocument) {
        // The expoService.updateExpo already broadcasts, so we don't duplicate here
        // Log for monitoring purposes
        logger.debug('ExpoEvent updated via change stream', {
          expoId: change.documentKey._id.toString(),
          updatedFields: change.updateDescription?.updatedFields,
        });
      }
    });

    expoEventStream.on('error', (error: any) => {
      // MongoDB Change Streams require replica sets - expected error in local dev
      if (error?.code === 40573 || error?.codeName === 'Location40573' || 
          error?.message?.includes('replica sets')) {
        logger.warn('Change Streams not available (replica set required). Real-time updates via change streams disabled. Service-layer broadcasts still work.');
      } else {
        logger.error('ExpoEvent change stream error:', error);
      }
    });

    // Watch Session collection for deletions
    const sessionStream = mongoose.connection.collection('sessions').watch(
      [
        {
          $match: {
            operationType: 'delete',
          },
        },
      ]
    );

    sessionStream.on('change', (change: any) => {
      logger.debug('Session deletion detected via change stream', {
        operationType: change.operationType,
        sessionId: change.documentKey._id.toString(),
      });

      // Note: We can't get expoId from delete operation, so we rely on service layer broadcasts
      // This is mainly for monitoring and future enhancements
      // The deleteSession service function already broadcasts session-deleted event
    });

    sessionStream.on('error', (error: any) => {
      // MongoDB Change Streams require replica sets - expected error in local dev
      if (error?.code === 40573 || error?.codeName === 'Location40573' || 
          error?.message?.includes('replica sets')) {
        // Already logged by expoEventStream, skip duplicate warning
        return;
      }
      logger.error('Session change stream error:', error);
    });

    // Watch BoothSpace collection for updates (booth allocations)
    const boothSpaceStream = mongoose.connection.collection('boothspaces').watch(
      [
        {
          $match: {
            operationType: { $in: ['update', 'replace'] },
            'updateDescription.updatedFields.status': { $exists: true },
          },
        },
      ],
      { fullDocument: 'updateLookup' }
    );

    boothSpaceStream.on('change', (change: any) => {
      logger.debug('BoothSpace change detected', {
        operationType: change.operationType,
        documentKey: change.documentKey,
      });

      // Handle booth status changes
      // Note: floorPlanService.assignExhibitorToBooth already broadcasts, so this is redundant
      // Change streams provide monitoring and can catch external changes
      if (change.operationType === 'update' && change.fullDocument) {
        const booth = change.fullDocument;
        const expoId = booth.expo?.toString();
        
        if (expoId && booth.status) {
          if (booth.status === 'occupied' || booth.status === 'reserved') {
            // Booth allocated - already handled by service layer, but can be used for monitoring
            logger.debug('Booth allocated via change stream', {
              boothId: change.documentKey._id.toString(),
              expoId,
              status: booth.status,
            });
          } else if (booth.status === 'available') {
            // Booth released - already handled by service layer
            logger.debug('Booth released via change stream', {
              boothId: change.documentKey._id.toString(),
              expoId,
            });
          }
        }
      }
    });

    boothSpaceStream.on('error', (error: any) => {
      // MongoDB Change Streams require replica sets - expected error in local dev
      if (error?.code === 40573 || error?.codeName === 'Location40573' || 
          error?.message?.includes('replica sets')) {
        // Already logged by expoEventStream, skip duplicate warning
        return;
      }
      logger.error('BoothSpace change stream error:', error);
    });

    logger.info('MongoDB Change Streams initialized', {
      collections: ['expoevents', 'sessions', 'boothspaces'],
    });
  } catch (error) {
    logger.error('Failed to setup Change Streams:', error);
    // Don't throw - Change Streams are optional enhancement
    // The application will still work with service-layer broadcasts
    // This is mainly for monitoring and catching external database changes
  }
}

/**
 * Initialize Change Streams after MongoDB connection is established
 * Called from setupSocketIO after connection is ready
 */
export function initializeChangeStreamsAfterConnection(): void {
  if (mongoose.connection.readyState === 1) {
    initializeChangeStreams();
  }
}

/**
 * Get Socket.IO server instance
 * @returns Socket.IO server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call setupSocketIO first.');
  }
  return io;
}

/**
 * Process broadcast queue with batching and deduplication
 */
function processBroadcastQueue(): void {
  if (broadcastQueue.length === 0) return;

  // Group by room and event type for deduplication
  const broadcastMap = new Map<string, QueuedBroadcast>();

  broadcastQueue.forEach((item) => {
    const key = `${item.expoId}:${item.event}`;
    // Keep the most recent event for each room:event combination
    const existing = broadcastMap.get(key);
    if (!existing || item.timestamp > existing.timestamp) {
      broadcastMap.set(key, item);
    }
  });

  // Execute broadcasts
  broadcastMap.forEach((item) => {
    const room = `expo-${item.expoId}`;
    if (io) {
      io.to(room).emit(item.event, item.data);
      logger.debug('Broadcasted event to expo room', {
        expoId: item.expoId,
        room,
        event: item.event,
        connectionsInRoom: activeConnections.get(room)?.size || 0,
      });
    }
  });

  // Clear queue
  broadcastQueue = [];
  broadcastTimer = null;
}

/**
 * Broadcast event to all users in an expo room
 * Optimized with batching and deduplication (T136)
 * @param expoId Expo ID
 * @param event Event name
 * @param data Event data
 */
export function broadcastToExpo(expoId: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn('Attempted to broadcast but Socket.IO server not initialized');
    return;
  }

  // Add to queue
  broadcastQueue.push({
    expoId,
    event,
    data,
    timestamp: Date.now(),
  });

  // Batch broadcasts within 100ms window
  if (!broadcastTimer) {
    broadcastTimer = setTimeout(() => {
      processBroadcastQueue();
    }, 100);
  }

  // If queue gets too large, process immediately
  if (broadcastQueue.length > 50) {
    if (broadcastTimer) {
      clearTimeout(broadcastTimer);
      broadcastTimer = null;
    }
    processBroadcastQueue();
  }
}

/**
 * Broadcast to user-specific room (e.g., user-{userId})
 * @param userId User ID
 * @param event Event name
 * @param data Event data
 */
export function broadcastToUser(userId: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn('Attempted to broadcast but Socket.IO server not initialized');
    return;
  }

  const room = `user-${userId}`;
  io.to(room).emit(event, data);
  logger.debug('Broadcasted event to user room', {
    userId,
    room,
    event,
  });
}

/**
 * Broadcast to exhibitor-specific room (exhibitor-{userId})
 * Used for exhibitor approval/rejection notifications
 * @param userId User ID
 * @param event Event name
 * @param data Event data
 */
export function broadcastToExhibitor(userId: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn('Attempted to broadcast but Socket.IO server not initialized');
    return;
  }

  const room = `exhibitor-${userId}`;
  io.to(room).emit(event, data);
  logger.debug('Broadcasted event to exhibitor room', {
    userId,
    room,
    event,
  });
}

/**
 * Get connection statistics
 * @returns Connection stats per room
 */
export function getConnectionStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  activeConnections.forEach((connections, room) => {
    stats[room] = connections.size;
  });
  return stats;
}

