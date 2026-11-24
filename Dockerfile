# Payload CMS 3.x production image (Next.js standalone output)
# Place this file in the ROOT of your Payload project (created with create-payload-app).

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ---------- 1. Install dependencies ----------
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "No lockfile found" && exit 1; \
  fi

# ---------- 2. Build ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time values (only used so `next build` can load payload.config.ts)
ARG PAYLOAD_SECRET=build-time-placeholder
ARG DATABASE_URI=postgres://payload:payload@postgres:5432/payload
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET \
    DATABASE_URI=$DATABASE_URI \
    NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  else npm run build; \
  fi

# ---------- 3. Runtime ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Upload folder for the Media collection (mounted as a volume in compose)
RUN mkdir -p /app/media && chown -R nextjs:nodejs /app/media

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/admin >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
