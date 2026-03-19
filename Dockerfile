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

COPY . .

# Use ARG instead of ENV for build-time secrets (avoids Docker secret warnings)
# These are placeholder values only - overridden at runtime
ARG QSTASH_URL=https://qstash.upstash.io
ARG QSTASH_TOKEN=build-time-placeholder
ARG QSTASH_CURRENT_SIGNING_KEY=build-time-placeholder
ARG QSTASH_NEXT_SIGNING_KEY=build-time-placeholder
ARG DATABASE_URL=postgres://user:pass@localhost:5432/db
ARG BLOB_READ_WRITE_TOKEN=build-time-placeholder
ARG AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG AUTH_SECRET=placeholder_secret_32_characters_long_ok

# Export ARGs as ENV so Next.js build can read them
ENV QSTASH_URL=$QSTASH_URL \
    QSTASH_TOKEN=$QSTASH_TOKEN \
    QSTASH_CURRENT_SIGNING_KEY=$QSTASH_CURRENT_SIGNING_KEY \
    QSTASH_NEXT_SIGNING_KEY=$QSTASH_NEXT_SIGNING_KEY \
    DATABASE_URL=$DATABASE_URL \
    BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN \
    AUTH_URL=$AUTH_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    AUTH_SECRET=$AUTH_SECRET \
    DOCKER=true \
    NEXT_TELEMETRY_DISABLED=1

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

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
