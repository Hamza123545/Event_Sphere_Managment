# Real-Time Events Specification: EventSphere Management Platform

**Feature Branch**: `001-expo-management-platform`
**Created**: 2025-12-22
**Technology**: Socket.io (WebSocket with fallback to HTTP long-polling)
**Status**: Draft

## Overview

This document defines all real-time event specifications for EventSphere Management Platform using Socket.io. The platform requires real-time updates for schedule changes, booth allocations, and event modifications to propagate to all affected users within 5 seconds (FR-034, FR-035, FR-036).

---

## Architecture

### Connection Model

```
Client (Browser)
    ↓
Socket.io Client Library
    ↓
WebSocket Connection (or long-polling fallback)
    ↓
Socket.io Server (Node.js + Express)
    ↓
Room-Based Broadcasting (expo-specific channels)
    ↓
MongoDB Change Streams (for data sync)
```

### Room Structure

EventSphere uses **rooms** to scope broadcasts to relevant users:

- `expo-{expoId}`: All users viewing/participating in a specific expo
- `user-{userId}`: User-specific notifications
- `organizer-{userId}`: Organizer-specific updates
- `exhibitor-{userId}`: Exhibitor-specific updates

**Example**: When a schedule changes for "Tech Expo 2025" (expoId: `507f1f77bcf86cd799439011`), the server broadcasts to room `expo-507f1f77bcf86cd799439011`, reaching all connected users viewing that expo.

---

## Server-Side Implementation

### Server Setup

```typescript
// backend/src/services/realtime.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  // Middleware for JWT authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    try {
      const user = await verifyJWT(token); // Custom JWT verification
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.userId} (${socket.data.user.role})`);

    handleConnection(socket, io);
  });

  return io;
}

