# Docker Containerization — Session Notes

A running log of everything covered during the containerization session for PickMeUp and PickMeUp-Manager.

---

## Goal

Containerize both apps using Docker and DockerHub so that any team member (including Intel/AMD users) can spin up the full testing environment with a single command.

---

## Apps Involved

| App | Repo Path | Host Port |
|-----|-----------|-----------|
| PickMeUp (customer) | `Fall-2025/CPSY-301/Phase3/PickMeUp` | 3001 |
| PickMeUp-Manager (staff) | `Winter-2026/Capstone/PickMeUp-Staff/PickMeUp-Manager` | 3000 |

---

## Files Created / Modified

### PickMeUp (Customer App)

| File | Action | Notes |
|------|--------|-------|
| `next.config.ts` | Modified | Added `output: 'standalone'` |
| `.dockerignore` | Created | Excludes `node_modules`, `.next`, `.env*`, etc. |
| `Dockerfile` | Created | 3-stage build: deps → builder → runner |
| `app/api/comments/route.ts` | Modified | Moved `createClient` inside handler (see bug fix below) |
| `app/api/orders/[orderId]/route.ts` | Modified | Moved `createClient` inside handler |
| `app/api/payments/route.ts` | Modified | Moved `createClient` inside handler |
| `app/api/orders/receipt/[receiptToken]/route.ts` | Modified | Moved `createClient` inside handler |

### PickMeUp-Manager (Staff App)
*(Instructions provided via [pickmeup-manager-containerization-instructions.md](pickmeup-manager-containerization-instructions.md) to share with that repo's agent)*

| File | Action | Notes |
|------|--------|-------|
| `next.config.ts` | Modify | Add `output: 'standalone'` |
| `.dockerignore` | Create | Same pattern as customer app |
| `Dockerfile` | Create | Same 3-stage pattern, different `NEXT_PUBLIC_*` args |

### Shared Docker Directory (`~/pickmeup-docker/`)

| File | Action | Notes |
|------|--------|-------|
| `docker-compose.yml` | Created | Orchestrates both containers |
| `.env` | Created | Runtime secrets — fill in from `.env.local` files |

---

## Key Concepts Learned

### Build-time vs Runtime Variables

Next.js has two categories of environment variables in Docker:

**Build-time (`NEXT_PUBLIC_*`)**
- Baked into the browser JavaScript bundle during `next build`
- Cannot be changed after the image is built
- Must be passed as `--build-arg` during `docker build`
- If they change, you must rebuild and re-push the image

**Runtime (secrets)**
- Read by server-side code only when a request comes in
- Injected by docker-compose at container start via the `.env` file
- Never baked into the image — safe to rotate without rebuilding

### Why `output: 'standalone'`

Adding `output: 'standalone'` to `next.config.ts` tells Next.js to produce a self-contained build in `.next/standalone/`. This:
- Shrinks the Docker image from ~500 MB to ~150 MB
- Removes the need to copy `node_modules` into the final image
- Enables the `CMD ["node", "server.js"]` pattern in the Dockerfile

### Why `HOSTNAME=0.0.0.0`

Next.js standalone defaults to binding on `127.0.0.1` (localhost). Inside a container, this means the port is only reachable from within that container — not from the host machine or other containers. Setting `HOSTNAME=0.0.0.0` binds to all interfaces.

### Docker Internal DNS (`CLIENT_APP_URL`)

Inside the `manager` container, `localhost` refers to the manager container itself — not the host machine. Docker Compose assigns each service a DNS name matching its key in the compose file. The Manager calls the Customer app's `/api/analytics` endpoint, so `CLIENT_APP_URL` is set to `http://customer:3000` (the service name), not `http://localhost:3001`.

### Apple Silicon / Cross-Platform Builds

Building on an M4 Mac produces ARM64 images by default. Intel/AMD machines cannot run ARM64 images. Adding `--platform linux/amd64` to `docker build` cross-compiles for Intel/AMD — the build takes longer but the image runs on any machine.

---

## Bug Fix — `supabaseKey is required` During Build

### What happened

`docker build` failed during the `next build` step with:
```
Error: supabaseKey is required.
Error: Failed to collect page data for /api/comments
Error: Failed to collect page data for /api/orders/[orderId]
```

### Root cause

4 API route files had the Supabase admin client created at **module level** — outside any function, at the top of the file:

```ts
// ❌ Runs the moment Next.js imports this file during build
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // undefined at build time
);
```

During `next build`, Next.js imports every route file to analyze them. At that moment `SUPABASE_SERVICE_ROLE_KEY` doesn't exist — it's a runtime secret only available when the container is running. Calling `createClient(url, undefined)` throws immediately.

### Fix

Moved `createClient` inside the handler function so it only runs when an actual HTTP request arrives at runtime:

```ts
// ✅ Only runs when the route is actually called
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // available at runtime
  );
  ...
}
```

**Files fixed:**
- `app/api/comments/route.ts`
- `app/api/orders/[orderId]/route.ts`
- `app/api/payments/route.ts`
- `app/api/orders/receipt/[receiptToken]/route.ts`

---

## Build & Push Commands

### Customer App

```bash
cd /Users/datdo/Desktop/Fall-2025/CPSY-301/Phase3/PickMeUp

docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://teluwmhtaiysxcpdxjwg.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_JhZBSJ83xIUe5KkqzDLUvw_PLy0WVQ9" \
  --build-arg NEXT_PUBLIC_SQUARE_APP_ID="sandbox-sq0idb-xgO4HPQe6BfTVXx_xgwbEA" \
  --build-arg NEXT_PUBLIC_SQUARE_LOCATION_ID="sq0idp-0h6m0obMcnvieKDFM2j6og" \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="phc_VkxZHiIlofKgSSAt1J2qV4x2iYaqgwuA2GRvII6VEiL" \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LegN4QsAAAAALRyJAstgcQWU_iaVJAndWkLpsBA" \
  -t tayuun/pickmeup-customer:latest \
  .

docker push tayuun/pickmeup-customer:latest
```

### Manager App

```bash
cd /Users/datdo/Desktop/Winter-2026/Capstone/PickMeUp-Staff/PickMeUp-Manager

docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://teluwmhtaiysxcpdxjwg.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_JhZBSJ83xIUe5KkqzDLUvw_PLy0WVQ9" \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="phc_VkxZHiIlofKgSSAt1J2qV4x2iYaqgwuA2GRvII6VEiL" \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -t tayuun/pickmeup-manager:latest \
  .

docker push tayuun/pickmeup-manager:latest
```

---

## Spin Up the Testing Environment

```bash
cd ~/pickmeup-docker

# Fill in ~/pickmeup-docker/.env with secrets from .env.local first, then:
docker-compose up -d

# Verify
docker-compose ps
```

- Customer app: http://localhost:3001
- Manager app: http://localhost:3000

---

## Development Workflow Going Forward

Containerization does not affect local development. The two workflows are completely independent:

| Task | Command | Where |
|------|---------|-------|
| Day-to-day development | `npm run dev` | Inside each repo, as normal |
| Publish a testable snapshot | `docker build` + `docker push` | When ready to share |
| Run the testing environment | `docker-compose up -d` | From `~/pickmeup-docker/` |

---

## Reference Docs Created This Session

| Document | Purpose |
|----------|---------|
| [docker-containerization-guide.md](docker-containerization-guide.md) | Full step-by-step guide for both apps |
| [pickmeup-manager-containerization-instructions.md](pickmeup-manager-containerization-instructions.md) | Instructions to share with the Manager repo's agent |
| [docker-session-notes.md](docker-session-notes.md) | This file — session summary |
