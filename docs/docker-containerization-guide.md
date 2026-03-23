# Docker Containerization Guide

## Overview

This guide walks through containerizing both PickMeUp apps and connecting them in a shared testing environment using Docker and DockerHub.

### Apps Involved

| App | Role | Default Port |
|-----|------|-------------|
| **PickMeUp** (this repo) | Customer ordering app | 3001 (on host) |
| **PickMeUp-Manager** | Staff/admin app | 3000 (on host) |

### How They Connect

Both apps share the same **Supabase cloud database**. The Manager also makes a server-side HTTP call to the Customer app's `/api/analytics` endpoint via the `CLIENT_APP_URL` environment variable. In Docker, this cross-container call uses Docker's internal DNS instead of `localhost`.

```
Browser → localhost:3000 → [pickmeup-manager container]
                                    ↓ server-side fetch (Docker internal DNS)
                           http://customer:3000/api/analytics
                                    ↓
Browser → localhost:3001 → [pickmeup-customer container]
                                    ↓
                           Supabase (cloud) ← both apps share this
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [DockerHub](https://hub.docker.com/) account — note your username (`<dockerhub-user>`)
- Both repos cloned locally:
  - `Fall-2025/CPSY-301/Phase3/PickMeUp` (this repo)
  - `Winter-2026/Capstone/PickMeUp-Staff/PickMeUp-Manager`

---

## Understanding NEXT_PUBLIC_* Variables

> This is the most important concept before you start.

Next.js bakes `NEXT_PUBLIC_*` variables into the browser JavaScript bundle **at build time** (`npm run build`). They cannot be changed after the image is built. This means:

- **Build-time vars** (`NEXT_PUBLIC_*`) → passed as Docker `--build-arg` flags when running `docker build`
- **Runtime vars** (secrets like `SUPABASE_SERVICE_ROLE_KEY`, `SQUARE_ACCESS_TOKEN`) → injected via `docker-compose.yml` at container start

If a `NEXT_PUBLIC_*` value changes (e.g. you switch Supabase projects), you must **rebuild and re-push** the image.

---

## Step 1 — Modify `next.config.ts` in Both Apps

The `output: 'standalone'` setting tells Next.js to produce a self-contained build in `.next/standalone/` that includes only what's needed to run the server. This shrinks the final Docker image from ~500 MB down to ~150 MB.

### PickMeUp (Customer App)

Edit [next.config.ts](../next.config.ts) — add `output: 'standalone'`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',           // ← add this line
  serverExternalPackages: ["square"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
```

### PickMeUp-Manager

Edit `next.config.ts` in the Manager repo — add `output: 'standalone'`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',           // ← add this line
};

export default nextConfig;
```

---

## Step 2 — Create `.dockerignore` in Both Apps

A `.dockerignore` file prevents large or sensitive directories from being sent to Docker during build. Create this file at the root of **each repo**:

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

**Why each entry matters:**
- `node_modules` — Docker installs its own inside the container (Linux vs your Mac ARM); copying yours would break it
- `.next` — the build stage regenerates this from scratch
- `.env*` — keeps your secrets out of the image layers
- `.DS_Store` — Mac metadata, not needed

---

## Step 3 — Create `Dockerfile` for PickMeUp (Customer App)

Create a file named `Dockerfile` at the root of the PickMeUp repo. This uses a **3-stage build**:

1. **deps** — installs npm packages (cached separately from source changes)
2. **builder** — runs `next build` with your `NEXT_PUBLIC_*` vars baked in
3. **runner** — the final minimal image that actually runs

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
# They must be provided here via --build-arg during `docker build`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SQUARE_APP_ID
ARG NEXT_PUBLIC_SQUARE_LOCATION_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SQUARE_APP_ID=$NEXT_PUBLIC_SQUARE_APP_ID
ENV NEXT_PUBLIC_SQUARE_LOCATION_ID=$NEXT_PUBLIC_SQUARE_LOCATION_ID
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Disable Next.js telemetry during CI/builds
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security (best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the standalone output — no source code, no dev deps
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# HOSTNAME=0.0.0.0 is required — Next.js standalone defaults to localhost (127.0.0.1)
# which is unreachable from outside the container. 0.0.0.0 binds to all interfaces.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## Step 4 — Create `Dockerfile` for PickMeUp-Manager

Create a `Dockerfile` at the root of the PickMeUp-Manager repo. Same 3-stage pattern, different `NEXT_PUBLIC_*` args:

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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## Step 5 — Create the Docker Compose Directory

Because the two repos live in different directories, create a **new shared folder** to hold the `docker-compose.yml` and runtime secrets. This folder is not inside either repo.

```bash
mkdir ~/pickmeup-docker
cd ~/pickmeup-docker
```

### Create `~/pickmeup-docker/.env`

This file holds **runtime secrets only** — values that are server-side and don't need to be baked into the image. Copy the relevant values from your `.env.local` files:

```bash
# ~/pickmeup-docker/.env
# DO NOT commit this file to any repo

