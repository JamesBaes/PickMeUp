# PickMeUp-Manager — Docker Containerization Instructions

These instructions are for the **PickMeUp-Manager** repo only. They are part of a broader effort to containerize both PickMeUp apps so they can be run together in a shared testing environment via Docker Compose.

---

## Context

PickMeUp-Manager (staff/admin app) and PickMeUp (customer ordering app) will each run in their own Docker container. They communicate over a shared Docker network:

- Manager is accessible at `http://localhost:3000` on the host
- Customer app is accessible at `http://localhost:3001` on the host
- The Manager calls the Customer app's `/api/analytics` endpoint server-side via `CLIENT_APP_URL`. Inside Docker this must be `http://customer:3000` (Docker internal DNS), not `localhost`

---

## Files to Create / Modify

### 1. Modify `next.config.ts`

Add `output: 'standalone'` to the config. This tells Next.js to produce a self-contained build in `.next/standalone/`, which is required for the Dockerfile below. It shrinks the final image from ~500 MB to ~150 MB.

**Current file:**
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

**Updated file:**
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

---

### 2. Create `.dockerignore` at the repo root

```
node_modules
.next
.git
.gitignore
.env*
*.tsbuildinfo
next-env.d.ts
.DS_Store
npm-debug.log*
yarn-error.log*
.vercel
out
coverage
```

---

### 3. Create `Dockerfile` at the repo root

This is a 3-stage build:
- **deps** — installs npm packages (cached layer, separate from source code changes)
- **builder** — runs `next build` with `NEXT_PUBLIC_*` vars baked in at build time
- **runner** — minimal final image using only the standalone output

```dockerfile
# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the application ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the browser bundle at build time.
# They must be supplied via --build-arg when running `docker build`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the standalone output — no source code, no dev dependencies
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# HOSTNAME=0.0.0.0 is required — Next.js standalone defaults to 127.0.0.1
# which is unreachable from outside the container.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## How to Build and Push to DockerHub

Once the above files are in place, run the following from the repo root. Replace `<dockerhub-user>` with your DockerHub username and fill in the actual values from `.env.local`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="phc_..." \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -t <dockerhub-user>/pickmeup-manager:latest \
  .

docker push <dockerhub-user>/pickmeup-manager:latest
```

> **Apple Silicon (M1/M2/M3):** If building for a Linux/AMD64 target, add `--platform linux/amd64` to the build command.

---

## Runtime Environment Variables

The following variables are **not** baked into the image — they are injected at container start via `docker-compose.yml` on the host machine. No changes are needed in this repo for these; they are managed in the shared `~/pickmeup-docker/.env` file.

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level Supabase key |
| `SQUARE_ACCESS_TOKEN` | Square Sandbox token |
| `POSTHOG_PERSONAL_API_KEY` | PostHog server-side key |
| `POSTHOG_PROJECT_ID` | PostHog project ID |
| `ANALYTICS_API_KEY` | Shared secret for `/api/analytics` calls |
| `CLIENT_APP_URL` | Set to `http://customer:3000` by docker-compose (Docker internal DNS) |

---

## Summary of Changes

| File | Action |
|------|--------|
| `next.config.ts` | Edit — add `output: 'standalone'` |
| `.dockerignore` | Create at repo root |
| `Dockerfile` | Create at repo root |
