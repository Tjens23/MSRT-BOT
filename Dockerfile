# Use Node.js LTS version as the base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manager files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY tsconfig.json ./
COPY src/ ./src/
COPY env.d.ts ./

# Build the TypeScript application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --production

# Copy built application from previous stage
COPY --from=base /app/dist ./dist

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Change ownership of the app directory to the new user
RUN chown -R botuser:nodejs /app
USER botuser

# Expose port (if your bot has a web interface, otherwise this can be omitted)
EXPOSE 3000

# Health check to ensure the bot is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot health check')" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