# Supabase (shared between both apps)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Square Sandbox
SQUARE_ACCESS_TOKEN=your_square_sandbox_token_here

# Resend (customer app only)
RESEND_API_KEY=your_resend_api_key_here

# PostHog (server-side keys)
POSTHOG_PERSONAL_API_KEY=your_posthog_personal_api_key_here
POSTHOG_PROJECT_ID=your_posthog_project_id_here

# Analytics API key (must match in both apps' .env.local)
ANALYTICS_API_KEY=your_analytics_api_key_here

# reCAPTCHA (customer app server-side)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
```

### Create `~/pickmeup-docker/docker-compose.yml`

Replace `<dockerhub-user>` with your DockerHub username:

```yaml
version: "3.9"

services:
  customer:
    image: <dockerhub-user>/pickmeup-customer:latest
    container_name: pickmeup-customer
    ports:
      - "3001:3000"     # Customer app reachable at http://localhost:3001
    environment:
      # Runtime secrets — injected from .env file at container start
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SQUARE_ACCESS_TOKEN: ${SQUARE_ACCESS_TOKEN}
      RESEND_API_KEY: ${RESEND_API_KEY}
      POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY}
      POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID}
      ANALYTICS_API_KEY: ${ANALYTICS_API_KEY}
      RECAPTCHA_SECRET_KEY: ${RECAPTCHA_SECRET_KEY}
    restart: unless-stopped
    networks:
      - pickmeup-net
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  manager:
    image: <dockerhub-user>/pickmeup-manager:latest
    container_name: pickmeup-manager
    ports:
      - "3000:3000"     # Manager app reachable at http://localhost:3000
    environment:
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SQUARE_ACCESS_TOKEN: ${SQUARE_ACCESS_TOKEN}
      POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY}
      POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID}
      ANALYTICS_API_KEY: ${ANALYTICS_API_KEY}
      # Inter-container URL — uses Docker's internal DNS, NOT localhost
      # "customer" here refers to the service name defined above
      CLIENT_APP_URL: http://customer:3000
    depends_on:
      customer:
        condition: service_healthy   # Wait for customer healthcheck to pass
    restart: unless-stopped
    networks:
      - pickmeup-net

networks:
  pickmeup-net:
    driver: bridge
```

**Why `CLIENT_APP_URL: http://customer:3000` and not `http://localhost:3001`?**

Inside the `manager` container, `localhost` refers to the manager container itself — not the host machine or the customer container. Docker Compose gives each service a DNS name matching its service key. The `customer` service is reachable at `http://customer:3000` from any container on the same `pickmeup-net` network.

---

## Step 6 — Build and Push to DockerHub

> Run these commands from the root of each repo. Replace `<dockerhub-user>` and fill in the values from your `.env.local` files.

### Log in to DockerHub

```bash
docker login
# Enter your DockerHub username and password when prompted
```

### Build & Push the Customer App

```bash
cd /path/to/PickMeUp

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
  --build-arg NEXT_PUBLIC_SQUARE_APP_ID="sandbox-sq0idb-..." \
  --build-arg NEXT_PUBLIC_SQUARE_LOCATION_ID="..." \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="phc_..." \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6L..." \
  -t <dockerhub-user>/pickmeup-customer:latest \
  .

docker push <dockerhub-user>/pickmeup-customer:latest
```

### Build & Push the Manager App

```bash
cd /path/to/PickMeUp-Manager

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

### Apple Silicon Note (M1/M2/M3)

If you are building on a Mac with Apple Silicon and the target deployment machine is Linux/AMD64, add the `--platform` flag:

```bash
docker build --platform linux/amd64 ...
```

Omit this if you're only running the containers locally on your Mac.

---

## Step 7 — Run the Testing Environment

Once both images are on DockerHub, anyone with the `docker-compose.yml` and a `.env` file can spin up the full environment with two commands:

```bash
cd ~/pickmeup-docker

