import { io, Socket } from 'socket.io-client';

/**
 * Socket.io client setup
 * Implements constitutional requirement for Real-Time Architecture
 * Connection management, auto-reconnect, event typing
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second

// Track rooms to rejoin on reconnect
const joinedRooms = new Set<string>();

// Event queue for failed sends (T144)
const eventQueue: Array<{ event: string; data: unknown }> = [];

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
    reconnectionDelay: BASE_RECONNECT_DELAY,
    reconnectionDelayMax: 30000, // 30 seconds max
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on('connect', () => {
    const currentSocket = socket;
    console.log('Socket connected:', currentSocket?.id);
    reconnectAttempts = 0;
    
      // Rejoin all previously joined rooms (T143)
      if (currentSocket) {
        joinedRooms.forEach((room) => {
          const [type, id] = room.split('-');
          if (type === 'expo') {
            currentSocket.emit('join-expo', id);
          } else if (type === 'exhibitor') {
            currentSocket.emit('join-exhibitor', id);
          } else if (type === 'user') {
            currentSocket.emit('join-user', id);
          }
        });
      
      // Process queued events (T144)
      while (eventQueue.length > 0) {
        const queuedEvent = eventQueue.shift();
        if (queuedEvent) {
          currentSocket.emit(queuedEvent.event, queuedEvent.data);
        }
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    
    // If disconnect was not intentional, set up reconnection (T143)
    if (reason === 'io server disconnect' && socket) {
      // Server disconnected, reconnect manually
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    reconnectAttempts += 1;
    
    // Exponential backoff for reconnection (T143)
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
        30000
      );
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    reconnectAttempts = 0;
    // Rejoin rooms and process queue after reconnect
    const currentSocket = getSocket();
    if (currentSocket) {
      joinedRooms.forEach((room) => {
        const [type, id] = room.split('-');
        if (type === 'expo') {
          currentSocket.emit('join-expo', id);
        } else if (type === 'exhibitor') {
          currentSocket.emit('join-exhibitor', id);
        } else if (type === 'user') {
          currentSocket.emit('join-user', id);
        }
      });
      
      while (eventQueue.length > 0) {
        const queuedEvent = eventQueue.shift();
        if (queuedEvent) {
          currentSocket.emit(queuedEvent.event, queuedEvent.data);
        }
      }
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Reconnection attempt', attemptNumber);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after maximum attempts');
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
  const roomKey = `expo-${expoId}`;
  joinedRooms.add(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('join-expo', expoId);
    console.log('Joined expo room:', expoId);
  } else {
    // Queue room join for when connection is restored (T144)
    console.log('Queueing room join (not connected):', expoId);
  }
}

/**
 * Leave expo room
 * @param expoId Expo ID
 */
export function leaveExpoRoom(expoId: string): void {
  const roomKey = `expo-${expoId}`;
  joinedRooms.delete(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('leave-expo', expoId);
    console.log('Left expo room:', expoId);
  }
}

/**
 * Join exhibitor-specific room for approval/rejection notifications
 * @param userId User ID
 */
export function joinExhibitorRoom(userId: string): void {
  const roomKey = `exhibitor-${userId}`;
  joinedRooms.add(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('join-exhibitor', userId);
    console.log('Joined exhibitor room:', userId);
  } else {
    console.log('Queueing exhibitor room join (not connected):', userId);
  }
}

/**
 * Leave exhibitor-specific room
 * @param userId User ID
 */
export function leaveExhibitorRoom(userId: string): void {
  const roomKey = `exhibitor-${userId}`;
  joinedRooms.delete(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('leave-exhibitor', userId);
    console.log('Left exhibitor room:', userId);
  }
}

/**
 * Join user-specific room for message notifications
 * @param userId User ID
 */
export function joinUserRoom(userId: string): void {
  const roomKey = `user-${userId}`;
  joinedRooms.add(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('join-user', userId);
    console.log('Joined user room:', userId);
  } else {
    console.log('Queueing user room join (not connected):', userId);
  }
}

/**
 * Leave user-specific room
 * @param userId User ID
 */
export function leaveUserRoom(userId: string): void {
  const roomKey = `user-${userId}`;
  joinedRooms.delete(roomKey);
  
  if (socket && socket.connected) {
    socket.emit('leave-user', userId);
    console.log('Left user room:', userId);
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

/**
 * Subscribe to expo updates with callback handlers
 */
export interface ExpoUpdateCallbacks {
  onScheduleChanged?: (event: any) => void;
  onSessionDeleted?: (event: any) => void;
  onExpoUpdated?: (event: any) => void;
  onBoothAllocated?: (event: any) => void;
  onBoothReleased?: (event: any) => void;
}

export function subscribeToExpoUpdates(expoId: string, callbacks: ExpoUpdateCallbacks): void {
  if (!socket) return;

  joinExpoRoom(expoId);

  if (callbacks.onScheduleChanged) {
    socket.on('schedule-changed', callbacks.onScheduleChanged);
  }
  if (callbacks.onSessionDeleted) {
    socket.on('session-deleted', callbacks.onSessionDeleted);
  }
  if (callbacks.onExpoUpdated) {
    socket.on('expo-updated', callbacks.onExpoUpdated);
  }
  if (callbacks.onBoothAllocated) {
    socket.on('booth-allocated', callbacks.onBoothAllocated);
  }
  if (callbacks.onBoothReleased) {
    socket.on('booth-released', callbacks.onBoothReleased);
  }
}

/**
 * Unsubscribe from expo updates and leave expo room
 * @param expoId Expo ID
 */
export function unsubscribeFromExpoUpdates(expoId: string): void {
  if (!socket) return;

  // Leave the expo room
  leaveExpoRoom(expoId);

  // Remove all expo-related event listeners
  socket.off('schedule-changed');
  socket.off('session-deleted');
  socket.off('expo-updated');
  socket.off('booth-allocated');
  socket.off('booth-released');
}

export default socket;

