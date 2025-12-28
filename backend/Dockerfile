# Dockerfile for Hugging Face Spaces
# Node.js backend for EventSphere Management Platform

# Use Node.js LTS version
FROM node:20-alpine

# Create non-root user (HF Spaces requirement)
# Check if group/user exists, create if not
RUN if ! getent group appuser > /dev/null 2>&1; then \
        addgroup -g 1001 appuser || addgroup appuser; \
    fi && \
    if ! id -u appuser > /dev/null 2>&1; then \
        adduser -D -u 1001 -G appuser appuser || adduser -D -G appuser appuser; \
    fi

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7860/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application on port 7860
# HF Spaces sets PORT=7860 automatically, but we default to it
ENV PORT=7860

CMD ["node", "dist/server.js"]
