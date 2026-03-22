# syntax=docker/dockerfile:1

# ────────────────────────────────────────────────
# Stage 1 – install dependencies
# ────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile 2>/dev/null || npm install

# ────────────────────────────────────────────────
# Stage 2 – build the Next.js app
# ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args become env vars at build time (needed by Next.js)
ARG MONGODB_URI
ARG ANTHROPIC_API_KEY

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ────────────────────────────────────────────────
# Stage 3 – production runner
# ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what Next.js standalone output needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Config volume (writable at runtime by the app)
RUN mkdir -p /app/config && chown nextjs:nodejs /app/config
VOLUME ["/app/config"]

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
