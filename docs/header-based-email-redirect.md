# Header-Based Email Redirect URLs

## The Problem

When Supabase sends a confirmation or reset email, it needs to know what URL to put in the link so the user lands back on your app. A naive approach is to hardcode this URL using an environment variable:

```ts
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
```

This breaks if `NEXT_PUBLIC_SITE_URL` is not defined in `.env.local` — the URL becomes `undefined/auth/callback`, which is invalid. It also requires manually keeping the environment variable in sync across every deployment environment (local, staging, production).

## The Solution: Reading from Request Headers

Instead of relying on an environment variable, we read the origin directly from the incoming HTTP request headers at the time the action runs.

```ts
import { headers } from "next/headers";

const headersList = await headers();
const host = headersList.get('host') ?? '';
const protocol = host.startsWith('localhost') ? 'http' : 'https';
const origin = `${protocol}://${host}`;
```

This is used in both `app/(auth)/sign-up/actions.ts` and `app/(auth)/forgot-password/actions.ts`.

## How It Works Step by Step

### 1. `headers()` — Read the incoming request

`headers()` is a Next.js server function that gives you access to the HTTP request headers sent by the browser. Every HTTP request includes a `Host` header that tells the server what domain/port the request was sent to.

Examples of what `host` looks like:
| Environment | `host` value |
|---|---|
| Local dev | `localhost:3000` |
| Production | `pickmeup.vercel.app` |
| Custom domain | `www.pickmeup.com` |

### 2. Determine the protocol

```ts
const protocol = host.startsWith('localhost') ? 'http' : 'https';
```

Local development uses `http://` since there is no SSL certificate. Any real domain uses `https://`. This check lets the same code work correctly in both environments without any configuration.

### 3. Build the origin

```ts
const origin = `${protocol}://${host}`;
// e.g. "http://localhost:3000" or "https://pickmeup.vercel.app"
```

### 4. Pass it to Supabase

```ts
emailRedirectTo: `${origin}/auth/callback`
// e.g. "http://localhost:3000/auth/callback"
```

Supabase embeds this URL into the confirmation email. When the user clicks the link, they land on your `/auth/callback` route, which exchanges the token for a session and redirects them into the app.

## Why This Is Better Than an Environment Variable

| | Environment Variable | Header-Based |
|---|---|---|
| Works without `.env.local` set up | No | Yes |
| Automatically correct per environment | No | Yes |
| Works on preview deployments (dynamic URLs) | No | Yes |
| Requires manual configuration | Yes | No |

## Files Using This Pattern

- [app/(auth)/sign-up/actions.ts](../app/(auth)/sign-up/actions.ts) — email confirmation link on sign-up
- [app/(auth)/forgot-password/actions.ts](../app/(auth)/forgot-password/actions.ts) — password reset link
