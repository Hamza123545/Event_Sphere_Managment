# Research: EventSphere Management Platform

**Date**: 2025-12-21
**Feature**: EventSphere Management Platform
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context using authoritative documentation

## Research Summary

This document consolidates research findings from authoritative sources (via context7 MCP server) to resolve technology choices for the EventSphere Management Platform. All decisions align with constitutional requirements for the MERN stack, performance, scalability, and accessibility.

---

## 1. State Management: Redux Toolkit vs Zustand vs Context API

### Decision: **Zustand**

### Rationale

**Zustand** is the optimal choice for EventSphere Management Platform for the following reasons:

1. **Minimal Boilerplate**: Zustand requires significantly less setup code compared to Redux Toolkit, accelerating development velocity for the three role-based portals (Organizer, Exhibitor, Attendee).

2. **Performance Optimization**: Zustand's selective subscription model via selectors prevents unnecessary re-renders. Components subscribe only to specific state slices, critical for real-time updates where booth allocations, schedules, and event data change frequently.

3. **Bundle Size**: Zustand is lightweight (~1KB), contributing to faster load times and meeting the constitutional requirement for <2s response time (p95 latency).

4. **Real-Time Compatibility**: Zustand's mutable state updates work seamlessly with WebSocket/Socket.io real-time updates, simplifying the implementation of 5-second propagation requirements.

5. **TypeScript Support**: Full TypeScript support with strict mode compatibility, as mandated by the constitution.

### Alternatives Considered

- **Redux Toolkit (with RTK Query)**:
  - **Pros**: Comprehensive ecosystem, built-in RTK Query for API caching/invalidation, opinionated best practices
  - **Cons**: Higher bundle size, more boilerplate, steeper learning curve, unnecessary complexity for this use case
  - **Why Rejected**: The added complexity of Redux Toolkit (actions, reducers, slices, RTK Query setup) provides diminishing returns for a focused expo management platform. Zustand's simplicity achieves the same goals with less code.

- **Context API**:
  - **Pros**: Built into React, zero dependencies, simple for small apps
  - **Cons**: Performance issues with frequent updates (all consumers re-render), lacks devtools, no built-in optimization for selective subscriptions
  - **Why Rejected**: Context API causes performance degradation in apps with frequent state updates (real-time booth allocations, schedule changes). EventSphere's constitutional requirement for hundreds of concurrent users makes Context API unsuitable.

### Implementation Approach

```typescript
// Example Zustand store structure for EventSphere
import { create } from 'zustand';

interface UserState {
  user: User | null;
  role: 'organizer' | 'exhibitor' | 'attendee' | null;
  setUser: (user: User, role: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  role: null,
  setUser: (user, role) => set({ user, role }),
  logout: () => set({ user: null, role: null }),
}));

// Usage in component with selective subscription
const Component = () => {
  const role = useUserStore((state) => state.role); // Only re-renders when role changes
  // ...
};
```

### Source Attribution

- **Zustand Documentation**: /pmndrs/zustand (Context7)
- **Benchmark Score**: 87.5
- **Source Reputation**: High
- **Code Snippets Reviewed**: 771+

---

## 2. UI Library: Material-UI vs Ant Design vs Chakra UI

### Decision: **Material-UI (MUI)**

### Rationale

**Material-UI** is the clear choice for EventSphere Management Platform for the following reasons:

1. **WCAG 2.1 Level AA Compliance**: Material-UI provides built-in accessibility features and explicitly supports WCAG compliance through:
   - Configurable `contrastThreshold` for meeting WCAG 2.1 Rule 1.4.3 (minimum contrast requirements)
   - Semantic HTML and ARIA attributes baked into components
   - Keyboard navigation support across all components
   - Screen reader compatibility

2. **Comprehensive Component Library**: MUI offers 50+ production-ready components covering all EventSphere use cases:
   - Data tables for exhibitor lists, attendee registrations
   - Forms for expo creation, booth selection
   - Navigation components for role-based dashboards
   - Modals, dialogs for confirmation workflows

3. **Advanced Theming System**: MUI's `createTheme` and `ThemeProvider` enable:
   - Global theme customization for branding consistency
   - Role-based UI variations (different color schemes for Organizer/Exhibitor/Attendee portals)
   - Dark mode support (potential future requirement)
   - CSS-in-JS with `styled` API for component-level customization

4. **TypeScript Support**: First-class TypeScript support with comprehensive type definitions, aligning with strict mode requirements.