function handleConnection(socket: Socket, io: Server) {
  // Join user-specific room
  socket.join(`user-${socket.data.user.userId}`);

  // Join role-specific room if organizer/exhibitor
  if (socket.data.user.role === 'organizer') {
    socket.join(`organizer-${socket.data.user.userId}`);
  } else if (socket.data.user.role === 'exhibitor') {
    socket.join(`exhibitor-${socket.data.user.userId}`);
  }

  // Event handlers
  socket.on('join-expo', (data) => handleJoinExpo(socket, data));
  socket.on('leave-expo', (data) => handleLeaveExpo(socket, data));
  socket.on('disconnect', () => handleDisconnect(socket));
}
```

---

## Client-Server Events

### 1. Connection Management

#### **Client → Server: Connection Initiation**

**Event**: `connection` (automatic)

**Payload**:
```typescript
// Sent via handshake auth
{
  token: string; // JWT authentication token
}
```

**Business Logic**:
- Verifies JWT token
- Extracts user information (userId, role)
- Joins user to `user-{userId}` room
- Joins role-specific rooms

**Response**: None (connection established or rejected)

---

#### **Client → Server: join-expo**

**Event**: `join-expo`

**Description**: Client joins expo-specific room to receive updates for that expo.

**Payload**:
```typescript
{
  expoId: string; // Expo ID to join
}
```

**Example**:
```typescript
// Frontend
socket.emit('join-expo', { expoId: '507f1f77bcf86cd799439011' });
```

**Server Handler**:
```typescript
function handleJoinExpo(socket: Socket, data: { expoId: string }) {
  const { expoId } = data;

  // Validate expo exists and user has access
  if (!validateExpoAccess(socket.data.user, expoId)) {
    socket.emit('error', { message: 'Access denied to this expo' });
    return;
  }

  // Join expo room
  socket.join(`expo-${expoId}`);

  console.log(`User ${socket.data.user.userId} joined expo ${expoId}`);

  // Acknowledge join
  socket.emit('expo-joined', { expoId });
}
```

**Response Event**: `expo-joined`

**Response Payload**:
```typescript
{
  expoId: string;
}
```

---

#### **Client → Server: leave-expo**

**Event**: `leave-expo`

**Description**: Client leaves expo-specific room.

**Payload**:
```typescript
{
  expoId: string;
}
```

**Server Handler**:
```typescript
function handleLeaveExpo(socket: Socket, data: { expoId: string }) {
  const { expoId } = data;
  socket.leave(`expo-${expoId}`);
  console.log(`User ${socket.data.user.userId} left expo ${expoId}`);
}
```

---

#### **Server → Client: disconnect**

**Event**: `disconnect` (automatic)

**Description**: Client connection lost (user closed browser, network issue).

**Server Handler**:
```typescript
function handleDisconnect(socket: Socket) {
  console.log(`User disconnected: ${socket.data.user.userId}`);
  // Cleanup logic if needed
}
```

---

### 2. Schedule Updates (FR-034)

#### **Server → Client: schedule-changed**

**Event**: `schedule-changed`

**Description**: Session schedule has been updated (time, location, speaker changes).

**Trigger**: Organizer updates session via `PUT /api/v1/expos/{expoId}/sessions/{sessionId}`

**Broadcast Target**: Room `expo-{expoId}`

**Payload**:
```typescript
{
  type: 'schedule-changed';
  expoId: string;
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: string; // ISO 8601
      endTime: string;
      duration: number;
    };
    location: {
      room: string;
      building?: string;
    };
    changeType: 'time' | 'location' | 'speaker' | 'cancellation';
  };
  timestamp: string; // ISO 8601
}
```

**Example**:
```typescript
// Server broadcast
io.to(`expo-${expoId}`).emit('schedule-changed', {
  type: 'schedule-changed',
  expoId: '507f1f77bcf86cd799439011',
  session: {
    sessionId: '507f1f77bcf86cd799439022',
    title: 'Keynote - AI in Enterprise',
    schedule: {
      startTime: '2025-06-15T10:30:00Z', // Changed from 10:00
      endTime: '2025-06-15T11:30:00Z',
      duration: 60,
    },
    location: {
      room: 'Ballroom A', // Changed from Main Hall
      building: 'North Wing',
    },
    changeType: 'time',
  },
  timestamp: '2025-06-14T15:00:00Z',
});
```

**Client Handler**:
```typescript
// Frontend
socket.on('schedule-changed', (data) => {
  console.log('Schedule updated:', data);

  // Update UI with new schedule
  updateSessionInSchedule(data.session);

  // Show notification to user
  showNotification(`Session "${data.session.title}" time/location changed`);

  // If user bookmarked this session, highlight change
  if (isBookmarked(data.session.sessionId)) {
    highlightSessionChange(data.session);
  }
});
```

**Business Rules**:
- Updates must propagate within 5 seconds (FR-034)
- All users in `expo-{expoId}` room receive update
- Users with bookmarked sessions receive additional in-app notification
- Email notifications sent asynchronously (background job)

---

#### **Server → Client: session-deleted**

**Event**: `session-deleted`

**Description**: Session has been cancelled/deleted from schedule.

**Trigger**: Organizer deletes session via `DELETE /api/v1/expos/{expoId}/sessions/{sessionId}`

**Broadcast Target**: Room `expo-{expoId}`

**Payload**:
```typescript
{
  type: 'session-deleted';
  expoId: string;
  sessionId: string;
  sessionTitle: string;
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`expo-${expoId}`).emit('session-deleted', {
  type: 'session-deleted',
  expoId: '507f1f77bcf86cd799439011',
  sessionId: '507f1f77bcf86cd799439022',
  sessionTitle: 'Workshop - Cloud Migration Strategies',
  timestamp: '2025-06-14T15:05:00Z',
});
```

---

### 3. Booth Allocation Updates (FR-035)

#### **Server → Client: booth-allocated**

**Event**: `booth-allocated`

**Description**: Booth space has been reserved or assigned to an exhibitor.

**Trigger**:
- Exhibitor reserves booth via `POST /api/v1/exhibitor/expos/{expoId}/booths/{boothId}/reserve`
- Organizer assigns booth via `POST /api/v1/expos/{expoId}/booths/{boothId}/assign`

**Broadcast Target**: Room `expo-{expoId}`

**Payload**:
```typescript
{
  type: 'booth-allocated';
  expoId: string;
  booth: {
    boothId: string;
    identifier: string; // e.g., "A-101"
    status: 'reserved' | 'occupied';
    exhibitor: {
      exhibitorId: string;
      companyName: string;
      logo?: string;
    };
  };
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`expo-${expoId}`).emit('booth-allocated', {
  type: 'booth-allocated',
  expoId: '507f1f77bcf86cd799439011',
  booth: {
    boothId: '507f1f77bcf86cd799439055',
    identifier: 'A-101',
    status: 'reserved',
    exhibitor: {
      exhibitorId: '507f1f77bcf86cd799439040',
      companyName: 'TechCorp Solutions',
      logo: 'https://cdn.eventsphere.com/logos/techcorp.png',
    },
  },
  timestamp: '2025-06-14T15:10:00Z',
});
```

**Client Handler**:
```typescript
socket.on('booth-allocated', (data) => {
  console.log('Booth allocated:', data);

  // Update floor plan UI
  updateBoothStatus(data.booth.boothId, {
    status: data.booth.status,
    exhibitor: data.booth.exhibitor,
  });

  // Remove from available booths list if viewing booth selection
  removeFromAvailableBooths(data.booth.boothId);
});
```

**Business Rules**:
- Updates must propagate within 5 seconds (FR-035)
- Prevents concurrent booth reservations (optimistic locking on server)
- Exhibitors viewing floor plan see real-time availability
- Organizers see booth assignments update live

---

#### **Server → Client: booth-released**

**Event**: `booth-released`

**Description**: Booth space has been released and is now available.

**Trigger**:
- Exhibitor cancels reservation
- Organizer unassigns booth
- Reservation timeout

**Broadcast Target**: Room `expo-{expoId}`

**Payload**:
```typescript
{
  type: 'booth-released';
  expoId: string;
  booth: {
    boothId: string;
    identifier: string;
    status: 'available';
  };
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`expo-${expoId}`).emit('booth-released', {
  type: 'booth-released',
  expoId: '507f1f77bcf86cd799439011',
  booth: {
    boothId: '507f1f77bcf86cd799439055',
    identifier: 'A-101',
    status: 'available',
  },
  timestamp: '2025-06-14T16:00:00Z',
});
```

---

### 4. Expo Event Updates (FR-036)

#### **Server → Client: expo-updated**

**Event**: `expo-updated`

**Description**: Expo event details have been modified (date, location, theme).

**Trigger**: Organizer updates expo via `PUT /api/v1/expos/{expoId}`

**Broadcast Target**: Room `expo-{expoId}`

**Payload**:
```typescript
{
  type: 'expo-updated';
  expoId: string;
  changes: {
    field: 'dateRange' | 'location' | 'title' | 'description' | 'theme' | 'status';
    oldValue: any;
    newValue: any;
  }[];
  expo: {
    title: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    location?: {
      venueName: string;
      city: string;
      country: string;
    };
    theme?: string;
    status?: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  };
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`expo-${expoId}`).emit('expo-updated', {
  type: 'expo-updated',
  expoId: '507f1f77bcf86cd799439011',
  changes: [
    {
      field: 'dateRange',
      oldValue: { startDate: '2025-06-15T09:00:00Z', endDate: '2025-06-17T18:00:00Z' },
      newValue: { startDate: '2025-06-16T09:00:00Z', endDate: '2025-06-18T18:00:00Z' },
    },
  ],
  expo: {
    title: 'Tech Expo 2025',
    dateRange: {
      startDate: '2025-06-16T09:00:00Z', // Postponed by 1 day
      endDate: '2025-06-18T18:00:00Z',
    },
    location: {
      venueName: 'Moscone Convention Center',
      city: 'San Francisco',
      country: 'United States',
    },
    theme: 'Innovation & Digital Transformation',
    status: 'upcoming',
  },
  timestamp: '2025-06-10T10:00:00Z',
});
```

**Client Handler**:
```typescript
socket.on('expo-updated', (data) => {
  console.log('Expo updated:', data);

  // Update expo details in UI
  updateExpoDetails(data.expo);

  // Show prominent notification for critical changes (date, cancellation)
  if (data.changes.some(c => c.field === 'dateRange' || c.field === 'status')) {
    showCriticalNotification(
      `Important: ${data.expo.title} details changed`,
      data.changes
    );
  }

  // If expo cancelled, show alert
  if (data.expo.status === 'cancelled') {
    showAlert(`${data.expo.title} has been cancelled`);
  }
});
```

---

### 5. User-Specific Notifications

#### **Server → Client: exhibitor-approved**

**Event**: `exhibitor-approved`

**Description**: Exhibitor application has been approved.

**Trigger**: Organizer approves exhibitor via `POST /api/v1/expos/{expoId}/exhibitors/{exhibitorId}/approve`

**Broadcast Target**: Room `exhibitor-{userId}` (specific exhibitor user)

**Payload**:
```typescript
{
  type: 'exhibitor-approved';
  expoId: string;
  expoTitle: string;
  exhibitorProfileId: string;
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`exhibitor-${userId}`).emit('exhibitor-approved', {
  type: 'exhibitor-approved',
  expoId: '507f1f77bcf86cd799439011',
  expoTitle: 'Tech Expo 2025',
  exhibitorProfileId: '507f1f77bcf86cd799439040',
  timestamp: '2025-06-12T14:30:00Z',
});
```

---

#### **Server → Client: exhibitor-rejected**

**Event**: `exhibitor-rejected`

**Description**: Exhibitor application has been rejected.

**Trigger**: Organizer rejects exhibitor via `POST /api/v1/expos/{expoId}/exhibitors/{exhibitorId}/reject`

**Broadcast Target**: Room `exhibitor-{userId}`

**Payload**:
```typescript
{
  type: 'exhibitor-rejected';
  expoId: string;
  expoTitle: string;
  exhibitorProfileId: string;
  reason: string;
  timestamp: string;
}
```

---

#### **Server → Client: session-reminder**

**Event**: `session-reminder`

**Description**: Reminder notification for upcoming bookmarked session.

**Trigger**: Background job checks for sessions starting in X minutes (based on user preferences)

**Broadcast Target**: Room `user-{userId}`

**Payload**:
```typescript
{
  type: 'session-reminder';
  session: {
    sessionId: string;
    title: string;
    schedule: {
      startTime: string;
      endTime: string;
    };
    location: {
      room: string;
      building?: string;
    };
  };
  expo: {
    expoId: string;
    title: string;
  };
  minutesUntilStart: number;
  timestamp: string;
}
```

**Example**:
```typescript
io.to(`user-${userId}`).emit('session-reminder', {
  type: 'session-reminder',
  session: {
    sessionId: '507f1f77bcf86cd799439022',
    title: 'Keynote - AI in Enterprise',
    schedule: {
      startTime: '2025-06-15T10:00:00Z',
      endTime: '2025-06-15T11:00:00Z',
    },
    location: {
      room: 'Ballroom A',
      building: 'North Wing',
    },
  },
  expo: {
    expoId: '507f1f77bcf86cd799439011',
    title: 'Tech Expo 2025',
  },
  minutesUntilStart: 60, // 1 hour before
  timestamp: '2025-06-15T09:00:00Z',
});
```

---

## Error Handling

### **Server → Client: error**

**Event**: `error`

**Description**: Error occurred during socket operation.

**Payload**:
```typescript
{
  type: 'error';
  message: string;
  errorCode?: string;
  timestamp: string;
}
```

**Example**:
```typescript
socket.emit('error', {
  type: 'error',
  message: 'Access denied to this expo',
  errorCode: 'FORBIDDEN',
  timestamp: new Date().toISOString(),
});
```

---

## Connection Resilience

### Automatic Reconnection

Socket.io client automatically attempts to reconnect on connection loss. Frontend should handle reconnection events:

```typescript
// Frontend
socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  // Re-join expo rooms after reconnection
  const currentExpoId = getCurrentExpoId();
  if (currentExpoId) {
    socket.emit('join-expo', { expoId: currentExpoId });
  }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket server:', reason);

  // Show connection status indicator
  showConnectionStatus('disconnected');

  if (reason === 'io server disconnect') {
    // Server forcibly disconnected, manual reconnect required
    socket.connect();
  }
  // Automatic reconnection for other reasons
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  showConnectionStatus('connected');
});
```

---

## Performance Considerations

### Scalability with Redis Adapter

For horizontal scaling across multiple server instances, use Socket.io Redis adapter:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

**Benefits**:
- Broadcasts work across multiple server instances
- Supports horizontal scaling (FR-042)
- Session affinity not required

---

## Testing Real-Time Events

### Unit Tests (Backend)

```typescript
// backend/tests/unit/realtime.test.ts
import { io as ioClient } from 'socket.io-client';

