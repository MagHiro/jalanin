# syntax=docker/dockerfile:1
# Jalanin production image: standalone Next.js + native PostgreSQL client.
# No Supabase SDK, no dev tooling in the final layer.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Public (NEXT_PUBLIC_*) values are inlined into client JS at build time and
# CANNOT be supplied via env_file at runtime. They arrive as build args from
# compose.prod.yml (sourced from .env.prod). Server secrets (DATABASE_URL,
# SMTP_*, CRON_SECRET, ...) must NEVER become build args — they stay
# runtime-only via env_file on the app/migrate services.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
  NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs \
  && mkdir -p /app/storage/private /app/storage/public /app/.next/cache \
  && chown -R nextjs:nodejs /app/storage /app/.next
# Production-only dependencies (pg for the migrate entrypoint; Next
# standalone server carries its own traced copy for the app itself).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod \
  && pnpm store prune && rm -rf /root/.cache /tmp/*
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.prod.mjs ./scripts/migrate.prod.mjs
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
# Readiness depends on migrations (see compose migrate service + healthcheck).
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
