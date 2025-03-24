# Build stage for compiling the Next.js application
FROM node:18-alpine AS builder
# Version: 18-alpine (minimal Node.js 18 LTS image for smaller size)

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files first to leverage Docker layer caching
COPY src/web/package*.json ./

# Install dependencies using ci for reproducible builds
RUN npm ci

# Copy Next.js configuration
COPY src/web/next.config.js ./

# Copy public assets and source code
COPY src/web/public ./public
COPY src/web/src ./src

# Build the Next.js application
RUN npm run build

# Production stage with minimal dependencies
FROM node:18-alpine
# Version: 18-alpine (minimal Node.js 18 LTS image for smaller size)

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1000 nodejs && \
    adduser -u 1000 -G nodejs -s /bin/sh -D nodejs

# Copy only necessary files from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies and clean npm cache
RUN npm ci --only=production && \
    npm cache clean --force

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Use non-root user for security
USER nodejs

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Command to run the Next.js production server
CMD ["npm", "run", "start"]