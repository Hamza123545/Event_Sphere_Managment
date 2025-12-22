import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '../utils/auth';
import { logger } from '../utils/logger';

/**
 * Socket.io server setup for real-time updates
 * Implements constitutional requirement for Real-Time Architecture
 * Per contracts/realtime-events.md: JWT authentication, room management
 */

let io: SocketIOServer | null = null;

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
 * @param httpServer HTTP server instance
 * @returns Socket.IO server instance
 */
export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

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
      logger.debug('User joined expo room', {
        socketId: socket.id,
        userId: user.userId,
        expoId,
        room,
      });
    });

    // Leave expo room
    socket.on('leave-expo', (expoId: string) => {
      const room = `expo-${expoId}`;
      socket.leave(room);
      logger.debug('User left expo room', {
        socketId: socket.id,
        userId: user.userId,
        expoId,
        room,
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: user.userId,
        reason,
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
  return io;
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
 * Broadcast event to all users in an expo room
 * @param expoId Expo ID
 * @param event Event name
 * @param data Event data
 */
export function broadcastToExpo(expoId: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn('Attempted to broadcast but Socket.IO server not initialized');
    return;
  }

  const room = `expo-${expoId}`;
  io.to(room).emit(event, data);
  logger.debug('Broadcasted event to expo room', {
    expoId,
    room,
    event,
  });
}