5. **Mobile Responsiveness**: MUI components are responsive out-of-the-box, meeting constitutional requirements for mobile/tablet/desktop support.

6. **Mature Ecosystem**: 10+ years of development, trusted by thousands of contributors, extensive documentation, and active community.

### Alternatives Considered

- **Ant Design**:
  - **Pros**: Enterprise-focused, comprehensive component library, good for admin dashboards
  - **Cons**: Larger bundle size, less customizable theming, primarily designed for Chinese markets (internationalization concerns)
  - **Why Rejected**: While Ant Design is excellent for enterprise applications, MUI's superior accessibility documentation and explicit WCAG support make it the safer choice for meeting constitutional Level AA requirements.

- **Chakra UI**:
  - **Pros**: Excellent developer experience, composable components, built-in accessibility
  - **Cons**: Smaller component library, fewer production battle-tested implementations, less mature ecosystem
  - **Why Rejected**: Chakra UI is newer and less proven at scale. MUI's decade of production use and larger component library reduce implementation risk for a complex multi-role platform like EventSphere.

### Implementation Approach

```typescript
// Theme configuration with accessibility compliance
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // EventSphere brand color
    },
    secondary: {
      main: '#dc004e',
    },
    contrastThreshold: 4.5, // WCAG 2.1 AA compliance
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Avoid all-caps for readability
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* App components */}
    </ThemeProvider>
  );
}
```

### Source Attribution

- **Material-UI Documentation**: /mui/material-ui (Context7)
- **Benchmark Score**: 74.3 (v7.2.0)
- **Source Reputation**: High
- **Code Snippets Reviewed**: 2,000+
- **WCAG Support**: Explicitly documented with contrast threshold configuration

---

## 3. E2E Testing: Playwright vs Cypress

### Decision: **Playwright**

### Rationale

**Playwright** is the superior choice for EventSphere Management Platform for the following reasons:

1. **True Cross-Browser Testing**: Playwright supports Chromium, Firefox, and WebKit with a single API, directly addressing the constitutional requirement for Chrome, Firefox, Safari, and Edge compatibility. Cypress only supports Chromium-based browsers natively.

2. **Modern Auto-Wait**: Playwright's built-in auto-wait eliminates flaky tests by automatically waiting for elements to be actionable before performing actions. This is critical for testing real-time updates (schedules, booth allocations) where DOM changes occur within 5 seconds.

3. **Performance**: Higher benchmark scores (80.6) and faster execution compared to Cypress, reducing CI/CD pipeline times.

4. **Parallel Execution**: Playwright supports parallel test execution across multiple browsers simultaneously, critical for testing three role-based portals (Organizer, Exhibitor, Attendee) efficiently.

5. **Trace Viewer**: Playwright's built-in trace viewer provides visual debugging with screenshots, network logs, and DOM snapshots for every action, simplifying troubleshooting of complex user journeys (e.g., exhibitor booth reservation flow).

6. **API Testing**: Playwright supports API testing alongside E2E tests, enabling comprehensive contract testing for the REST API backend.

### Alternatives Considered

- **Cypress**:
  - **Pros**: Excellent developer experience, real-time reloading during test development, good React Testing Library integration
  - **Cons**: Limited to Chromium browsers by default (Firefox/WebKit support experimental), slower execution, no native API testing
  - **Why Rejected**: Constitutional requirement mandates cross-browser testing (Chrome, Firefox, Safari, Edge). Playwright's native cross-browser support eliminates the need for experimental plugins and reduces testing complexity.

### Implementation Approach

```typescript
// Playwright test example for exhibitor booth selection
import { test, expect } from '@playwright/test';

test.describe('Exhibitor Booth Selection', () => {
  test('should allow exhibitor to select and reserve available booth', async ({ page }) => {
    // Login as exhibitor
    await page.goto('/login');
    await page.fill('[name="email"]', 'exhibitor@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to expo floor plan
    await page.click('text=Browse Expos');
    await page.click('text=Tech Expo 2025');
    await page.click('text=View Floor Plan');

    // Select available booth
    await page.click('[data-booth-id="A-101"][data-status="available"]');
    await page.click('text=Reserve Booth');

    // Verify reservation confirmation
    await expect(page.locator('text=Booth A-101 reserved successfully')).toBeVisible();
    await expect(page.locator('[data-booth-id="A-101"]')).toHaveAttribute('data-status', 'reserved');
  });
});
```

### Source Attribution

- **Playwright Documentation**: /microsoft/playwright (Context7)
- **Benchmark Score**: 80.6
- **Source Reputation**: High (Microsoft-backed)
- **Code Snippets Reviewed**: 3,700+
- **Cross-Browser Support**: Native Chromium, Firefox, WebKit

