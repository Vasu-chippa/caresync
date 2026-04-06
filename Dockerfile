# ===== Build Stage =====
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# ===== Production Stage =====
FROM node:18-alpine

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy backend source
COPY backend/src ./backend/src

# Copy frontend dist from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "backend/src/server.js"]
