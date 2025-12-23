# Tasks: EventSphere Management Platform

**Input**: Design documents from `/specs/001-expo-management-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are OPTIONAL. This document focuses on implementation tasks. Test coverage will be addressed in the Polish phase to meet constitutional requirement of 80%+ backend coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each user story is designed to be independently deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

EventSphere uses **web app structure**:
- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure: backend/src/{models,controllers,services,middleware,routes,utils,config}, backend/tests/{unit,integration,contract}
- [x] T002 Create frontend directory structure: frontend/src/{components/{common,organizer,exhibitor,attendee},pages/{auth,organizer,exhibitor,attendee},services,hooks,stores,utils,types}, frontend/tests/{components,e2e}
- [x] T003 Initialize backend Node.js project with TypeScript in backend/package.json (Express.js, Mongoose, Socket.io, bcrypt, jsonwebtoken, dotenv dependencies)
- [x] T004 Initialize frontend Vite+React+TypeScript project in frontend/package.json (React 18+, React Router v6+, Material-UI, Zustand, Socket.io-client, Axios dependencies)
- [x] T005 [P] Configure TypeScript strict mode in backend/tsconfig.json
- [x] T006 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [x] T007 [P] Setup ESLint and Prettier for backend in backend/.eslintrc.js
- [x] T008 [P] Setup ESLint and Prettier for frontend in frontend/.eslintrc.js
- [x] T009 [P] Create backend environment configuration template in backend/.env.example (MongoDB URI, JWT secret, CORS origin, email config, file upload settings)
- [x] T010 [P] Create frontend environment configuration template in frontend/.env.example (API URL, Socket URL)
- [x] T011 [P] Setup Git hooks for pre-commit linting in .husky/pre-commit
- [x] T012 [P] Create Docker Compose file for local MongoDB in docker/docker-compose.yml
- [x] T013 [P] Create README.md with quickstart instructions referencing specs/001-expo-management-platform/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [x] T014 Setup MongoDB connection with Mongoose in backend/src/config/database.ts (connection pooling, error handling, retry logic)
- [x] T015 Create base Mongoose schema configuration in backend/src/models/index.ts (timestamps, toJSON options, indexes)
- [x] T016 [P] Implement JWT utility functions in backend/src/utils/auth.ts (generateToken, verifyToken per contracts/auth-api.yaml)
- [x] T017 [P] Implement bcrypt password hashing utility in backend/src/utils/password.ts (hashPassword, comparePassword with 10 salt rounds)
- [x] T018 [P] Create authentication middleware in backend/src/middleware/auth.ts (verifyToken, extractUser, requireAuth)
- [x] T019 [P] Create role-based authorization middleware in backend/src/middleware/rbac.ts (requireRole, checkPermissions for organizer/exhibitor/attendee)
- [x] T020 [P] Create error handling middleware in backend/src/middleware/errorHandler.ts (global error handler, validation errors, MongoDB errors)
- [x] T021 [P] Create request validation middleware in backend/src/middleware/validator.ts (schema validation using express-validator)
- [x] T022 [P] Create CORS middleware configuration in backend/src/middleware/cors.ts (whitelisted origins from env)
- [x] T023 [P] Create structured logging utility in backend/src/utils/logger.ts (Winston logger with levels: error, warn, info, debug)
- [x] T024 [P] Setup Express application base in backend/src/app.ts (middleware chain, CORS, JSON parsing, error handler)
- [x] T025 [P] Create server entry point in backend/src/server.ts (HTTP server, MongoDB connection, Socket.io initialization, graceful shutdown)
- [x] T026 [P] Setup API routing structure in backend/src/routes/index.ts (versioned routes /api/v1, route organization)

### Frontend Foundation

- [x] T027 [P] Create Axios client with interceptors in frontend/src/services/api.ts (base URL from env, JWT token injection, error handling)
- [x] T028 [P] Create Socket.io client setup in frontend/src/services/socket.ts (connection management, auto-reconnect, event typing)
- [x] T029 [P] Create authentication Zustand store in frontend/src/stores/authStore.ts (user state, login, logout, token management)
- [x] T030 [P] Create React Router configuration in frontend/src/App.tsx (route definitions, protected routes, role-based routing)
- [x] T031 [P] Create Material-UI theme configuration in frontend/src/theme.ts (primary/secondary colors, typography, WCAG 2.1 AA contrast per research.md)
- [x] T032 [P] Create ProtectedRoute component in frontend/src/components/common/ProtectedRoute.tsx (auth check, role check, redirect logic)
- [x] T033 [P] Create common UI components: LoadingSpinner in frontend/src/components/common/LoadingSpinner.tsx
- [x] T034 [P] Create common UI components: ErrorAlert in frontend/src/components/common/ErrorAlert.tsx
- [x] T035 [P] Create common UI components: ConfirmDialog in frontend/src/components/common/ConfirmDialog.tsx
- [x] T036 [P] Create API error handling utility in frontend/src/utils/errorHandler.ts (parse backend errors, user-friendly messages)

### WebSocket Real-Time Foundation

- [x] T037 Setup Socket.io server in backend/src/services/realtime.ts (JWT authentication middleware, room management per contracts/realtime-events.md)
- [x] T038 Implement WebSocket connection handlers in backend/src/services/realtime.ts (connection, disconnect, join-expo, leave-expo events)
- [x] T039 [P] Create real-time event types in frontend/src/types/socket.ts (TypeScript interfaces for all events from contracts/realtime-events.md)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Organizer Creates and Manages Expo Event (Priority: P1) 🎯 MVP

**Goal**: Enable organizers to create, view, edit, and delete expo events with complete details (title, date, location, description, theme). This is the foundational capability that enables all other functionality.

**Independent Test**: Login as organizer → navigate to "Create Expo" page → fill required fields (title, date, location, description, theme) → verify expo created successfully → edit expo details → verify changes persist → view expo in dashboard list

### Backend Implementation for User Story 1

- [ ] T040 [P] [US1] Create User model in backend/src/models/User.ts (schema from data-model.md: email, passwordHash, role, profile, gdprConsent, validation, indexes)
- [ ] T041 [P] [US1] Create ExpoEvent model in backend/src/models/ExpoEvent.ts (schema from data-model.md: title, description, theme, dateRange, location, organizer, status, validation, indexes)
- [ ] T042 [US1] Create authentication service in backend/src/services/authService.ts (register, login, logout, verifyEmail, forgotPassword, resetPassword per contracts/auth-api.yaml)
- [ ] T043 [US1] Create expo event service in backend/src/services/expoService.ts (createExpo, getExpoById, listOrganizer Expos, updateExpo, deleteExpo with RBAC checks)
- [ ] T044 [US1] Implement authentication routes in backend/src/routes/authRoutes.ts (POST /register, POST /login, POST /logout, GET /me, PUT /me/profile per contracts/auth-api.yaml)
- [ ] T045 [US1] Implement expo event routes in backend/src/routes/expoRoutes.ts (GET /expos, POST /expos, GET /expos/:id, PUT /expos/:id, DELETE /expos/:id per contracts/expo-api.yaml)
- [ ] T046 [US1] Add validation schemas for expo creation in backend/src/middleware/validator.ts (title 5-200 chars, description 20-5000 chars, dates validation)
- [ ] T047 [US1] Add logging for expo operations in backend/src/services/expoService.ts (audit trail for create, update, delete per FR-006, FR-048)
- [ ] T048 [US1] Implement WebSocket broadcast for expo-updated event in backend/src/services/realtime.ts (broadcast to room expo-{expoId} per contracts/realtime-events.md)

### Frontend Implementation for User Story 1

- [ ] T049 [P] [US1] Create expo Zustand store in frontend/src/stores/expoStore.ts (expos list, selectedExpo, CRUD operations, real-time updates)
- [ ] T050 [P] [US1] Create TypeScript types in frontend/src/types/expo.ts (ExpoSummary, ExpoDetail, CreateExpoRequest, UpdateExpoRequest per contracts/expo-api.yaml)
- [ ] T051 [P] [US1] Create auth API service in frontend/src/services/authApi.ts (register, login, logout, getProfile API calls)
- [ ] T052 [P] [US1] Create expo API service in frontend/src/services/expoApi.ts (listExpos, createExpo, getExpo, updateExpo, deleteExpo API calls)
- [ ] T053 [US1] Create Login page in frontend/src/pages/auth/LoginPage.tsx (email/password form, validation, error handling, redirect on success)
- [ ] T054 [US1] Create Register page in frontend/src/pages/auth/RegisterPage.tsx (role selection, profile fields, GDPR consent checkboxes, validation)
- [ ] T055 [US1] Create Organizer Dashboard page in frontend/src/pages/organizer/Dashboard.tsx (expo list with key details, create button, status filter)
- [ ] T056 [US1] Create CreateExpo form component in frontend/src/components/organizer/CreateExpoForm.tsx (all required fields, date pickers, validation, Material-UI components)
- [ ] T057 [US1] Create EditExpo form component in frontend/src/components/organizer/EditExpoForm.tsx (pre-populated fields, save/cancel, validation)
- [ ] T058 [US1] Create ExpoCard component in frontend/src/components/organizer/ExpoCard.tsx (display expo summary, edit/delete actions)
- [ ] T059 [US1] Add real-time expo updates in frontend/src/stores/expoStore.ts (listen to expo-updated event, update state within 5 seconds per FR-036)
- [ ] T060 [US1] Implement delete expo confirmation dialog in frontend/src/components/organizer/DeleteExpoDialog.tsx (warning for active registrations, confirm button)
- [ ] T061 [US1] Add navigation menu for organizer role in frontend/src/components/common/AppBar.tsx (Dashboard, Create Expo, Profile, Logout)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Organizers can create, view, edit, and delete expos.

---

## Phase 4: User Story 2 - Exhibitor Registers and Manages Booth (Priority: P1) 🎯 MVP

**Goal**: Enable exhibitors to register for expo events, upload company documents, view interactive floor plans, and select/reserve available booth spaces. This is the revenue-generating capability.

**Independent Test**: Login as exhibitor → browse available expos → select expo and register with company details/documents → view floor plan → select available booth → verify booth reserved → update booth details (products showcased, staff)

### Backend Implementation for User Story 2

- [ ] T062 [P] [US2] Create ExhibitorProfile model in backend/src/models/ExhibitorProfile.ts (schema from data-model.md: user, expo, companyName, description, logo, productsServices, category, documents, contactInfo, registrationStatus, booth, validation, unique compound index)
- [ ] T063 [P] [US2] Create BoothSpace model in backend/src/models/BoothSpace.ts (schema from data-model.md: floorPlan, expo, identifier, size, location, amenities, priceTier, status, exhibitor, validation, state transitions)
- [ ] T064 [P] [US2] Create FloorPlan model in backend/src/models/FloorPlan.ts (schema from data-model.md: expo, name, dimensions, imageUrl, metadata, validation, one-to-one with expo)
- [ ] T065 [US2] Create exhibitor service in backend/src/services/exhibitorService.ts (registerForExpo, getProfiles, updateProfile, assignBooth, getFloorPlan with RBAC checks)
- [ ] T066 [US2] Create file upload service in backend/src/services/uploadService.ts (handle multipart/form-data, validate file types PDF/JPG/PNG, size limits 10MB, store files, return URLs)
- [ ] T067 [US2] Create booth service in backend/src/services/boothService.ts (viewFloorPlan, reserveBooth with optimistic locking, updateBoothDetails, releaseBoothin backend/src/services/boothService.ts)
- [ ] T068 [US2] Implement exhibitor routes in backend/src/routes/exhibitorRoutes.ts (POST /exhibitor/expos/:id/register, GET /exhibitor/profile, PUT /exhibitor/profile/:id, GET /exhibitor/expos/:id/floor-plan, POST /exhibitor/expos/:id/booths/:boothId/reserve per contracts/exhibitor-api.yaml)
- [ ] T069 [US2] Add file upload middleware in backend/src/middleware/upload.ts (multer configuration, file validation, error handling)
- [ ] T070 [US2] Add validation for exhibitor registration in backend/src/middleware/validator.ts (companyName 2-200 chars, description 20-2000 chars, products services array not empty)
- [ ] T071 [US2] Implement WebSocket broadcast for booth-allocated event in backend/src/services/realtime.ts (broadcast to room expo-{expoId} per contracts/realtime-events.md, real-time floor plan updates)
- [ ] T072 [US2] Implement WebSocket broadcast for booth-released event in backend/src/services/realtime.ts (broadcast to room expo-{expoId} per contracts/realtime-events.md)
- [ ] T073 [US2] Add concurrent booth reservation handling in backend/src/services/boothService.ts (optimistic locking with Mongoose version field, return 409 on conflict per contracts/exhibitor-api.yaml)
- [ ] T074 [US2] Add logging for exhibitor operations in backend/src/services/exhibitorService.ts (audit trail for registrations, booth reservations per FR-006, FR-048)

### Frontend Implementation for User Story 2

- [ ] T075 [P] [US2] Create exhibitor Zustand store in frontend/src/stores/exhibitorStore.ts (profiles, selectedProfile, booth, floor plan, CRUD operations, real-time updates)
- [ ] T076 [P] [US2] Create TypeScript types in frontend/src/types/exhibitor.ts (ExhibitorProfile, BoothDetails, FloorPlan, CreateBoothSpaceRequest per contracts/exhibitor-api.yaml)
- [ ] T077 [P] [US2] Create exhibitor API service in frontend/src/services/exhibitorApi.ts (browseExpos, registerForExpo, getProfiles, updateProfile, viewFloorPlan, reserveBooth API calls with file upload support)
- [ ] T078 [US2] Create Exhibitor Dashboard page in frontend/src/pages/exhibitor/Dashboard.tsx (expo list, registration status, booth info, navigation)
- [ ] T079 [US2] Create ExpoDirectory component in frontend/src/components/exhibitor/ExpoDirectory.tsx (list available expos, filter by status/category, register button)
- [ ] T080 [US2] Create ExhibitorRegistrationForm component in frontend/src/components/exhibitor/RegistrationForm.tsx (company details, products/services, file upload for documents/logo, Material-UI file input, validation, progress indicators)
- [ ] T081 [US2] Create ProfileView component in frontend/src/components/exhibitor/ProfileView.tsx (display company profile, edit button, documents list)
- [ ] T082 [US2] Create EditProfile component in frontend/src/components/exhibitor/EditProfileForm.tsx (editable profile fields, file upload, save/cancel, validation with locked approved profiles warning)
- [ ] T083 [US2] Create FloorPlanViewer component in frontend/src/components/exhibitor/FloorPlanViewer.tsx (interactive SVG/canvas floor plan, booth status colors available/reserved/occupied, click to select)
- [ ] T084 [US2] Create BoothCard component in frontend/src/components/exhibitor/BoothCard.tsx (booth details: identifier, size, amenities, price tier, status, reserve button)
- [ ] T085 [US2] Create BoothDetailsForm component in frontend/src/components/exhibitor/BoothDetailsForm.tsx (products showcased array input, staff array input with name/role/email)
- [ ] T086 [US2] Add real-time booth updates in frontend/src/stores/exhibitorStore.ts (listen to booth-allocated and booth-released events, update floor plan within 5 seconds per FR-035)
- [ ] T087 [US2] Implement booth reservation confirmation dialog in frontend/src/components/exhibitor/ReserveBoothDialog.tsx (show booth details, confirm button, handle 409 concurrent reservation errors)
- [ ] T088 [US2] Add navigation menu for exhibitor role in frontend/src/components/common/AppBar.tsx (Dashboard, Browse Expos, My Profile, Messages, Logout)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Organizers can manage expos, exhibitors can register and select booths.

---

## Phase 5: User Story 3 - Attendee Browses and Registers for Expo (Priority: P2)

**Goal**: Enable attendees to browse expo events, view exhibitor information, search/filter exhibitors, register for sessions, and manage personal schedules. This completes the three-role MVP.

**Independent Test**: Login as attendee → browse expo directory → view expo details (schedule, exhibitor list, floor plan) → search/filter exhibitors by category/product → view exhibitor profiles → register for sessions → view personal schedule → verify bookmarks → receive session reminders

### Backend Implementation for User Story 3

- [ ] T089 [P] [US3] Create Session model in backend/src/models/Session.ts (schema from data-model.md: expo, title, description, speakers, schedule, location, capacity, currentAttendees, topic, category, validation, indexes, pre-save hook for duration)
- [ ] T090 [P] [US3] Create AttendeeRegistration model in backend/src/models/AttendeeRegistration.ts (schema from data-model.md: user, expo, registrationDate, attendanceStatus, preferences, validation, unique compound index)
- [ ] T091 [P] [US3] Create SessionBookmark model in backend/src/models/SessionBookmark.ts (schema from data-model.md: user, session, bookmarkDate, reminderPreferences, attended, validation, unique compound index)
- [ ] T092 [US3] Create attendee service in backend/src/services/attendeeService.ts (browseExpos, registerForExpo, getExpoDetails, searchExhibitors, getExhibitorProfile, viewFloorPlan with RBAC checks)
- [ ] T093 [US3] Create session service in backend/src/services/sessionService.ts (getExpoSchedule, bookmarkSession with capacity check, removeBookmark, getPersonalSchedule, checkSchedulingConflicts)
- [ ] T094 [US3] Implement attendee routes in backend/src/routes/attendeeRoutes.ts (GET /attendee/expos, GET /attendee/expos/:id, POST /attendee/expos/:id/register, GET /attendee/expos/:id/sessions, POST /attendee/expos/:id/sessions/:sessionId/bookmark, DELETE /attendee/expos/:id/sessions/:sessionId/bookmark, GET /attendee/schedule per contracts/attendee-api.yaml)
- [ ] T095 [US3] Add search functionality for exhibitors in backend/src/services/attendeeService.ts (query by category, product keyword, company name using MongoDB text indexes)
- [ ] T096 [US3] Add session capacity tracking in backend/src/services/sessionService.ts (increment currentAttendees on bookmark, decrement on remove, prevent overbooking per FR-031)
- [ ] T097 [US3] Add scheduling conflict detection in backend/src/services/sessionService.ts (detect overlapping session times, return conflicts array per contracts/attendee-api.yaml)
- [ ] T098 [US3] Add logging for attendee operations in backend/src/services/attendeeService.ts (audit trail for registrations, bookmarks per FR-006, FR-048)

### Frontend Implementation for User Story 3

- [ ] T099 [P] [US3] Create attendee Zustand store in frontend/src/stores/attendeeStore.ts (expos, selectedExpo, sessions, bookmarks, personal schedule, real-time updates)
- [ ] T100 [P] [US3] Create TypeScript types in frontend/src/types/attendee.ts (ExpoSummary, ExpoDetail, SessionDetail, SessionBookmark, AttendeeRegistration per contracts/attendee-api.yaml)
- [ ] T101 [P] [US3] Create attendee API service in frontend/src/services/attendeeApi.ts (browseExpos, getExpoDetails, registerForExpo, getSchedule, searchExhibitors, bookmarkSession, removeBookmark, getPersonalSchedule API calls)
- [ ] T102 [US3] Create Attendee Dashboard page in frontend/src/pages/attendee/Dashboard.tsx (upcoming expos, registered expos, upcoming sessions, navigation)
- [ ] T103 [US3] Create ExpoDirectory page in frontend/src/pages/attendee/ExpoDirectoryPage.tsx (list expos, filter by status/category/location/date, register button)
- [ ] T104 [US3] Create ExpoDetail page in frontend/src/pages/attendee/ExpoDetailPage.tsx (expo info, schedule tab, exhibitors tab, floor plan tab, registration status)
- [ ] T105 [US3] Create ScheduleView component in frontend/src/components/attendee/ScheduleView.tsx (display sessions chronologically, filter by category/topic/date, bookmark button, capacity indicators)
- [ ] T106 [US3] Create SessionCard component in frontend/src/components/attendee/SessionCard.tsx (session details: title, speakers, time, location, capacity, bookmark status, bookmark button)
- [ ] T107 [US3] Create ExhibitorSearch component in frontend/src/components/attendee/ExhibitorSearch.tsx (search input, category filter, product filter, results list)
- [ ] T108 [US3] Create ExhibitorList component in frontend/src/components/attendee/ExhibitorList.tsx (display exhibitors, category badges, view profile button)
- [ ] T109 [US3] Create ExhibitorProfile component in frontend/src/components/attendee/ExhibitorProfile.tsx (company info, products/services, booth location on floor plan, contact button)
- [ ] T110 [US3] Create PersonalSchedule page in frontend/src/pages/attendee/PersonalSchedulePage.tsx (all bookmarked sessions, sorted chronologically, scheduling conflicts highlighted)
- [ ] T111 [US3] Create FloorPlanView component in frontend/src/components/attendee/FloorPlanView.tsx (read-only floor plan, exhibitor booths labeled, click to view exhibitor profile)
- [ ] T112 [US3] Create BookmarkButton component in frontend/src/components/attendee/BookmarkButton.tsx (toggle bookmark, show capacity warning, handle session full error)
- [ ] T113 [US3] Add real-time schedule updates in frontend/src/stores/attendeeStore.ts (listen to schedule-changed and session-deleted events, update state within 5 seconds per FR-034)
- [ ] T114 [US3] Implement attendee registration form in frontend/src/components/attendee/AttendeeRegistrationForm.tsx (preferences: interests array, dietary restrictions array)
- [ ] T115 [US3] Add navigation menu for attendee role in frontend/src/components/common/AppBar.tsx (Dashboard, Browse Expos, My Schedule, Messages, Logout)

**Checkpoint**: All three primary user stories (P1 x2, P2) should now be independently functional. Organizers manage expos, exhibitors register and select booths, attendees browse and register for sessions.

---

## Phase 6: User Story 4 - Organizer Allocates Booth Spaces on Floor Plan (Priority: P2)

**Goal**: Enable organizers to create interactive floor plans, define booth spaces with attributes (size, location, amenities), and assign approved exhibitors to specific booths. This enhances organizer workflow efficiency.

**Independent Test**: Login as organizer → select expo → create floor plan with dimensions → define booth spaces (identifier, size, location, amenities, price tier) → view floor plan → assign approved exhibitor to booth → verify booth status changes to "Occupied" → verify exhibitors/attendees see floor plan updates

### Backend Implementation for User Story 4

- [ ] T116 [US4] Create floor plan service in backend/src/services/floorPlanService.ts (createFloorPlan, getFloorPlan, addBoothSpace, assignExhibitorToBooth with validation and RBAC checks)
- [ ] T117 [US4] Implement floor plan routes in backend/src/routes/expoRoutes.ts (GET /expos/:id/floor-plan, POST /expos/:id/floor-plan, POST /expos/:id/booths, POST /expos/:id/booths/:boothId/assign per contracts/expo-api.yaml)
- [ ] T118 [US4] Add validation for floor plan creation in backend/src/middleware/validator.ts (name 3-200 chars, dimensions width/height 10-1000m, booth identifier unique per expo)
- [ ] T119 [US4] Add validation for booth assignment in backend/src/services/floorPlanService.ts (exhibitor must be approved, booth must be available, cannot assign same exhibitor twice)
- [ ] T120 [US4] Update booth status transitions in backend/src/services/floorPlanService.ts (available → occupied on assignment, occupied → available on unassignment)
- [ ] T121 [US4] Add logging for floor plan operations in backend/src/services/floorPlanService.ts (audit trail for floor plan creation, booth assignments per FR-006, FR-048)

### Frontend Implementation for User Story 4

- [ ] T122 [P] [US4] Create floor plan Zustand store in frontend/src/stores/floorPlanStore.ts (floor plan, booths, operations, real-time updates)
- [ ] T123 [P] [US4] Create floor plan API service in frontend/src/services/floorPlanApi.ts (createFloorPlan, getFloorPlan, addBoothSpace, assignExhibitor API calls)
- [ ] T124 [US4] Create FloorPlanEditor page in frontend/src/pages/organizer/FloorPlanEditorPage.tsx (create floor plan form, booth management, interactive canvas)
- [ ] T125 [US4] Create CreateFloorPlanForm component in frontend/src/components/organizer/CreateFloorPlanForm.tsx (name, dimensions, image URL upload, scale configuration)
- [ ] T126 [US4] Create AddBoothForm component in frontend/src/components/organizer/AddBoothForm.tsx (identifier, size width/height, location x/y coordinates, amenities checkboxes, price tier dropdown)
- [ ] T127 [US4] Create InteractiveFloorPlan component in frontend/src/components/organizer/InteractiveFloorPlan.tsx (SVG/canvas floor plan, drag booths to position, resize booths, click to edit/assign)
- [ ] T128 [US4] Create AssignExhibitorDialog component in frontend/src/components/organizer/AssignExhibitorDialog.tsx (approved exhibitors dropdown, booth details display, assign button)
- [ ] T129 [US4] Add booth metadata tracking in frontend/src/stores/floorPlanStore.ts (totalBooths, availableBooths, auto-calculate on booth changes)
- [ ] T130 [US4] Update organizer dashboard in frontend/src/pages/organizer/Dashboard.tsx (add "Manage Floor Plan" button for each expo)

**Checkpoint**: Organizers can now create floor plans and assign booths, enhancing the exhibitor booth selection workflow from User Story 2.

---

## Phase 7: User Story 5 - Real-Time Updates for Schedule and Booth Changes (Priority: P2)

**Goal**: Ensure all users receive real-time updates when schedules, booth allocations, or event details change, with 5-second propagation time. This is a core competitive differentiator.

**Independent Test**: Two browser windows (one organizer, one attendee/exhibitor) → organizer updates session time or booth allocation → attendee/exhibitor sees change within 5 seconds without manual refresh → verify WebSocket connection status indicator

### Backend Implementation for User Story 5

- [ ] T131 [US5] Implement schedule-changed WebSocket event in backend/src/services/realtime.ts (trigger on session update, broadcast to room expo-{expoId} per contracts/realtime-events.md)
- [ ] T132 [US5] Implement session-deleted WebSocket event in backend/src/services/realtime.ts (trigger on session deletion, broadcast to room expo-{expoId} per contracts/realtime-events.md)
- [ ] T133 [US5] Implement expo-updated WebSocket event in backend/src/services/realtime.ts (trigger on expo update, broadcast to room expo-{expoId}, include changes array per contracts/realtime-events.md)
- [ ] T134 [US5] Add MongoDB Change Streams integration in backend/src/services/realtime.ts (watch collections: ExpoEvent, Session, BoothSpace for real-time triggers)
- [ ] T135 [US5] Add connection status tracking in backend/src/services/realtime.ts (track active connections per room, log connection/disconnection events)
- [ ] T136 [US5] Optimize WebSocket broadcasts in backend/src/services/realtime.ts (batch updates if multiple changes within 100ms, deduplicate events)

### Frontend Implementation for User Story 5

- [ ] T137 [US5] Implement WebSocket event listeners in frontend/src/stores/expoStore.ts (schedule-changed, session-deleted, expo-updated, update state within 5 seconds)
- [ ] T138 [US5] Implement WebSocket event listeners in frontend/src/stores/exhibitorStore.ts (booth-allocated, booth-released, update floor plan within 5 seconds)
- [ ] T139 [US5] Create ConnectionStatus component in frontend/src/components/common/ConnectionStatus.tsx (WebSocket connection indicator: connected/disconnected/reconnecting, Material-UI badge)
- [ ] T140 [US5] Add visual notification for schedule changes in frontend/src/components/attendee/ScheduleView.tsx (toast notification, highlight changed session for 5 seconds)
- [ ] T141 [US5] Add visual notification for booth changes in frontend/src/components/exhibitor/FloorPlanViewer.tsx (toast notification, highlight changed booth for 5 seconds)
- [ ] T142 [US5] Add visual notification for expo updates in frontend/src/components/common/ExpoCard.tsx (toast notification for critical changes: date, cancellation)
- [ ] T143 [US5] Implement automatic reconnection logic in frontend/src/services/socket.ts (reconnect on disconnect, rejoin expo rooms, exponential backoff)
- [ ] T144 [US5] Add connection resilience testing in frontend/src/services/socket.ts (handle network loss, queue failed events, retry on reconnect)

**Checkpoint**: Real-time updates now propagate within 5 seconds for all critical changes (schedule, booth allocation, expo details), meeting FR-034, FR-035, FR-036.

---

## Phase 8: User Story 6 - Organizer Approves/Rejects Exhibitor Applications (Priority: P3)

**Goal**: Enable organizers to review exhibitor registration applications, approve or reject them with optional messages, and control which companies participate in their expo to maintain event quality.

**Independent Test**: Exhibitor submits registration → organizer views application queue → organizer reviews application details and documents → organizer approves application → exhibitor receives confirmation and gains access to booth selection → organizer rejects different application with reason → exhibitor receives rejection notification

### Backend Implementation for User Story 6

- [ ] T145 [US6] Create exhibitor approval service in backend/src/services/exhibitorApprovalService.ts (listPendingApplications, approveExhibitor, rejectExhibitor with RBAC checks)
- [ ] T146 [US6] Implement exhibitor approval routes in backend/src/routes/expoRoutes.ts (GET /expos/:id/exhibitors, POST /expos/:id/exhibitors/:exhibitorId/approve, POST /expos/:id/exhibitors/:exhibitorId/reject per contracts/expo-api.yaml)
- [ ] T147 [US6] Add email notification service in backend/src/services/emailService.ts (sendApprovalEmail, sendRejectionEmail using Nodemailer, templates with expo/exhibitor details)
- [ ] T148 [US6] Update exhibitor registration status in backend/src/services/exhibitorApprovalService.ts (pending → approved or pending → rejected, save rejection reason)
- [ ] T149 [US6] Implement WebSocket exhibitor-approved event in backend/src/services/realtime.ts (broadcast to room exhibitor-{userId} per contracts/realtime-events.md)
- [ ] T150 [US6] Implement WebSocket exhibitor-rejected event in backend/src/services/realtime.ts (broadcast to room exhibitor-{userId} per contracts/realtime-events.md)
- [ ] T151 [US6] Add validation for rejection reason in backend/src/middleware/validator.ts (reason required for rejection, 10-500 chars)
- [ ] T152 [US6] Add logging for approval/rejection operations in backend/src/services/exhibitorApprovalService.ts (audit trail per FR-006, FR-048)

### Frontend Implementation for User Story 6

- [ ] T153 [P] [US6] Create approval Zustand store in frontend/src/stores/approvalStore.ts (pending applications, approved/rejected lists, operations)
- [ ] T154 [P] [US6] Create approval API service in frontend/src/services/approvalApi.ts (listApplications, approveExhibitor, rejectExhibitor API calls)
- [ ] T155 [US6] Create ApplicationQueue page in frontend/src/pages/organizer/ApplicationQueuePage.tsx (pending applications list, filter by expo, status badges)
- [ ] T156 [US6] Create ApplicationCard component in frontend/src/components/organizer/ApplicationCard.tsx (company details, documents preview, approve/reject buttons)
- [ ] T157 [US6] Create ReviewApplicationDialog component in frontend/src/components/organizer/ReviewApplicationDialog.tsx (full application details, document links, approve/reject with reason textarea)
- [ ] T158 [US6] Add real-time approval notifications in frontend/src/stores/exhibitorStore.ts (listen to exhibitor-approved and exhibitor-rejected events, update profile status, show notification)
- [ ] T159 [US6] Update organizer dashboard in frontend/src/pages/organizer/Dashboard.tsx (add "Review Applications" navigation, badge count for pending)
- [ ] T160 [US6] Add approval/rejection toast notifications in frontend/src/components/exhibitor/Dashboard.tsx (show approval success, rejection reason)

**Checkpoint**: Organizers can now approve/reject exhibitor applications, completing the quality control workflow.

---

## Phase 9: User Story 7 - Communication Between Users (Priority: P3)

**Goal**: Enable exhibitors and attendees to communicate with organizers, other exhibitors, and each other via messaging for questions, coordination, and networking.

**Independent Test**: Exhibitor sends message to organizer → organizer receives message → organizer replies → exhibitor receives reply → attendee contacts exhibitor → exhibitor receives inquiry → exhibitor replies → verify message read status updates

### Backend Implementation for User Story 7

- [ ] T161 [P] [US7] Create Message model in backend/src/models/Message.ts (schema from data-model.md: sender, recipient, subject, content, context, relatedExpo, timestamp, isRead, readAt, validation, indexes)
- [ ] T162 [US7] Create messaging service in backend/src/services/messagingService.ts (sendMessage, getMessages, markAsRead, getUnreadCount with RBAC checks)
- [ ] T163 [US7] Implement messaging routes in backend/src/routes/exhibitorRoutes.ts and attendeeRoutes.ts (GET /exhibitor/messages, POST /exhibitor/messages, PUT /exhibitor/messages/:id/read, GET /attendee/messages, POST /attendee/messages, PUT /attendee/messages/:id/read per contracts/exhibitor-api.yaml and attendee-api.yaml)
- [ ] T164 [US7] Add message validation in backend/src/middleware/validator.ts (content 1-5000 chars, subject max 200 chars, recipient exists and accessible)
- [ ] T165 [US7] Add email notification for new messages in backend/src/services/messagingService.ts (optional email notification for new messages based on user preferences)
- [ ] T166 [US7] Add logging for messaging operations in backend/src/services/messagingService.ts (audit trail for messages sent, content moderation flags per FR-006, FR-048)

### Frontend Implementation for User Story 7

- [ ] T167 [P] [US7] Create messaging Zustand store in frontend/src/stores/messagingStore.ts (messages, unread count, operations, real-time updates)
- [ ] T168 [P] [US7] Create TypeScript types in frontend/src/types/messaging.ts (Message per contracts/exhibitor-api.yaml and attendee-api.yaml)
- [ ] T169 [P] [US7] Create messaging API service in frontend/src/services/messagingApi.ts (getMessages, sendMessage, markAsRead API calls)
- [ ] T170 [US7] Create Messages page in frontend/src/pages/common/MessagesPage.tsx (message list, compose button, unread badge, filter by context)
- [ ] T171 [US7] Create MessageList component in frontend/src/components/common/MessageList.tsx (messages sorted by timestamp, read/unread indicators, click to view)
- [ ] T172 [US7] Create MessageThread component in frontend/src/components/common/MessageThread.tsx (conversation view, sender/recipient headers, timestamps)
- [ ] T173 [US7] Create ComposeMessage component in frontend/src/components/common/ComposeMessage.tsx (recipient selector, subject, content textarea, context dropdown, send button)
- [ ] T174 [US7] Add unread message count badge in frontend/src/components/common/AppBar.tsx (Messages menu item with badge, update on new message event)
- [ ] T175 [US7] Add real-time message notifications in frontend/src/stores/messagingStore.ts (listen to new-message event if implemented, update count, show toast)
- [ ] T176 [US7] Update navigation menus for all roles in frontend/src/components/common/AppBar.tsx (add Messages link for organizer, exhibitor, attendee)

**Checkpoint**: Users can now send and receive messages, enabling communication and coordination.

---

## Phase 10: User Story 8 - Organizer Generates Real-Time Analytics Reports (Priority: P3)

**Goal**: Enable organizers to view real-time analytics on attendee engagement, booth traffic, and session popularity to make data-driven decisions and demonstrate ROI to stakeholders.

**Independent Test**: Login as organizer → select expo → navigate to analytics dashboard → view metrics (total registrations, session popularity, booth traffic, engagement rate) → filter by metric type → export analytics report (PDF/CSV/JSON) → verify report downloads successfully

### Backend Implementation for User Story 8

- [ ] T177 [P] [US8] Create AnalyticsData model in backend/src/models/AnalyticsData.ts (schema from data-model.md: expo, metricType, timePeriod, metrics, generatedAt, validation, indexes)
- [ ] T178 [US8] Create analytics service in backend/src/services/analyticsService.ts (calculateAttendeeCount, calculateSessionPopularity, calculateBoothTraffic if tracking implemented, calculateEngagementRate)
- [ ] T179 [US8] Create analytics aggregation pipelines in backend/src/services/analyticsService.ts (MongoDB aggregation for real-time metrics: count attendees, group sessions by popularity, compute engagement)
- [ ] T180 [US8] Implement analytics routes in backend/src/routes/expoRoutes.ts (GET /expos/:id/analytics, GET /expos/:id/analytics/export per contracts/expo-api.yaml)
- [ ] T181 [US8] Create report export service in backend/src/services/exportService.ts (generatePDF using pdfkit, generateCSV, generateJSON with formatted analytics data)
- [ ] T182 [US8] Add caching for analytics in backend/src/services/analyticsService.ts (cache aggregation results for 1 minute, invalidate on data changes)
- [ ] T183 [US8] Add logging for analytics operations in backend/src/services/analyticsService.ts (track analytics requests, export downloads per FR-006, FR-048)

### Frontend Implementation for User Story 8

- [ ] T184 [P] [US8] Create analytics Zustand store in frontend/src/stores/analyticsStore.ts (analytics data, operations)
- [ ] T185 [P] [US8] Create TypeScript types in frontend/src/types/analytics.ts (Analytics per contracts/expo-api.yaml)
- [ ] T186 [P] [US8] Create analytics API service in frontend/src/services/analyticsApi.ts (getAnalytics, exportAnalytics API calls)
- [ ] T187 [US8] Create Analytics Dashboard page in frontend/src/pages/organizer/AnalyticsPage.tsx (metrics display, filter controls, export button)
- [ ] T188 [US8] Create MetricCard component in frontend/src/components/organizer/MetricCard.tsx (display single metric with icon, value, label, trend if applicable)
- [ ] T189 [US8] Create SessionPopularityChart component in frontend/src/components/organizer/SessionPopularityChart.tsx (bar chart using Recharts or Material-UI charting, sessions sorted by registrations)
- [ ] T190 [US8] Create AttendeeCountWidget component in frontend/src/components/organizer/AttendeeCountWidget.tsx (total, registered, checked-in counts with pie chart)
- [ ] T191 [US8] Create ExportReportDialog component in frontend/src/components/organizer/ExportReportDialog.tsx (format selector: PDF/CSV/JSON, download button, progress indicator)
- [ ] T192 [US8] Update organizer dashboard in frontend/src/pages/organizer/Dashboard.tsx (add "View Analytics" button for each expo)

**Checkpoint**: Organizers can now view real-time analytics and export reports for data-driven decisions.

---

## Phase 11: User Story 9 - Attendee Receives Notifications and Reminders (Priority: P3)

**Goal**: Enable attendees to receive notifications and reminders for bookmarked sessions and event updates to reduce no-shows and keep attendees informed.

**Independent Test**: Attendee bookmarks session with reminder set for 1 hour before → wait (or simulate time) → verify reminder notification received 1 hour before session → organizer changes session time → verify attendee receives notification about schedule change → attendee configures notification preferences → verify only selected channels receive notifications

### Backend Implementation for User Story 9

- [ ] T193 [US9] Create notification service in backend/src/services/notificationService.ts (sendSessionReminder, sendScheduleChangeNotification, sendExpoUpdateNotification)
- [ ] T194 [US9] Create background job scheduler in backend/src/services/schedulerService.ts (cron jobs using node-cron or bull queue, check upcoming sessions, trigger reminders based on user preferences)
- [ ] T195 [US9] Implement session reminder job in backend/src/services/schedulerService.ts (run every 5 minutes, find sessions starting soon matching user reminderPreferences.minutesBefore, send notifications via channels: email, in-app)
- [ ] T196 [US9] Implement WebSocket session-reminder event in backend/src/services/realtime.ts (broadcast to room user-{userId} per contracts/realtime-events.md)
- [ ] T197 [US9] Add email templates for session reminders in backend/src/templates/email/ (reminder email with session details, time, location, expo context)
- [ ] T198 [US9] Add email templates for schedule changes in backend/src/templates/email/ (schedule change email with old vs new details, reason if provided)
- [ ] T199 [US9] Update session service in backend/src/services/sessionService.ts (trigger schedule change notifications when session updated, batch notifications for multiple affected attendees)
- [ ] T200 [US9] Add logging for notification operations in backend/src/services/notificationService.ts (track reminders sent, delivery status per FR-006, FR-048)

### Frontend Implementation for User Story 9

- [ ] T201 [P] [US9] Create notifications Zustand store in frontend/src/stores/notificationsStore.ts (notifications list, unread count, operations)
- [ ] T202 [P] [US9] Create TypeScript types in frontend/src/types/notifications.ts (SessionReminder, ScheduleChangeNotification per contracts/realtime-events.md)
- [ ] T203 [US9] Create NotificationCenter component in frontend/src/components/common/NotificationCenter.tsx (dropdown from AppBar, notification list, mark all read button)
- [ ] T204 [US9] Create NotificationItem component in frontend/src/components/common/NotificationItem.tsx (icon, title, message, timestamp, read/unread indicator)
- [ ] T205 [US9] Add real-time notification handling in frontend/src/stores/notificationsStore.ts (listen to session-reminder event, add to notifications list, show toast, play sound if enabled)
- [ ] T206 [US9] Create NotificationPreferences component in frontend/src/components/attendee/NotificationPreferences.tsx (channels checkboxes: email, in-app, default minutes before dropdown)
- [ ] T207 [US9] Add notification preferences to user profile in frontend/src/pages/common/ProfilePage.tsx (notification preferences section, save button)
- [ ] T208 [US9] Add unread notification badge in frontend/src/components/common/AppBar.tsx (bell icon with badge count, click to open NotificationCenter)
- [ ] T209 [US9] Add toast notifications for critical updates in frontend/src/utils/notifications.ts (schedule changes, expo cancellations, prominent visual alerts)

**Checkpoint**: Attendees now receive timely reminders and notifications, improving engagement and reducing no-shows.

---

## Phase 12: User Story 10 - User Feedback Mechanism (Priority: P3)

**Goal**: Enable all authenticated users to submit feedback, suggestions, or report issues so they can contribute to improving the platform and get support when encountering problems.

**Independent Test**: Login as any user → access "Feedback" or "Support" section → submit suggestion with category and message → verify confirmation received with tracking reference → organizer/admin views feedback queue → verify submission appears with user details, timestamp, category → organizer marks feedback as reviewed

### Backend Implementation for User Story 10

- [ ] T210 [P] [US10] Create FeedbackSubmission model in backend/src/models/FeedbackSubmission.ts (schema from data-model.md: submitter, category, subject, message, status, assignedTo, response, validation, indexes)
- [ ] T211 [US10] Create feedback service in backend/src/services/feedbackService.ts (submitFeedback, getFeedbackQueue, updateFeedbackStatus, assignFeedback, respondToFeedback with RBAC checks)
- [ ] T212 [US10] Implement feedback routes in backend/src/routes/feedbackRoutes.ts (POST /feedback, GET /feedback for admins/organizers, PUT /feedback/:id/status per FR-037, FR-038, FR-039)
- [ ] T213 [US10] Add validation for feedback submission in backend/src/middleware/validator.ts (subject 5-200 chars, message 10-5000 chars, category enum)
- [ ] T214 [US10] Add email notification for new feedback in backend/src/services/feedbackService.ts (notify organizers/admins of new submissions, send confirmation to submitter with tracking ID)
- [ ] T215 [US10] Add logging for feedback operations in backend/src/services/feedbackService.ts (audit trail for submissions, status changes per FR-006, FR-048)

### Frontend Implementation for User Story 10

- [ ] T216 [P] [US10] Create feedback Zustand store in frontend/src/stores/feedbackStore.ts (feedback submissions for user, feedback queue for organizers, operations)
- [ ] T217 [P] [US10] Create TypeScript types in frontend/src/types/feedback.ts (FeedbackSubmission per data-model.md)
- [ ] T218 [P] [US10] Create feedback API service in frontend/src/services/feedbackApi.ts (submitFeedback, getFeedbackQueue, updateStatus API calls)
- [ ] T219 [US10] Create FeedbackForm component in frontend/src/components/common/FeedbackForm.tsx (category dropdown: suggestion/bug-report/support-request, subject input, message textarea, submit button)
- [ ] T220 [US10] Create Feedback page in frontend/src/pages/common/FeedbackPage.tsx (feedback form, my submissions list)
- [ ] T221 [US10] Create FeedbackQueue page in frontend/src/pages/organizer/FeedbackQueuePage.tsx (all submissions, filter by category/status, assign/respond buttons)
- [ ] T222 [US10] Create FeedbackCard component in frontend/src/components/organizer/FeedbackCard.tsx (submission details, submitter info, status badge, actions)
- [ ] T223 [US10] Create RespondToFeedbackDialog component in frontend/src/components/organizer/RespondToFeedbackDialog.tsx (response textarea, status dropdown, send button)
- [ ] T224 [US10] Add "Feedback" link in all navigation menus in frontend/src/components/common/AppBar.tsx (accessible to all authenticated users)
- [ ] T225 [US10] Add confirmation dialog on feedback submission in frontend/src/components/common/FeedbackForm.tsx (show tracking reference number, close button)

**Checkpoint**: All users can now submit feedback, and organizers can manage submissions, meeting constitutional requirement (FR-037, FR-038, FR-039).

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, performance optimizations, security hardening, and comprehensive testing to meet constitutional requirements.

### Security & RBAC (Constitutional Requirements I, II)

- [ ] T226 [P] Implement password reset token generation in backend/src/services/authService.ts (time-limited 1 hour, single-use tokens per FR-004)
- [ ] T227 [P] Implement password reset routes in backend/src/routes/authRoutes.ts (POST /auth/forgot-password, POST /auth/reset-password per contracts/auth-api.yaml)
- [ ] T228 [P] Add rate limiting middleware in backend/src/middleware/rateLimit.ts (express-rate-limit: 100 requests/15min per IP, stricter for auth endpoints: 5 login attempts/15min)
- [ ] T229 [P] Add input sanitization in backend/src/middleware/validator.ts (sanitize all string inputs to prevent XSS, validate email formats)
- [ ] T230 [P] Add SQL injection prevention verification in backend/src/models/ (confirm all queries use Mongoose parameterized queries, no raw string concatenation)
- [ ] T231 [P] Implement GDPR data export in backend/src/services/authService.ts (exportUserData: compile all user data from all collections per FR-007, contracts/auth-api.yaml)
- [ ] T232 [P] Implement GDPR data deletion in backend/src/services/authService.ts (deleteUserAccount: cascade delete user data, anonymize where retention required, 30-day grace period per FR-007)
- [ ] T233 [P] Add GDPR routes in backend/src/routes/authRoutes.ts (GET /auth/me/gdpr-export, DELETE /auth/me/gdpr-delete per contracts/auth-api.yaml)
- [ ] T234 [P] Add Content Security Policy (CSP) headers in backend/src/app.ts (helmet middleware, strict CSP to prevent XSS)
- [ ] T235 [P] Add security audit logging in backend/src/middleware/auth.ts (log all authentication attempts, password resets, role escalations per FR-006)

### Performance & Scalability (Constitutional Requirement V)

- [ ] T236 [P] Add database query optimization in backend/src/models/ (ensure all frequently queried fields have indexes, compound indexes for multi-field queries)
- [ ] T237 [P] Add pagination to list endpoints in backend/src/services/ (expos, exhibitors, sessions, messages: default 20 items, max 100, return pagination metadata)
- [ ] T238 [P] Implement Redis caching layer in backend/src/services/cacheService.ts (cache frequently accessed data: expo lists, session schedules, TTL 5 minutes)
- [ ] T239 [P] Setup Redis adapter for Socket.io in backend/src/services/realtime.ts (enable horizontal scaling across multiple server instances per FR-042)
- [ ] T240 [P] Add background jobs for heavy operations in backend/src/services/jobQueue.ts (use Bull queue: analytics generation, bulk emails, report exports)
- [ ] T241 [P] Implement CDN for static assets in frontend/ (configure Vite build to output assets with content hashes, serve from CDN in production)
- [ ] T242 [P] Add lazy loading for routes in frontend/src/App.tsx (React.lazy() for all pages, Suspense with loading spinner)
- [ ] T243 [P] Add API response compression in backend/src/app.ts (compression middleware, gzip for JSON responses >1KB)

### Testing (Constitutional Requirement VI)

- [ ] T244 [P] Setup Jest and Supertest in backend/package.json (testing framework, coverage configuration, test scripts)
- [ ] T245 [P] Create API contract tests in backend/tests/contract/ (test all endpoints match OpenAPI specs from contracts/, validate request/response schemas, status codes)
- [ ] T246 [P] Create integration tests for authentication in backend/tests/integration/auth.test.ts (register, login, logout, password reset, GDPR export/delete flows)
- [ ] T247 [P] Create integration tests for User Story 1 in backend/tests/integration/organizer.test.ts (create expo, update expo, delete expo, list expos)
- [ ] T248 [P] Create integration tests for User Story 2 in backend/tests/integration/exhibitor.test.ts (register, update profile, view floor plan, reserve booth)
- [ ] T249 [P] Create integration tests for User Story 3 in backend/tests/integration/attendee.test.ts (browse expos, register, search exhibitors, bookmark sessions)
- [ ] T250 [P] Setup Playwright in frontend/package.json (E2E testing framework, browser configuration for Chromium, Firefox, WebKit)
- [ ] T251 [P] Create E2E test for User Story 1 in frontend/tests/e2e/organizer.spec.ts (full journey: login → create expo → edit → delete)
- [ ] T252 [P] Create E2E test for User Story 2 in frontend/tests/e2e/exhibitor.spec.ts (full journey: login → register → select booth)
- [ ] T253 [P] Create E2E test for User Story 3 in frontend/tests/e2e/attendee.spec.ts (full journey: login → browse → register → bookmark sessions)
- [ ] T254 [P] Create E2E test for real-time updates in frontend/tests/e2e/realtime.spec.ts (two browser contexts, organizer changes schedule, attendee sees update within 5 seconds)
- [ ] T255 [P] Create unit tests for critical services in backend/tests/unit/ (authService, expoService, exhibitorService, attendeeService, sessionService with mocked dependencies)
- [ ] T256 [P] Run test coverage report in backend/ (npm run test:coverage, verify 80%+ coverage per constitutional requirement)

### Observability & Monitoring (Constitutional Requirement VII)

- [ ] T257 [P] Add structured logging for all API requests in backend/src/middleware/logger.ts (request ID, method, path, status, duration, user ID)
- [ ] T258 [P] Add error tracking service integration in backend/src/utils/errorTracking.ts (Sentry or similar, capture exceptions, stack traces, user context)
- [ ] T259 [P] Create health check endpoint in backend/src/routes/healthRoutes.ts (GET /health: return status, uptime, database connection status, version)
- [ ] T260 [P] Add metrics collection in backend/src/middleware/metrics.ts (Prometheus or similar: request count, latency histogram, error rate, active connections)
- [ ] T261 [P] Create monitoring dashboard configuration in monitoring/grafana-dashboard.json (visualize metrics: p95 latency, error rate, throughput, database performance)

### Accessibility & UX (Constitutional Requirement IV)

- [ ] T262 [P] Run accessibility audit on all pages in frontend/tests/ (use axe-core or Lighthouse, verify WCAG 2.1 Level AA compliance per FR-046)
- [ ] T263 [P] Add ARIA labels to interactive elements in frontend/src/components/ (buttons, inputs, links, ensure screen reader compatibility)
- [ ] T264 [P] Verify keyboard navigation in frontend/src/components/ (all interactive elements accessible via Tab, Enter, Space, Escape)
- [ ] T265 [P] Add loading states to all async operations in frontend/src/components/ (skeleton loaders, spinners, disable buttons during submission)
- [ ] T266 [P] Add error boundaries in frontend/src/App.tsx (React error boundaries, fallback UI, error reporting)
- [ ] T267 [P] Verify mobile responsiveness in frontend/ (test on phone/tablet viewports, ensure all features accessible, no horizontal scrolling)

### Documentation & Deployment

- [ ] T268 [P] Generate API documentation from OpenAPI specs in backend/ (use Swagger UI, serve at /api-docs, link to contracts/*.yaml)
- [ ] T269 [P] Create database seed script in backend/src/scripts/seed.ts (sample data for development: users, expos, exhibitors, sessions matching quickstart.md)
- [ ] T270 [P] Create Dockerfile for backend in docker/backend.Dockerfile (multi-stage build, Node.js LTS base, optimize layers)
- [ ] T271 [P] Create Dockerfile for frontend in docker/frontend.Dockerfile (Vite build, Nginx serve, optimize for production)
- [ ] T272 [P] Update quickstart.md validation in specs/001-expo-management-platform/quickstart.md (verify all setup steps work, test with fresh clone)
- [ ] T273 [P] Create deployment guide in docs/deployment.md (production environment setup, environment variables, database migration, monitoring setup)
- [ ] T274 [P] Create user documentation in docs/user-guide/ (separate guides for organizer, exhibitor, attendee roles with screenshots)


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-12)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after Foundational
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → US9 → US10)
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Organizer Creates Expo**: Independent, can start after Foundational
- **User Story 2 (P1) - Exhibitor Registers**: Independent, can start after Foundational (references User model from US1 but doesn't depend on US1 completion)
- **User Story 3 (P2) - Attendee Browses**: Independent, can start after Foundational (references ExpoEvent, ExhibitorProfile, Session but doesn't require US1/US2 completion for core functionality)
- **User Story 4 (P2) - Floor Plan**: Enhances US1 and US2, can start after Foundational (references ExpoEvent, BoothSpace)
- **User Story 5 (P2) - Real-Time Updates**: Integrates with US1, US2, US3, can start after those stories have WebSocket broadcast points implemented
- **User Story 6 (P3) - Exhibitor Approval**: Extends US2, can start after Foundational (adds approval workflow to existing ExhibitorProfile)
- **User Story 7 (P3) - Messaging**: Independent, can start after Foundational (references User model)
- **User Story 8 (P3) - Analytics**: Extends US1, can start after US1, US2, US3 have data to analyze
- **User Story 9 (P3) - Notifications**: Extends US3, can start after US3 has session bookmarks
- **User Story 10 (P3) - Feedback**: Independent, can start after Foundational

### Within Each User Story

- Backend models before backend services
- Backend services before backend routes
- Frontend types and API services can parallel backend
- Frontend stores and components depend on types
- Real-time events implemented after core backend logic
- Logging and validation added after core implementation

### Parallel Opportunities

**Setup (Phase 1)**:
- T003-T004, T005-T006, T007-T008, T009-T010, T011-T013 can all run in parallel

**Foundational (Phase 2)**:
- Backend: T016-T023, T027-T036 can run in parallel within their respective groups
- Frontend: T027-T036 can run in parallel

**User Stories**:
- Once Foundational completes, all user story backend models (T040-T041, T062-T064, T089-T091, T177, T210) can start in parallel
- Different user stories (US1, US2, US3, etc.) can be worked on in parallel by different team members
- Within each story: Frontend and backend can parallel (frontend T049-T052 while backend T042-T045)

**Polish (Phase 13)**:
- Almost all tasks marked [P] can run in parallel (T226-T275 are independent)

---

## Parallel Example: User Story 1

```bash
# Backend models (parallel):
Task T040: "Create User model in backend/src/models/User.ts"
Task T041: "Create ExpoEvent model in backend/src/models/ExpoEvent.ts"

