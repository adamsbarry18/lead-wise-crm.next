########################
# Dependencies Stage #
########################
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for build
RUN apk add --no-cache libc6-compat

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

########################
#   Builder Stage      #
########################
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js with standalone output
RUN npm run build

# Ensure standalone directory exists
RUN ls -la .next/standalone || exit 1

########################
#   Runner Stage       #
########################
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/public && chown nextjs:nodejs /app/public
RUN mkdir -p /app/.next/static && chown nextjs:nodejs /app/.next/static

# Copy necessary files and ensure they exist
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 3000

# Set the correct environment variable for the port
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"] 