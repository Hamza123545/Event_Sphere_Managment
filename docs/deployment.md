# EventSphere Management Platform - Deployment Guide

This guide covers production deployment setup for the EventSphere Management Platform.

## Prerequisites

- Node.js 20.x LTS or higher
- MongoDB 6.0+ (local or MongoDB Atlas)
- Redis 6.0+ (for caching, job queues, and Socket.io scaling)
- Nginx (for frontend serving)
- Domain name with SSL certificate (for production)
- PM2 or similar process manager (recommended)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url> eventsphere-production
cd eventsphere-production
git checkout main  # or appropriate production branch
```

### 2. Environment Variables

Create `.env` files for both backend and frontend:

#### Backend `.env` (backend/.env)

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/eventsphere
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventsphere?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration (required for caching, queues, Socket.io)
REDIS_URL=redis://localhost:6379
# OR for Redis Cloud:
# REDIS_URL=redis://:password@host:port

# Frontend URL (for CORS and Socket.io)
FRONTEND_URL=https://yourdomain.com
SOCKET_IO_CORS_ORIGIN=https://yourdomain.com

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

#### Frontend `.env` (frontend/event_sphere_frontend/.env.production)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_CDN_URL=https://cdn.yourdomain.com
```

### 3. Database Setup

#### MongoDB Setup

1. **Local MongoDB:**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   # OR using Docker
   docker-compose -f docker/docker-compose.yml up -d mongodb
   ```

2. **MongoDB Atlas:**
   - Create cluster at https://cloud.mongodb.com
   - Create database user
   - Whitelist server IP address
   - Get connection string and update `MONGODB_URI`

3. **Create Indexes:**
   Indexes are automatically created when the application starts, but you can verify:
   ```bash
   cd backend
   npm run build
   npm start
   # Indexes are created automatically via Mongoose schema definitions
   ```

### 4. Redis Setup

#### Local Redis:

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis-server

# OR using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### Redis Cloud:

1. Sign up at https://redis.com/cloud
2. Create database
3. Get connection URL and update `REDIS_URL` in backend `.env`

### 5. Build Applications

#### Backend Build:

```bash
cd backend
npm install --production
npm run build
```

#### Frontend Build:

```bash
cd frontend/event_sphere_frontend
npm install
npm run build
# Output will be in dist/ directory
```

## Deployment Options

### Option A: Docker Deployment (Recommended)

#### 1. Build Docker Images

```bash
# Build backend image
docker build -f docker/backend.Dockerfile -t eventsphere-backend:latest .

# Build frontend image
docker build -f docker/frontend.Dockerfile -t eventsphere-frontend:latest .
```

#### 2. Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: eventsphere-mongodb-prod
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    networks:
      - eventsphere-network

  redis:
    image: redis:7-alpine
    container_name: eventsphere-redis-prod
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - eventsphere-network

  backend:
    build:
      context: .
      dockerfile: docker/backend.Dockerfile
    container_name: eventsphere-backend-prod
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/eventsphere
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      # ... other env vars
    depends_on:
      - mongodb
      - redis
    networks:
      - eventsphere-network

  frontend:
    build:
      context: .
      dockerfile: docker/frontend.Dockerfile
    container_name: eventsphere-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - eventsphere-network

volumes:
  mongodb_data:
  redis_data:

networks:
  eventsphere-network:
    driver: bridge
```

Start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option B: Traditional Server Deployment

#### 1. Backend Deployment

1. **Copy files to server:**
   ```bash
   scp -r backend/ user@server:/opt/eventsphere/backend
   ```

2. **Install dependencies:**
   ```bash
   ssh user@server
   cd /opt/eventsphere/backend
   npm install --production
   npm run build
   ```

