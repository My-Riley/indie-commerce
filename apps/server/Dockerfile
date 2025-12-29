# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspaces package files
COPY apps/server/package.json ./apps/server/
COPY apps/storefront/package.json ./apps/storefront/

# Remove local lockfiles
RUN rm -f apps/storefront/package-lock.json apps/server/package-lock.json

# Install dependencies including root and all workspaces
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the server and dashboard
RUN npm run build -w server && npm run build:dashboard -w server

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/static ./apps/server/static
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
