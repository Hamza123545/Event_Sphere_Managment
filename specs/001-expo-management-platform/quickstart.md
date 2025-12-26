# Quickstart Guide: EventSphere Management Platform

**Feature Branch**: `001-expo-management-platform`
**Created**: 2025-12-22
**Target Audience**: Developers setting up local development environment
**Estimated Setup Time**: 30-45 minutes

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | LTS v18+ or v20+ | https://nodejs.org/ |
| **MongoDB** | v6.0+ or MongoDB Atlas account | https://www.mongodb.com/try/download/community |
| **Git** | Latest | https://git-scm.com/downloads |
| **npm** or **pnpm** | Comes with Node.js | - |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or v20.x.x

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check MongoDB installation (if local)
mongod --version
# Expected: db version v6.x.x or higher

# Check Git
git --version
# Expected: git version 2.x.x
```

---

## Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url> eventsphere-management
cd eventsphere-management

# Checkout feature branch
git checkout 001-expo-management-platform

# Verify you're on the correct branch
git branch
# Should show: * 001-expo-management-platform
```

---

## Step 2: Setup MongoDB

### Option A: Local MongoDB

```bash
# Start MongoDB service (macOS/Linux)
brew services start mongodb-community@6.0

# Or for Windows (run as Administrator)
net start MongoDB

# Create database directory (if not exists)
mkdir -p data/db

# Start MongoDB with custom data directory (alternative)
mongod --dbpath ./data/db
```

### Option B: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier M0)
3. Whitelist your IP address (Network Access)
4. Create database user (Database Access)
5. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/eventsphere?retryWrites=true&w=majority`

---

## Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Or using pnpm (faster)
pnpm install
```

### Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
# backend/.env

# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/eventsphere

# Option B: MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eventsphere?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (for password reset, notifications)
# Option A: Development (use Ethereal for testing)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=<ethereal-username>
EMAIL_PASSWORD=<ethereal-password>
EMAIL_FROM=noreply@eventsphere.com

# Option B: Production (use SendGrid, AWS SES, etc.)
# EMAIL_SERVICE=sendgrid
# EMAIL_API_KEY=<your-sendgrid-api-key>

# File Upload Configuration
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads

# Redis Configuration (for Socket.io scaling, optional for local dev)
# REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

**Important**: Update `JWT_SECRET` with a secure random string:

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generate Ethereal Email Account (Development Testing)

```bash
# Run this script to generate test email credentials
node -e "require('nodemailer').createTestAccount((err, account) => { console.log('SMTP Host:', account.smtp.host); console.log('SMTP Port:', account.smtp.port); console.log('User:', account.user); console.log('Password:', account.pass); });"
```

Copy the output to your `.env` file `EMAIL_*` variables.

---

## Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from repository root)
cd frontend

# Install dependencies
npm install

# Or using pnpm
pnpm install
```

### Configure Environment Variables

Create `.env` file in `frontend/` directory:

```bash
# frontend/.env

# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# Environment
VITE_APP_ENV=development

# Feature Flags (optional, for future use)
# VITE_ENABLE_ANALYTICS=false
# VITE_ENABLE_DARK_MODE=true
```

---

## Step 5: Seed Database (Optional)

Seed the database with sample data for testing:

```bash
# From backend directory
cd backend

# Run seed script
npm run seed

# Expected output:
# ✓ Connected to MongoDB
# ✓ Created 3 users (organizer, exhibitor, attendee)
# ✓ Created 2 expo events
# ✓ Created floor plan with 10 booths
# ✓ Created 5 sessions
# ✓ Created 3 exhibitor profiles
# ✓ Created 2 attendee registrations
# ✓ Database seeded successfully!
```

**Sample Accounts** (after seeding):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eventsphere.com | admin123 |
| Organizer | organizer@eventsphere.com | organizer123 |
| Exhibitor | exhibitor1@eventsphere.com | exhibitor123 |
| Attendee | attendee1@eventsphere.com | attendee123 |

---

## Step 6: Run the Application

### Terminal 1: Start Backend

```bash
# From backend directory
cd backend

# Development mode with hot reload
npm run dev

# Expected output:
# [INFO] EventSphere API Server
# [INFO] Environment: development
# [INFO] MongoDB connected: eventsphere
# [INFO] Server listening on port 5000
# [INFO] WebSocket server ready
```

**Verify Backend**:
- API Health: http://localhost:5000/health
- API Documentation: http://localhost:5000/api-docs (Swagger UI)
- Metrics: http://localhost:5000/metrics (Prometheus metrics)

### Terminal 2: Start Frontend

```bash
# From frontend directory
cd frontend

# Development mode with hot reload
npm run dev

# Expected output:
# VITE v4.x.x ready in XXX ms
# ➜  Local:   http://localhost:3000/
# ➜  Network: http://192.168.x.x:3000/
```

**Access Application**:
- Open browser: http://localhost:3000
- Login with sample accounts (see table above)

---

## Step 7: Verify Setup

### Backend Health Check

```bash
# Test API health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-12-22T10:30:00Z",
#   "uptime": 120,
#   "database": "connected"
# }
```

### Test Authentication

```bash
# Register new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "attendee",
    "profile": {
      "firstName": "Test",
      "lastName": "User"
    },
    "gdprConsent": {
      "dataProcessingConsent": true
    }
  }'

