FROM node:22.21.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat && yarn global add pnpm

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* source.config.ts next.config.mjs ./
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM deps AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY . .

# Set placeholder environment variables for build time
# These will be overridden at runtime with real values
ENV QSTASH_URL=https://qstash.upstash.io
ENV QSTASH_TOKEN=build-time-placeholder
ENV QSTASH_CURRENT_SIGNING_KEY=build-time-placeholder
ENV QSTASH_NEXT_SIGNING_KEY=build-time-placeholder
ENV DATABASE_URL=postgres://user:pass@localhost:5432/db
ENV BLOB_READ_WRITE_TOKEN=build-time-placeholder
ENV AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV AUTH_SECRET=placeholder_secret_32_characters_long_min_ok

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]