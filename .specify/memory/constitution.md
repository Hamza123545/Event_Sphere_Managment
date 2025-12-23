# EventSphere Management Constitution

<!--
Sync Impact Report:
Version: 1.2.0 (Minor - Technology Stack Constraints)
Created: 2025-12-21
Last Amendment: 2025-12-21

Changes in v1.2.0:
  - ADDED: Technology Stack section defining MERN stack as mandatory architecture
  - ADDED: Explicit constraints for MongoDB, Express.js, React+Vite+TypeScript, Node.js
  - New section between Security Requirements and Development Workflow (minor version bump)

Changes in v1.1.0:
  - ADDED: Password reset/recovery functionality requirement to Security-First principle
  - ADDED: User feedback mechanism requirement to User Experience Excellence principle
  - ADDED: User documentation requirement to Development Workflow section
  - Material expansion of existing sections (minor version bump)

Changes in v1.0.1:
  - CLARIFIED: Added explicit data backup and recovery requirements to Performance & Scalability principle
  - CLARIFIED: Added disaster recovery requirements to Security Requirements section
  - No principle additions or removals (patch-level clarification)

Changes in v1.0.0:
  - NEW: Initial constitution created for EventSphere Management platform
  - NEW: Seven core principles established (Security-First, Role-Based Access, Real-Time Architecture,
         User Experience, Performance & Scalability, Test-Driven Quality, Observability & Monitoring)
  - NEW: Security Requirements section added
  - NEW: Development Workflow section added

Templates Status:
  ✅ spec-template.md - Reviewed: Compatible with prioritized user stories approach
  ✅ plan-template.md - Reviewed: Constitution Check section ready for new principles
  ✅ tasks-template.md - Reviewed: Supports test-first and independent story implementation
  ✅ Commands reviewed for consistency

Follow-up TODOs:
  - None
-->

## Core Principles

### I. Security-First (NON-NEGOTIABLE)

All user data and system operations MUST prioritize security at every level. This principle is non-negotiable and supersedes convenience or speed of implementation.

**Mandatory Requirements**:
- Authentication MUST use industry-standard practices (bcrypt/Argon2 for passwords, secure session management)
- Password reset/forgot password functionality MUST be implemented with secure token-based recovery (time-limited, single-use tokens)
- All sensitive data MUST be encrypted both at rest and in transit (TLS 1.3+)
- Authorization MUST be enforced at every API endpoint and data access point
- Passwords MUST NEVER be stored in plaintext; hashing with salt is mandatory
- Secrets MUST NEVER be committed to source control; use environment variables and secure vaults
- All security events MUST be logged with appropriate detail for audit trails
- Regular security assessments and penetration testing MUST be conducted

**Rationale**: EventSphere handles sensitive exhibitor data, attendee information, and payment details. A single security breach could destroy trust and violate GDPR/privacy regulations. Security cannot be retrofitted—it must be embedded from day one. Password recovery is a critical security feature that must be implemented securely to prevent account takeover attacks.

### II. Role-Based Access Control (NON-NEGOTIABLE)

The system MUST enforce strict separation of concerns between user roles (Admin/Organizer, Exhibitor, Attendee) at both the UI and API layers.

