# Forgot Password - Changelog

**Date:** 2026-03-08
**Branch:** DEV-125
**Files Changed:**
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/forgot-password/actions.ts` _(new file)_
- `app/(auth)/login/page.tsx`

---

## Overview

The forgot password flow was updated with three core improvements:

1. Migrated the reset email call from a client-side Supabase call to a server action
2. Added server-side email existence validation using the Supabase Admin API
3. Added a "Back to Login" button shown after a successful reset link submission
4. Aligned the UI with the login page (white background, DaisyUI inputs, blue button)

---

## Detailed Changes

### `app/(auth)/forgot-password/actions.ts` — New File

A new server action file was created to handle the password reset logic securely on the server.

**`sendPasswordReset(email: string)`**

| Step | What it does |
|------|-------------|
| 1 | Creates a Supabase **Admin client** using `SUPABASE_SERVICE_ROLE_KEY` |
| 2 | Calls `admin.listUsers()` to fetch registered accounts |
| 3 | Checks if the submitted email matches any existing user (case-insensitive) |
| 4 | If no match → returns `{ error: 'No account found with that email address.' }` |
| 5 | If match → reads the request `host` header to build the `redirectTo` URL |
| 6 | Calls `supabase.auth.resetPasswordForEmail()` via the SSR server client |
| 7 | Returns `{}` on success or `{ error: '...' }` on failure |

**Why a server action?**
- `window.location.origin` is not available server-side; the origin is now derived from the `host` request header
- The service role key must never be used client-side; keeping this in a server action ensures it stays server-only
- Error handling is centralised and testable in one place

---

### `app/(auth)/forgot-password/page.tsx` — Updated

**State added:**
```ts
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
```

**`handleSubmit` rewritten:**
- Removed direct `supabase.auth.resetPasswordForEmail()` call
- Now calls `sendPasswordReset(email)` server action
- Sets `error` state if the action returns an error
- Sets `sent` to `true` only on success

**UI changes:**
- Red `bg-accent` background → white `bg-background`
- Input replaced with `input input-bordered` DaisyUI component
- Button colour changed from `bg-foreground` (dark) → `bg-blue-600`
- Error alert (`alert alert-error`) rendered above the input when `error` is set
- Button shows "Sending..." and is disabled while `loading` is `true`
- After a successful submission, a **"Back to Login"** `<Link>` button is shown below the confirmation alert
- `supabase` client import removed (no longer needed in the page component)

---

### `app/(auth)/login/page.tsx` — Updated (UI only)

| Before | After |
|--------|-------|
| Red `bg-accent` background | White `bg-background` |
| "Login" heading | "Welcome to Gladiator Burger" |
| Custom-bordered inputs | `input input-bordered` DaisyUI inputs |
| Dark `bg-foreground` button | `bg-blue-600` blue button |
| No password visibility toggle | Eye/eye-off toggle added (`showPassword` state) |
| No "New to Gladiator Burger?" footer | Footer with link to `/sign-up` added |

---

## Environment Variables Used

| Variable | Used in |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Admin client initialisation |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client initialisation (server-only) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | SSR server client (existing) |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser. It is only accessed inside the `'use server'` action.