# Frontend types and API services (parallel, while backend services in progress):
Task T049: "Create expo Zustand store in frontend/src/stores/expoStore.ts"
Task T050: "Create TypeScript types in frontend/src/types/expo.ts"
Task T051: "Create auth API service in frontend/src/services/authApi.ts"
Task T052: "Create expo API service in frontend/src/services/expoApi.ts"
```

---

## Parallel Example: Foundational Phase

```bash
# Backend middleware (all parallel):
Task T016: "Implement JWT utility functions in backend/src/utils/auth.ts"
Task T017: "Implement bcrypt password hashing in backend/src/utils/password.ts"
Task T018: "Create authentication middleware in backend/src/middleware/auth.ts"
Task T019: "Create RBAC middleware in backend/src/middleware/rbac.ts"
Task T020: "Create error handling middleware in backend/src/middleware/errorHandler.ts"
Task T021: "Create validation middleware in backend/src/middleware/validator.ts"
Task T022: "Create CORS middleware in backend/src/middleware/cors.ts"
Task T023: "Create logging utility in backend/src/utils/logger.ts"

# Frontend foundation (all parallel):
Task T027: "Create Axios client in frontend/src/services/api.ts"
Task T028: "Create Socket.io client in frontend/src/services/socket.ts"
Task T029: "Create auth Zustand store in frontend/src/stores/authStore.ts"
Task T031: "Create Material-UI theme in frontend/src/theme.ts"
Task T033: "Create LoadingSpinner component in frontend/src/components/common/LoadingSpinner.tsx"
Task T034: "Create ErrorAlert component in frontend/src/components/common/ErrorAlert.tsx"
Task T035: "Create ConfirmDialog component in frontend/src/components/common/ConfirmDialog.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

