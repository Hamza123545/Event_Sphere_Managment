---
title: EventSphere Backend
emoji: 🎪
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: isc
---

# EventSphere Backend API

EventSphere Management Platform Backend API built with Node.js, Express, TypeScript, and MongoDB.

## Features

- RESTful API for event management
- Real-time updates with Socket.io
- Background job processing with Bull
- Redis caching
- MongoDB database
- JWT authentication
- Role-based access control
- File uploads
- Analytics and reporting

## API Documentation

Once deployed, visit `/api-docs` for Swagger UI documentation.

## Health Check

Visit `/health` to check the API status.

## Environment Variables

The following environment variables are required:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `REDIS_URL` - Redis connection URL (optional, defaults to localhost)
- `PORT` - Server port (defaults to 7860 for Hugging Face Spaces)

## MongoDB Atlas Configuration

**Important:** If you're using MongoDB Atlas, you need to whitelist the Hugging Face Spaces IP addresses:

1. Go to your MongoDB Atlas dashboard
2. Navigate to **Network Access** in the left sidebar
3. Click **Add IP Address**
4. For development/testing, you can add `0.0.0.0/0` to allow all IPs (less secure but works for all cloud deployments)
5. For production, you may need to contact Hugging Face support to get their IP ranges, or use `0.0.0.0/0` with proper authentication

**Note:** The error "Could not connect to any servers in your MongoDB Atlas cluster" typically means the Space's IP address is not whitelisted.

## License

ISC

