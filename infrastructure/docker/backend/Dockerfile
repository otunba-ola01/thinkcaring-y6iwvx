# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies for npm modules that require compilation
RUN apk add --no-cache python3 make g++

# Copy package files for dependency installation
COPY src/backend/package*.json ./
RUN npm ci

# Copy TypeScript configuration file
COPY src/backend/tsconfig.json ./
# Copy source code
COPY src/backend/src ./src

# Build the TypeScript application for production
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1000 nodejs && adduser -u 1000 -G nodejs -s /bin/sh -D nodejs

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist
# Copy package files for production dependencies
COPY --from=builder /app/package*.json ./

# Install only production dependencies and clean npm cache
RUN npm ci --only=production && npm cache clean --force

# Set environment variable for production mode
ENV NODE_ENV=production

# Expose port for the API
EXPOSE 3000

# Switch to non-root user for security
USER nodejs

# Define health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

# Define the command to run the application
CMD ["node", "dist/server.js"]