This represents the absolute minimum viable product that delivers immediate value:

1. **Complete Phase 1: Setup** (T001-T013)
2. **Complete Phase 2: Foundational** (T014-T039) - **CRITICAL, blocks all stories**
3. **Complete Phase 3: User Story 1** (T040-T061) - Organizer creates and manages expos
4. **Complete Phase 4: User Story 2** (T062-T088) - Exhibitor registers and selects booth
5. **STOP and VALIDATE**: Test both user stories independently
6. **MVP READY**: Organizers can manage expos, exhibitors can register and select booths
7. Deploy/demo if ready

**MVP Scope**: 88 tasks (Setup + Foundational + US1 + US2)

### Incremental Delivery (Recommended)

1. **Complete Setup + Foundational** (T001-T039) → Foundation ready
2. **Add User Story 1** (T040-T061) → Test independently → Deploy/Demo
3. **Add User Story 2** (T062-T088) → Test independently → **MVP!** Deploy/Demo
4. **Add User Story 3** (T089-T115) → Test independently → Three-role platform complete → Deploy/Demo
5. **Add User Story 5** (T131-T144) → Real-time updates working → Deploy/Demo
6. **Add User Story 4** (T116-T130) → Floor plan editor → Deploy/Demo
7. **Add User Stories 6-10** (T145-T225) → Full feature set → Deploy/Demo
8. **Complete Phase 13: Polish** (T226-T275) → Production-ready → **LAUNCH**

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (T001-T039)
2. **Once Foundational done**:
   - Developer A: User Story 1 (T040-T061) - Organizer portal
   - Developer B: User Story 2 (T062-T088) - Exhibitor portal
   - Developer C: User Story 3 (T089-T115) - Attendee portal
3. **Stories complete and integrate independently**
4. **Team tackles User Stories 4-10 in priority order**
5. **Team completes Polish together** (T226-T275)

---

## Notes

- **Total Tasks**: 275 tasks organized across 13 phases
- **MVP Scope**: 88 tasks (Phases 1-4)
- **Full MVP (Three Roles)**: 115 tasks (Phases 1-5)
- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests are addressed in Phase 13 (Polish) to meet constitutional 80%+ backend coverage
- Real-time updates (FR-034, FR-035, FR-036) integrated in User Story 5
- Security, RBAC, performance, accessibility, observability requirements from constitution addressed in Phase 13
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- See `specs/001-expo-management-platform/quickstart.md` for development environment setup
- See `specs/001-expo-management-platform/contracts/` for API specifications
- See `specs/001-expo-management-platform/data-model.md` for entity schemas

---

**Tasks Generated**: 2025-12-22
**Ready for Implementation**: Begin with Phase 1 (Setup)
**Next Command**: `/sp.implement` to start executing tasks (when available)
