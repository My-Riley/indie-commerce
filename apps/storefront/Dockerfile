# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspaces package files
COPY apps/server/package.json ./apps/server/
COPY apps/storefront/package.json ./apps/storefront/

# Remove local lockfiles to let root lockfile take precedence (avoids Next.js build warnings)
RUN rm -f apps/storefront/package-lock.json apps/server/package-lock.json

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ARG VENDURE_SHOP_API_URL
ENV VENDURE_SHOP_API_URL=$VENDURE_SHOP_API_URL

# Build the storefront
RUN npm run build -w storefront

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV PORT=3001
ENV NODE_ENV=production

# Copy necessary files for standalone mode
COPY --from=builder /app/apps/storefront/public ./apps/storefront/public
COPY --from=builder /app/apps/storefront/.next/standalone ./
COPY --from=builder /app/apps/storefront/.next/static ./apps/storefront/.next/static

EXPOSE 3001