# Expected response: 201 Created with JWT token
```

### Test WebSocket Connection

Open browser console at http://localhost:3000 and run:

```javascript
// This should be handled by the frontend app automatically
// Check browser DevTools -> Network -> WS to see WebSocket connection

// You should see:
// ✓ WebSocket connection established
// ✓ Connected to Socket.io server
```

---

## Step 8: Development Workflow

### Backend Development

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Development

```bash
# Run component tests
npm run test

# Run E2E tests (requires backend running)
npm run test:e2e

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Step 9: Database Management

### MongoDB Compass (GUI Tool)

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `eventsphere`
4. Explore collections: `users`, `expoevents`, `booths`, etc.

### MongoDB Shell Commands

```bash
# Connect to MongoDB shell
mongosh

# Switch to eventsphere database
use eventsphere

# View all collections
show collections

# Count users
db.users.countDocuments()

# Find all organizers
db.users.find({ role: "organizer" })

# Clear database (CAUTION: Deletes all data)
db.dropDatabase()
```

---

## Troubleshooting

### Issue: MongoDB Connection Failed

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Verify MongoDB is running: `ps aux | grep mongod` (macOS/Linux) or Task Manager (Windows)
2. Start MongoDB: `brew services start mongodb-community@6.0` or `net start MongoDB`
3. Check connection string in `backend/.env`

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000   # macOS/Linux
netstat -ano | findstr :5000   # Windows

# Kill the process
kill -9 <PID>   # macOS/Linux
taskkill /PID <PID> /F   # Windows

# Or change port in backend/.env
PORT=5001
```

### Issue: Module Not Found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Issue: CORS Errors

**Error**: `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS`

**Solution**:
- Verify `FRONTEND_URL=http://localhost:3000` in `backend/.env`
- Restart backend server after changing `.env`

### Issue: JWT Authentication Fails

**Error**: `401 Unauthorized: Invalid token`

**Solution**:
- Clear browser localStorage: `localStorage.clear()` in browser console
- Logout and login again
- Verify `JWT_SECRET` is set in `backend/.env`

---

## Next Steps

### For Frontend Developers

1. **Explore Components**: Navigate to `frontend/src/components/`
2. **Review Routes**: Check `frontend/src/App.tsx` for routing structure
3. **State Management**: See `frontend/src/stores/` for Zustand stores
4. **API Integration**: Review `frontend/src/services/` for API client setup
5. **Styling**: Material-UI components in `frontend/src/components/`

**Start Building**:
- Implement organizer dashboard (see `spec.md` User Story 1)
- Create exhibitor registration form (see `spec.md` User Story 2)
- Build attendee expo directory (see `spec.md` User Story 3)

### For Backend Developers

1. **Review Data Models**: Check `backend/src/models/` for Mongoose schemas (reference `data-model.md`)
2. **API Routes**: Explore `backend/src/routes/` for Express route definitions (reference `contracts/*.yaml`)
3. **Controllers**: See `backend/src/controllers/` for request handling logic
4. **Middleware**: Check `backend/src/middleware/` for authentication, validation, error handling
5. **Real-Time**: Review `backend/src/services/realtime.ts` for Socket.io implementation (reference `contracts/realtime-events.md`)

**Start Building**:
- Implement authentication routes (see `contracts/auth-api.yaml`)
- Create expo management endpoints (see `contracts/expo-api.yaml`)
- Build exhibitor portal APIs (see `contracts/exhibitor-api.yaml`)

### For Full-Stack Developers

1. **Review Architecture**: Understand MERN stack structure and constitutional requirements (`.specify/memory/constitution.md`)
2. **Study API Contracts**: Review all OpenAPI specifications in `specs/001-expo-management-platform/contracts/`
3. **Understand Data Flow**: Trace request → route → controller → service → model
4. **Test Real-Time**: Implement Socket.io event handling for schedule updates

**Start Building**:
- Implement end-to-end user story (organizer creates expo → exhibitor registers → attendee browses)
- Add real-time updates for booth allocations (see `contracts/realtime-events.md`)
- Create comprehensive E2E tests with Playwright

---

## Useful Resources

### Documentation

- **Project Constitution**: `.specify/memory/constitution.md`
- **Feature Specification**: `specs/001-expo-management-platform/spec.md`
- **Implementation Plan**: `specs/001-expo-management-platform/plan.md`
- **Data Model**: `specs/001-expo-management-platform/data-model.md`
- **API Contracts**: `specs/001-expo-management-platform/contracts/`
- **Research Decisions**: `specs/001-expo-management-platform/research.md`

### Technology Documentation

- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Material-UI**: https://mui.com/material-ui/
- **Zustand**: https://docs.pmnd.rs/zustand/
- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **Socket.io**: https://socket.io/docs/v4/
- **Playwright**: https://playwright.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/

### Community

- **Slack/Discord**: [Link to team communication channel]
- **Issue Tracker**: [Link to GitHub Issues]
- **Wiki**: [Link to project wiki]

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Logs**: Review console output for error messages
2. **Search Issues**: Check GitHub Issues for similar problems
3. **Ask Team**: Post in team Slack/Discord channel
4. **Documentation**: Review official technology documentation links above

---

**Quickstart Guide Completed**: 2025-12-22
**Ready for Development**: Begin building features from `tasks.md` (to be generated with `/sp.tasks`)