# Pull latest images and start both containers in the background
docker-compose up -d

# Check that both containers are running
docker-compose ps
```

Expected output:
```
NAME                  IMAGE                                    STATUS
pickmeup-customer     <dockerhub-user>/pickmeup-customer:latest   Up (healthy)
pickmeup-manager      <dockerhub-user>/pickmeup-manager:latest    Up
```

**Access the apps:**
- Customer app: http://localhost:3001
- Manager/staff app: http://localhost:3000

### Useful Commands

```bash
# Stream logs from both containers
docker-compose logs -f

# Stream logs from one container
docker-compose logs -f customer
docker-compose logs -f manager

# Restart a single container
docker-compose restart manager

# Pull updated images and restart
docker-compose pull && docker-compose up -d

# Stop and remove containers (keeps images)
docker-compose down

# Stop, remove containers, and remove images
docker-compose down --rmi all
```

---

## Environment Variable Reference

### What Goes Where

| Variable | Type | Set At | Where |
|----------|------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Build time | `--build-arg` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Build time | `--build-arg` |
| `NEXT_PUBLIC_SQUARE_APP_ID` | Public | Build time | `--build-arg` (customer only) |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Public | Build time | `--build-arg` (customer only) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | Build time | `--build-arg` |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | Build time | `--build-arg` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Public | Build time | `--build-arg` (customer only) |
| `NEXT_PUBLIC_APP_URL` | Public | Build time | `--build-arg` (manager only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Runtime | `~/pickmeup-docker/.env` |
| `SQUARE_ACCESS_TOKEN` | Secret | Runtime | `~/pickmeup-docker/.env` |
| `RESEND_API_KEY` | Secret | Runtime | `~/pickmeup-docker/.env` (customer only) |
| `POSTHOG_PERSONAL_API_KEY` | Secret | Runtime | `~/pickmeup-docker/.env` |
| `POSTHOG_PROJECT_ID` | Secret | Runtime | `~/pickmeup-docker/.env` |
| `ANALYTICS_API_KEY` | Secret | Runtime | `~/pickmeup-docker/.env` |
| `RECAPTCHA_SECRET_KEY` | Secret | Runtime | `~/pickmeup-docker/.env` (customer only) |
| `CLIENT_APP_URL` | Internal | Runtime | Hardcoded in `docker-compose.yml` as `http://customer:3000` |

---

## Troubleshooting

### Container exits immediately on start

Check logs for errors:
```bash
docker-compose logs customer
docker-compose logs manager
```

Common cause: a missing required environment variable. Verify your `~/pickmeup-docker/.env` has all entries from the reference table above.

### Manager can't reach the analytics endpoint

The `CLIENT_APP_URL` must be `http://customer:3000` (the Docker service name), not `http://localhost:3001`. Confirm this in your `docker-compose.yml`.

Also check that the `ANALYTICS_API_KEY` value matches exactly between both apps — the Manager sends it as the `x-admin-api-key` header and the Customer validates it on the `/api/analytics` route.

### `square` package missing in customer app

The Customer app uses `serverExternalPackages: ["square"]` in `next.config.ts`, which tells Next.js not to bundle it. In standalone mode, Next.js should copy it into `.next/standalone/node_modules/`. If the customer container crashes with a module-not-found error for `square`, add this line to the runner stage of the Customer's Dockerfile:

```dockerfile
COPY --from=builder /app/node_modules/square ./node_modules/square
```

### Page loads but Supabase auth doesn't work

The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must have been provided as `--build-arg` during `docker build`. If they were missing at build time, they will be `undefined` in the browser bundle. Rebuild the image with the correct values.

### Port already in use

If port 3000 or 3001 is already occupied on your machine:
```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
```

Either stop the conflicting process or change the host-side port mapping in `docker-compose.yml` (e.g. `"3002:3000"`).

### Images are out of date

After making code changes, rebuild and re-push:
```bash
docker build ... -t <dockerhub-user>/pickmeup-customer:latest .
docker push <dockerhub-user>/pickmeup-customer:latest

# Then pull the new image in your compose directory
cd ~/pickmeup-docker
docker-compose pull
docker-compose up -d
```
