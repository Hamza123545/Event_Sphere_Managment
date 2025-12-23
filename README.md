# EventSphere Management Platform

A comprehensive event management system for organizing large-scale expos and trade shows.

## Quickstart

For detailed setup instructions, see [specs/001-expo-management-platform/quickstart.md](specs/001-expo-management-platform/quickstart.md)

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Mongoose, Socket.io
- **Frontend**: React 18, Vite, TypeScript, Material-UI, Zustand, React Router
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.io (WebSocket)

## Project Structure

```
EventSphere_Management/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── config/      # Configuration (database, etc.)
│   │   ├── models/      # Mongoose models
│   │   ├── controllers/ # Route controllers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
│   └── tests/           # Backend tests
├── frontend/            # Frontend React application
│   └── event_sphere_frontend/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API services
│       │   ├── stores/      # Zustand stores
│       │   └── utils/       # Utility functions
│       └── tests/           # Frontend tests
└── specs/              # Project specifications
    └── 001-expo-management-platform/
        ├── spec.md         # Feature specification
        ├── plan.md         # Implementation plan
        ├── data-model.md   # Data model
        └── tasks.md        # Implementation tasks
```

## Prerequisites

- Node.js v18+ or v20+
- MongoDB (local or MongoDB Atlas)
- pnpm or npm

## Quick Start

### Backend Setup

```bash
cd backend
pnpm install
cp .env.example .env  # Configure your environment variables
pnpm dev              # Start development server
```

### Frontend Setup

```bash
cd frontend/event_sphere_frontend
pnpm install
cp .env.example .env  # Configure your environment variables
pnpm dev              # Start development server
```

### Database Setup (Docker)

```bash
docker-compose up -d mongodb
```

## Environment Variables

See `.env.example` files in backend and frontend directories for required environment variables.

## Development

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`
- API endpoints are versioned: `/api/v1`

## Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend/event_sphere_frontend
pnpm test
```

## Constitution

This project follows the EventSphere Management Constitution v1.2.0. See [.specify/memory/constitution.md](.specify/memory/constitution.md) for principles and requirements.

## License

ISC


