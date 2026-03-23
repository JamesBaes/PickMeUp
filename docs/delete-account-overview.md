# Delete Account — Overview & Changelog

**Files:**
- `app/(protected)/account/actions.ts` — server action
- `app/(protected)/account/page.tsx` — UI (button + confirmation modal)

---

## Overview

The delete account feature allows authenticated users to permanently remove their account from PickMeUp. Once confirmed, the user's auth record is deleted from Supabase, which cascades and removes all linked data across every table in the database automatically.

---

## How It Works

### 1. User Triggers Deletion (UI)

In `app/(protected)/account/page.tsx`, a **Delete Account** button is rendered in the account settings page. Clicking it opens a confirmation modal/dialog asking the user to confirm they want to permanently delete their account. This prevents accidental deletions.

### 2. Server Action — `deleteAccount()`

Located in `app/(protected)/account/actions.ts`, this is a Next.js server action marked with `'use server'`.

**Step-by-step flow:**

```
User confirms deletion
        │
        ▼
deleteAccount() is called
        │
        ▼
Create server-side Supabase client
Call supabase.auth.getUser() to verify the session
        │
        ├── No user found → return { error: 'Not authenticated' }
        │
        ▼
Create admin Supabase client using SUPABASE_SERVICE_ROLE_KEY
(required — regular anon client cannot delete auth users)
        │
        ▼
adminClient.auth.admin.deleteUser(user.id)
        │
        ├── Error → return { error: 'Failed to delete account. Please contact support.' }
        │
        ▼
Supabase CASCADE deletes all linked rows in other tables
        │
        ▼
supabase.auth.signOut() — clears the session
        │
        ▼
redirect('/') — user is sent back to the home page
```

### 3. Database Cascade

The Supabase database is configured with `ON DELETE CASCADE` from the `auth.users` table to all related tables. This means when the auth user record is deleted, Supabase automatically removes all associated rows (e.g. orders, favorites, cart items, profiles) without any manual cleanup needed in the server action.

---

## Changelog

### Initial Implementation

- Added `deleteAccount()` server action in `app/(protected)/account/actions.ts`
- Added Delete Account button and confirmation modal in `app/(protected)/account/page.tsx`
- Original implementation manually deleted rows from `orders`, `favorites`, `cart_items`, and `profiles` tables before deleting the auth user

### Revised Implementation (Bug Fix)

**Problem:** Users were seeing the error `"Failed to remove your data. Please try again."` when attempting to delete their account.

**Root Cause:** The original action manually deleted rows from each table before deleting the auth user. Any mismatch — such as a wrong column name, a table that didn't exist, or a Row Level Security (RLS) policy blocking the admin client — would return an error and abort the deletion before the auth user was ever removed.

**Fix:** Removed all manual table deletions. The action now only calls `adminClient.auth.admin.deleteUser(user.id)` and relies entirely on the database's cascade configuration to clean up all linked data.

**Before:**
```ts
// Manually delete from each table (fragile — any error aborts)
await adminClient.from('orders').update({ customer_email: null, ... }).eq(...)
await adminClient.from('favorites').delete().eq('customer_id', userId)
await adminClient.from('cart_items').delete().eq('user_id', userId)
await adminClient.from('profiles').delete().eq('id', userId)
await adminClient.auth.admin.deleteUser(userId)
```

**After:**
```ts
// Let the database cascade handle everything
const { error } = await adminClient.auth.admin.deleteUser(user.id)
if (error) return { error: 'Failed to delete account. Please contact support.' }
```

---

## Environment Variable Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key required to delete auth users — must NOT be the anon key |

> The service role key bypasses RLS and has full admin access. It must only be used in server-side code and never exposed to the client.
