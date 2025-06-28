# Multi-stage build for Students Enrollment System
FROM node:18-alpine AS base

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app/client
COPY client/package.json client/bun.lock ./
RUN bun install --production --frozen-lockfile
COPY client/ ./
RUN bun run build

# Backend dependencies stage
FROM base AS backend-deps
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create app directory
WORKDIR /app

# Copy backend dependencies
COPY --from=backend-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs server/ ./server/
COPY --chown=nodejs:nodejs migrations/ ./migrations/
COPY --chown=nodejs:nodejs package.json bun.lock ./
COPY --chown=nodejs:nodejs server.js ./

# Copy built frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/client/build ./client/build/

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["bun", "run", "server.js"] 