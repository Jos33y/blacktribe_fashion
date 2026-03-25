# ─────────────────────────────────────────────────────
# BLACKTRIBE FASHION — Production Dockerfile
# Single container: Vite build → Express serves dist/ + /api/*
# Deploy on Coolify with auto-deploy from GitHub main branch
# ─────────────────────────────────────────────────────

# ─── Build stage ───
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for Vite build)
RUN npm ci

# Copy source code
COPY . .

# Build the React frontend (Vite copies public/ into dist/ automatically)
RUN npm run build

# ─── Production stage ───
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend from build stage (includes all public/ assets)
COPY --from=build /app/dist ./dist

# Copy server code
COPY server.js ./
COPY server/ ./server/

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run
CMD ["node", "server.js"]
