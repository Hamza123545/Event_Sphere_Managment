import { io, Socket } from 'socket.io-client';

/**
 * Socket.io client setup
 * Implements constitutional requirement for Real-Time Architecture
 * Connection management, auto-reconnect, event typing
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Initialize Socket.io connection with JWT authentication
 * @param token JWT authentication token
 * @returns Socket instance
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

/**
 * Disconnect Socket.io connection
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get current Socket instance
 * @returns Socket instance or null if not connected
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Join expo room for real-time updates
 * @param expoId Expo ID
 */
export function joinExpoRoom(expoId: string): void {
  if (socket && socket.connected) {
    socket.emit('join-expo', expoId);
    console.log('Joined expo room:', expoId);
  }
}

/**
 * Leave expo room
 * @param expoId Expo ID
 */
export function leaveExpoRoom(expoId: string): void {
  if (socket && socket.connected) {
    socket.emit('leave-expo', expoId);
    console.log('Left expo room:', expoId);
  }
}

/**
 * Subscribe to socket event
 * @param event Event name
 * @param callback Event handler
 */
export function onSocketEvent(event: string, callback: (data: unknown) => void): void {
  if (socket) {
    socket.on(event, callback);
  }
}

/**
 * Unsubscribe from socket event
 * @param event Event name
 * @param callback Event handler (optional, removes all listeners if not provided)
 */
export function offSocketEvent(event: string, callback?: (data: unknown) => void): void {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
}

export default socket;

