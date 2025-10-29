# Dockerfile - Citadel with environment lock and cache disable
FROM oven/bun:1.3-alpine

# Set working directory
WORKDIR /app

# Disable transpiler cache and telemetry for Docker
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
ENV DO_NOT_TRACK=1
ENV NODE_ENV=production

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy application code
COPY . .

# Build application
RUN bun build ./src/main.ts --outdir ./dist

# Expose port
EXPOSE 3000

# Run application
CMD ["bun", "run", "dist/main.js"]
