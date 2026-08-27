# syntax=docker/dockerfile:1

# Jiffy — self-contained image built from source.
# Builds on the same architecture it will run on, so a Pi/NAS (arm64) and a
# desktop (amd64) both get the right native binaries without extra config.

# ── deps ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
# Some of Next's native binaries (SWC, sharp) expect glibc symbols on musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Needs network access: next/font/google downloads the Geist webfonts at build.
# No API keys needed here — nothing in this app is baked in at build time.
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# `output: "standalone"` (next.config.ts) emits a minimal server plus only the
# node_modules it actually traced. public/ and .next/static are not included in
# that output and have to be copied alongside it.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000

# Cheap liveness probe: no upstream calls, 200 even with no provider keys set.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/providers" >/dev/null || exit 1

CMD ["node", "server.js"]