3. **Setup PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name eventsphere-api
   pm2 save
   pm2 startup  # Setup PM2 to start on system boot
   ```

4. **Setup Nginx Reverse Proxy:**
   Create `/etc/nginx/sites-available/eventsphere-api`:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/eventsphere-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### 2. Frontend Deployment

1. **Copy build files:**
   ```bash
   scp -r frontend/event_sphere_frontend/dist/* user@server:/var/www/eventsphere/
   ```

2. **Configure Nginx:**
   Create `/etc/nginx/sites-available/eventsphere-frontend`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /var/www/eventsphere;
       index index.html;

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

       # Cache static assets
       location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/eventsphere-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 3. SSL Certificate Setup (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
# Follow prompts to configure SSL
```

## Monitoring Setup

### 1. Prometheus Setup

1. **Install Prometheus:**
   ```bash
   # Download and install Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   ```

2. **Configure Prometheus** (`prometheus.yml`):
   ```yaml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'eventsphere-api'
       static_configs:
         - targets: ['localhost:5000']
   ```

3. **Start Prometheus:**
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

### 2. Grafana Setup

1. **Install Grafana:**
   ```bash
   sudo apt-get install -y software-properties-common
   sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   sudo apt-get update
   sudo apt-get install grafana
   sudo systemctl start grafana-server
   sudo systemctl enable grafana-server
   ```

2. **Import Dashboard:**
   - Open Grafana UI (http://localhost:3000)
   - Default credentials: admin/admin
   - Go to Dashboards → Import
   - Upload `monitoring/grafana-dashboard.json`

### 3. Error Tracking (Optional)

For Sentry integration:
1. Create account at https://sentry.io
2. Create project and get DSN
3. Update `backend/src/utils/errorTracking.ts` to use Sentry SDK
4. Set `SENTRY_DSN` environment variable

## Database Migration

### Initial Setup

The application automatically creates indexes on first run. For manual verification:

```bash
cd backend
npm run build
node dist/server.js
# Indexes are created automatically via Mongoose schemas
```

### Seed Data (Development Only)

```bash
cd backend
npm run seed
# Creates sample users, expos, exhibitors, sessions
```

**⚠️ Warning:** Do not run seed script in production!

## Health Checks

### Backend Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Metrics Endpoint

```bash
curl http://localhost:5000/metrics
```

Returns Prometheus metrics format.

## Backup Strategy

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/eventsphere" --out=/backup/eventsphere-$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/eventsphere" /backup/eventsphere-YYYYMMDD/eventsphere
```

### Automated Backups (Cron)

```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * mongodump --uri="mongodb://localhost:27017/eventsphere" --out=/backup/eventsphere-$(date +\%Y\%m\%d) && find /backup -type d -mtime +30 -exec rm -rf {} +
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up rate limiting (already configured)
- [ ] Enable CORS for specific origins only
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for all secrets
- [ ] Restrict MongoDB/Redis network access

## Troubleshooting

### Backend won't start

1. Check MongoDB connection:
   ```bash
   mongosh "mongodb://localhost:27017/eventsphere"
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. Check logs:
   ```bash
   # PM2 logs
   pm2 logs eventsphere-api
   
   # Or if running directly
   tail -f backend/logs/combined.log
   ```

### High Memory Usage

- Monitor with: `pm2 monit`
- Check for memory leaks in logs
- Adjust Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=2048"`

### Database Connection Issues

- Verify MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify network connectivity and firewall rules

## Updates and Maintenance

### Application Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Build and restart backend
cd backend
npm install --production
npm run build
pm2 restart eventsphere-api

# 3. Rebuild and restart frontend
cd ../frontend/event_sphere_frontend
npm install
npm run build
sudo cp -r dist/* /var/www/eventsphere/
```

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update carefully, test thoroughly
npm update
npm audit fix
```

## Support

For issues and questions:
- Check logs: `backend/logs/combined.log` and `backend/logs/error.log`
- Review health endpoint: `/health`
- Check metrics: `/metrics`
- Review API documentation: `/api-docs`