---

## 4. Additional Research: Real-Time Communication

### Decision: **Socket.io**

### Rationale

While not part of the original NEEDS CLARIFICATION items, Socket.io is the recommended library for implementing real-time updates:

1. **WebSocket Abstraction**: Socket.io provides a higher-level abstraction over native WebSockets with automatic fallback to HTTP long-polling for older browsers.

2. **Room/Namespace Support**: Socket.io's room feature is ideal for EventSphere's use case:
   - Organize users by expo (e.g., all users viewing "Tech Expo 2025" join a room)
   - Broadcast schedule changes only to affected room members
   - Simplifies booth allocation updates to specific expo participants

3. **Automatic Reconnection**: Built-in reconnection logic ensures users maintain real-time updates even with network interruptions, critical for the 5-second propagation requirement.

4. **TypeScript Support**: Full TypeScript support for type-safe event definitions.

### Implementation Approach (Server)

```typescript
// backend/src/services/realtime.ts
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join expo-specific room
    socket.on('join-expo', (expoId: string) => {
      socket.join(`expo-${expoId}`);
      console.log(`User ${socket.id} joined expo ${expoId}`);
    });

    // Broadcast schedule update to all users in expo room
    socket.on('schedule-updated', (expoId: string, schedule: any) => {
      io.to(`expo-${expoId}`).emit('schedule-changed', schedule);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}
```

### Implementation Approach (Client)

```typescript
// frontend/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

export const socket: Socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
});

export function connectToExpo(expoId: string) {
  socket.connect();
  socket.emit('join-expo', expoId);
}

export function onScheduleChange(callback: (schedule: any) => void) {
  socket.on('schedule-changed', callback);
}
```

---

## 5. Additional Research: Authentication Library

### Decision: **jsonwebtoken + bcrypt**

### Rationale

For authentication, use standard libraries mandated by the constitution:

1. **jsonwebtoken (JWT)**: Industry-standard for stateless authentication, enabling horizontal scaling (constitutional requirement).

2. **bcrypt**: Constitutional requirement for password hashing with salt. Preferred over Argon2 for Node.js due to native bindings and better npm ecosystem support.

### Implementation Approach

```typescript
// backend/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
}
```

---

## Research Summary Table

| Category | Decision | Alternative 1 | Alternative 2 | Key Factor |
|----------|----------|---------------|---------------|------------|
| **State Management** | **Zustand** | Redux Toolkit | Context API | Performance + Minimal boilerplate |
| **UI Library** | **Material-UI** | Ant Design | Chakra UI | WCAG 2.1 AA compliance + Maturity |
| **E2E Testing** | **Playwright** | Cypress | - | Cross-browser support |
| **Real-Time** | **Socket.io** | Native WebSocket | Server-Sent Events | Room support + Reconnection |
| **Auth (JWT)** | **jsonwebtoken** | - | - | Constitutional mandate |
| **Password Hash** | **bcrypt** | Argon2 | - | Node.js ecosystem + Constitutional compliance |

---

## Constitutional Alignment Verification

All technology decisions align with EventSphere Management Constitution v1.2.0:

- ✅ **MERN Stack**: MongoDB, Express.js, React+Vite+TypeScript, Node.js (all selected technologies compatible)
- ✅ **Security-First**: bcrypt for password hashing, JWT for secure sessions, HTTPS for data transmission
- ✅ **RBAC**: Zustand state management supports role-based data scoping
- ✅ **Real-Time Architecture**: Socket.io enables <5s update propagation
- ✅ **User Experience Excellence**: Material-UI provides WCAG 2.1 AA compliance, mobile responsiveness
- ✅ **Performance & Scalability**: Zustand minimizes bundle size, Playwright ensures fast test execution
- ✅ **Test-Driven Quality**: Playwright supports comprehensive E2E testing
- ✅ **Observability**: Socket.io events can be logged for monitoring

---

## Next Steps

With all NEEDS CLARIFICATION items resolved, proceed to:
1. **Phase 1**: Generate data model (data-model.md) based on spec entities
2. **Phase 1**: Generate API contracts (contracts/*.yaml) for all endpoints
3. **Phase 1**: Create quickstart guide (quickstart.md) with setup instructions
4. **Phase 2**: Generate tasks (tasks.md) with /sp.tasks command

---

**Research Completed**: 2025-12-21
**All Decisions Final**: Ready for Phase 1 Design