describe('Real-Time Events', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    // Setup test server and sockets
  });

  test('should broadcast schedule-changed to expo room', (done) => {
    const expoId = '507f1f77bcf86cd799439011';

    // Client joins expo room
    clientSocket.emit('join-expo', { expoId });

    // Listen for schedule-changed event
    clientSocket.on('schedule-changed', (data) => {
      expect(data.expoId).toBe(expoId);
      expect(data.session.sessionId).toBe('507f1f77bcf86cd799439022');
      done();
    });

    // Server broadcasts schedule change
    io.to(`expo-${expoId}`).emit('schedule-changed', {
      type: 'schedule-changed',
      expoId,
      session: { sessionId: '507f1f77bcf86cd799439022', /* ... */ },
      timestamp: new Date().toISOString(),
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// frontend/tests/e2e/realtime.spec.ts
import { test, expect } from '@playwright/test';

test('should receive real-time booth allocation update', async ({ page, context }) => {
  // Open two browser contexts (exhibitor and organizer)
  const exhibitorPage = page;
  const organizerPage = await context.newPage();

  // Exhibitor views floor plan
  await exhibitorPage.goto('/exhibitor/expos/507f1f77bcf86cd799439011/floor-plan');

  // Wait for WebSocket connection
  await exhibitorPage.waitForTimeout(1000);

  // Organizer assigns booth
  await organizerPage.goto('/expos/507f1f77bcf86cd799439011/floor-plan');
  await organizerPage.click('[data-booth-id="A-101"]');
  await organizerPage.click('button:has-text("Assign Exhibitor")');

  // Verify exhibitor sees real-time update within 5 seconds
  await expect(exhibitorPage.locator('[data-booth-id="A-101"][data-status="occupied"]'))
    .toBeVisible({ timeout: 5000 });
});
```

---

## Summary

This specification defines all real-time events for EventSphere Management Platform, ensuring:

- ✅ **FR-034**: Schedule updates propagate within 5 seconds via `schedule-changed` event
- ✅ **FR-035**: Booth allocations propagate within 5 seconds via `booth-allocated` event
- ✅ **FR-036**: Expo event changes propagate within 5 seconds via `expo-updated` event
- ✅ **Scalability**: Redis adapter supports horizontal scaling (FR-042)
- ✅ **Resilience**: Automatic reconnection and connection status handling
- ✅ **Security**: JWT authentication for WebSocket connections

---

**Real-Time Events Specification Completed**: 2025-12-22
**All Events Defined**: Ready for implementation
