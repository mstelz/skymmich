# Multi-stage build for Skymmich
# SECURITY: This image does not contain any secrets or API keys
# All sensitive configuration is provided via environment variables at runtime
FROM node:24-alpine AS builder

# Upgrade npm to fix tar (CVE-2026-26960) and minimatch (CVE-2026-26996)
RUN npm install -g npm@11.10.1

# Set working directory
WORKDIR /build

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Install all dependencies (including dev dependencies for build)
# Handle npm bug with Rollup optional dependencies on ARM64/musl
RUN npm ci || (npm cache clean --force && npm install)

# Copy source code
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY tools/ ./tools/

# Build frontend and copy assets
RUN npm run build:docker

# Production stage
FROM node:24-alpine AS runtime

# Upgrade npm to fix tar (CVE-2026-26960) and minimatch (CVE-2026-26996)
RUN npm install -g npm@11.10.1

# Install curl for health checks, su-exec for privilege dropping, and shadow for user management
# hadolint ignore=DL3018
RUN apk add --no-cache curl su-exec shadow

# Create app user for security (will be remapped via PUID/PGID if provided)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S skymmich -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies, excluding better-sqlite3
RUN npm pkg delete dependencies.better-sqlite3 && npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage (includes tools, config, and public assets)
COPY --from=builder /build/dist ./dist

# Create directories for runtime
RUN mkdir -p /app/config /app/logs /app/sidecars

# Copy startup script
COPY docker/startup.sh ./
RUN chmod +x startup.sh

# Run as root initially to allow PUID/PGID remapping in startup.sh
USER root

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["./startup.sh"]