**Mandatory Requirements**:
- User roles MUST be assigned during registration and enforced throughout the session
- Each API endpoint MUST validate user role and permissions before processing requests
- Data visibility MUST be scoped to user role (e.g., exhibitors cannot see other exhibitors' private data)
- Role transitions or privilege escalation MUST be logged and auditable
- UI components MUST render based on user role (no sensitive controls shown to unauthorized roles)

**Rationale**: Different stakeholders have fundamentally different needs and access levels. Organizers need management capabilities, exhibitors need booth control, attendees need read-only access. Mixing these concerns creates security vulnerabilities and poor UX.

### III. Real-Time Architecture

The system MUST provide real-time updates for critical operations including schedule changes, booth allocations, and event notifications.

**Mandatory Requirements**:
- Schedule changes MUST propagate to all affected users within 5 seconds
- Booth allocation updates MUST be reflected immediately in floor plans
- Event notifications MUST be delivered in real-time (WebSocket, Server-Sent Events, or similar)
- Concurrent edits MUST be handled gracefully with conflict resolution or optimistic locking
- System MUST handle hundreds of concurrent users without performance degradation

**Rationale**: Expos are dynamic environments where schedules shift, booths are reassigned, and attendees need immediate updates. Stale data leads to confusion, double-bookings, and attendee frustration. Real-time updates are a core competitive differentiator.

### IV. User Experience Excellence

The system MUST provide an intuitive, accessible, and responsive interface that works across devices and browsers.

**Mandatory Requirements**:
- Response time MUST be under 2 seconds for most user interactions (p95 latency)
- UI MUST be mobile-responsive and function on phones, tablets, and desktops
- Application MUST work on Chrome, Firefox, Safari, and Edge (last 2 versions)
- Accessibility MUST meet WCAG 2.1 Level AA standards
- Navigation MUST be consistent and predictable across all user roles
- Error messages MUST be clear, actionable, and user-friendly (avoid technical jargon)
- Feedback mechanism MUST be provided for users to submit suggestions, report issues, and contact support
- User feedback MUST be tracked, triaged, and responded to within documented SLA timeframes

**Rationale**: EventSphere serves non-technical users in high-pressure environments (busy expos). A complex or slow interface will be abandoned. Accessibility is both a legal requirement (GDPR, ADA) and ethical obligation. User feedback is essential for continuous improvement and maintaining user trust—it provides early warning of usability issues and demonstrates responsiveness to user needs.

### V. Performance & Scalability

The system MUST be architected to handle growth in users, events, and data without degradation.

**Mandatory Requirements**:
- Application MUST support 99% uptime with scheduled maintenance communicated in advance
- Database queries MUST be optimized to avoid N+1 problems and full table scans
- API responses MUST return within 1-2 seconds for most operations (p95 latency)
- System MUST support horizontal scaling to handle increased load
- Static assets MUST be cached and served via CDN where applicable
- Background jobs MUST be used for heavy operations (report generation, bulk emails)
- Automated data backups MUST be performed at least daily with retention policy documented
- Backup restoration procedures MUST be tested quarterly to ensure Recovery Time Objective (RTO) < 4 hours
- Critical data MUST be replicated across multiple availability zones or regions

**Rationale**: Expo seasons create traffic spikes. A system that collapses under load defeats the purpose of digital transformation. Scalability must be designed in, not bolted on later. Data loss during an active expo would be catastrophic—backups ensure business continuity and regulatory compliance.

### VI. Test-Driven Quality

All critical functionality MUST be covered by automated tests before deployment to production.

**Mandatory Requirements**:
- Unit tests MUST cover business logic and data validation
- Integration tests MUST verify API contracts and database interactions
- End-to-end tests MUST validate critical user journeys (registration, booth selection, schedule viewing)
- Security tests MUST verify authentication, authorization, and input sanitization
- Test coverage MUST be maintained at 80%+ for backend code
- All tests MUST pass before merging to main branch

**Rationale**: Manual testing is insufficient for a multi-role, real-time system. Automated tests catch regressions, document expected behavior, and enable confident refactoring. The cost of a production bug (lost bookings, data breaches) far exceeds the cost of comprehensive testing.

### VII. Observability & Monitoring

The system MUST provide visibility into application health, performance, and user behavior.

**Mandatory Requirements**:
- Structured logging MUST be implemented for all critical operations (authentication, payments, bookings)
- Metrics MUST track request latency, error rates, and resource usage
- Alerts MUST notify on-call engineers of critical failures (downtime, database errors, security events)
- User activity MUST be logged for analytics and support (attendee engagement, booth traffic)
- Dashboards MUST provide real-time visibility into system health and KPIs

**Rationale**: You cannot fix what you cannot see. Observability enables rapid incident response, data-driven optimization, and proactive issue detection. Analytics inform business decisions and demonstrate ROI.

## Security Requirements

### Data Privacy & Compliance

- The system MUST comply with GDPR requirements for data handling, storage, and user consent
- Users MUST have control over their data with clear consent mechanisms
- Personal data MUST be anonymized or deleted upon user request (right to be forgotten)
- Data retention policies MUST be documented and enforced
- Third-party integrations MUST be audited for compliance

### Input Validation & Sanitization

- All user input MUST be validated and sanitized before processing
- SQL injection MUST be prevented via parameterized queries or ORMs
- XSS attacks MUST be prevented via output encoding and Content Security Policy (CSP)
- File uploads MUST be validated for type, size, and scanned for malware
- Rate limiting MUST be implemented to prevent abuse and DoS attacks

### Secure Communication

- All communication between exhibitors and attendees MUST be logged and moderated if necessary
- Chat/messaging features MUST prevent spam, harassment, and malicious content
- Email notifications MUST use authenticated sending to prevent spoofing

### Data Backup & Disaster Recovery

- Regular automated backups MUST be performed to prevent data loss in case of system failures
- Backup data MUST be encrypted at rest and stored in geographically separate locations
- Disaster recovery plan MUST be documented and include Recovery Point Objective (RPO) ≤ 24 hours
- Backup integrity MUST be verified through automated testing and periodic restoration drills
- Access to backup systems MUST be restricted and audited with the same rigor as production systems

## Technology Stack

EventSphere Management is built on the MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript and modern tooling. This stack provides full-stack JavaScript/TypeScript consistency, strong ecosystem support, and alignment with real-time architecture requirements.

### Mandatory Technology Constraints

**Backend:**
- **Runtime**: Node.js (LTS version, currently v18+ or v20+)
- **Framework**: Express.js for REST API server
- **Language**: TypeScript (strict mode enabled)
- **Database**: MongoDB (with Mongoose ODM for schema validation and queries)
- **Authentication**: JWT-based authentication with secure token management
- **Real-time**: WebSocket support via Socket.io or native WebSockets for real-time updates

**Frontend:**
- **Framework**: React (v18+)
- **Build Tool**: Vite for fast development and optimized production builds
- **Language**: TypeScript (strict mode enabled)
- **State Management**: Context API, Redux Toolkit, or Zustand (to be determined during planning)
- **UI Library**: Material-UI, Ant Design, or Chakra UI (to be determined during planning)
- **Routing**: React Router v6+
- **API Client**: Axios or Fetch API with proper error handling

**Development & Testing:**
- **Package Manager**: npm or pnpm (consistent across team)
- **Code Quality**: ESLint + Prettier for consistent formatting
- **Testing (Backend)**: Jest + Supertest for API testing
- **Testing (Frontend)**: Vitest + React Testing Library for component testing
- **E2E Testing**: Playwright or Cypress for end-to-end user journey validation
- **Type Safety**: TypeScript strict mode enforced across frontend and backend

**Infrastructure & Deployment:**
- **Containerization**: Docker for consistent development and deployment environments
- **CI/CD**: GitHub Actions, GitLab CI, or similar for automated testing and deployment
- **Hosting**: Cloud platform supporting Node.js (AWS, Azure, Google Cloud, Heroku, Vercel, Railway, or similar)
- **Database Hosting**: MongoDB Atlas or self-hosted MongoDB with replica sets

### Rationale

The MERN stack with TypeScript provides:
- **Full-stack type safety** - TypeScript across frontend and backend reduces runtime errors
- **Real-time capabilities** - Node.js event-driven architecture supports WebSocket connections efficiently
- **Developer productivity** - Unified language (JavaScript/TypeScript) reduces context switching
- **Ecosystem maturity** - Extensive libraries and community support for expo management features
- **Scalability** - Node.js handles concurrent connections well; MongoDB scales horizontally
- **Modern tooling** - Vite provides fast HMR; React ecosystem offers rich UI components

### Technology Approval Process

Any deviation from the mandated stack MUST:
1. Be proposed with written justification (performance, security, or functional requirement that cannot be met)
2. Include impact analysis on existing codebase and team skillset
3. Receive approval from technical leads before adoption
4. Be documented as an ADR if approved

## Development Workflow

### Code Quality Standards

- Code MUST follow consistent style guidelines (enforced via linters: ESLint, Prettier, Pylint, etc.)
- Code reviews MUST be conducted for all pull requests before merging
- No code MUST be merged with failing tests or linter errors
- Complex logic MUST include inline comments explaining the "why" (not just "what")
- Technical debt MUST be tracked and addressed incrementally

### Git & Version Control

- Feature branches MUST be created from main for all new work
- Commit messages MUST be descriptive and follow conventional format (e.g., `feat:`, `fix:`, `docs:`)
- Pull requests MUST include context, testing notes, and link to related issues/tickets
- Main branch MUST always be deployable (protected with required reviews and status checks)

### Deployment & Release Process

- Deployments MUST follow blue-green or canary release patterns to minimize downtime
- Database migrations MUST be backward-compatible or carefully orchestrated
- Rollback procedures MUST be documented and tested
- Feature flags MUST be used for risky or incomplete features
- Release notes MUST be generated for each deployment

### Testing Gates

- All tests MUST pass before code review
- Code coverage MUST not decrease with new changes
- Security scans MUST be run on dependencies and code (SAST/DAST tools)
- Performance benchmarks MUST be monitored for regressions

### Documentation Requirements

- User documentation MUST be provided including user guides, FAQs, and tutorials for all user roles
- User documentation MUST be kept in sync with application features and updated with each release
- Developer documentation MUST be maintained to assist in further development and maintenance
- API documentation MUST be auto-generated from code annotations where possible (OpenAPI/Swagger for REST APIs)
- Documentation MUST be accessible, searchable, and version-controlled alongside code

## Governance

This constitution supersedes all other development practices and guidelines. It represents the foundational principles for building EventSphere Management as a secure, scalable, and user-centric platform.

**Amendment Process**:
- Amendments require written proposal with rationale and impact analysis
- Proposal must be reviewed by technical leads and stakeholders
- Approved amendments must be documented with version increment
- All affected templates and documentation must be updated to reflect changes

**Compliance & Enforcement**:
- All pull requests and code reviews MUST verify compliance with these principles
- Violations must be documented with justification (see Complexity Tracking in plan template)
- Complexity or deviations MUST be justified with "why needed" and "why simpler alternative rejected"
- Constitution adherence MUST be checked at the "Constitution Check" gate in plan.md

**Runtime Guidance**:
- For agent-specific development guidance, see `CLAUDE.md` (Claude Code agent instructions)
- For human developers, see project `README.md` and `docs/` folder
- This constitution applies to ALL contributors regardless of role or tooling

**Version**: 1.2.0 | **Ratified**: 2025-12-21 | **Last Amended**: 2025-12-21