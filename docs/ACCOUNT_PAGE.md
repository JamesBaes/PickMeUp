# Account Settings Page

**File:** `app/(protected)/account/page.tsx`

---

## Overview

The Account Settings page is a protected client-side page accessible only to authenticated users. It provides two profile management features:

1. **Change Password** — update the currently logged-in user's password
2. **Change Location** — update the user's preferred restaurant location

The page is rendered inside the shared `(protected)` layout, which provides the sidebar navigation (Favourites, Order History, Account Settings, Log Out).

---

## Imports & Dependencies

| Import                           | Source                      | Purpose                                     |
| -------------------------------- | --------------------------- | ------------------------------------------- |
| `React`, `useEffect`, `useState` | `react`                     | Component state and lifecycle               |
| `supabase`                       | `@/utils/supabase/client`   | Auth operations (getUser, updateUser)       |
| `useLocation`                    | `@/context/locationContext` | Access and update the global location state |

---

## State

| State variable       | Type             | Initial value | Purpose                                                                |
| -------------------- | ---------------- | ------------- | ---------------------------------------------------------------------- |
| `email`              | `string`         | `''`          | Holds the authenticated user's email address                           |
| `newPassword`        | `string`         | `''`          | Controlled input for the new password field                            |
| `confirmPassword`    | `string`         | `''`          | Controlled input for the confirm password field                        |
| `passwordError`      | `string \| null` | `null`        | Displays client-side or server-side password errors                    |
| `passwordSuccess`    | `boolean`        | `false`       | Shows a success alert after a successful password update               |
| `isLoading`          | `boolean`        | `false`       | Disables the submit button while the Supabase request is in flight     |
| `showLocationSelect` | `boolean`        | `false`       | Toggles between the "Change Location" button and the location dropdown |

### Derived state

```ts
const passwordsMatch = newPassword === confirmPassword;
```

Used to disable the submit button and show an inline mismatch warning before the form is submitted.

---

## Effects

### Fetch authenticated user's email

```ts
useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) setEmail(user.email);
  };
  fetchUser();
}, []);
```

Runs once on mount. Calls `supabase.auth.getUser()` to retrieve the currently authenticated user and populates the read-only email display.

---

## Handlers

### `handleChangePassword`

Triggered by the password form's `onSubmit` event.

**Client-side validation (in order):**

1. Passwords must match
2. Minimum 8 characters
3. Must contain at least one uppercase letter (`/[A-Z]/`)
4. Must contain at least one number (`/[0-9]/`)

If all validations pass, calls `supabase.auth.updateUser({ password: newPassword })`.

**On success:**

- Sets `passwordSuccess` to `true` (shows a green success alert)
- Clears both password input fields
- Does **not** sign the user out or redirect (unlike `reset-password/page.tsx`)

**On error:**

- Sets `passwordError` to the error message returned by Supabase (shows a red error alert)

**Key difference from `app/(auth)/reset-password/page.tsx`:**
The reset password page signs the user out and redirects to `/login` after a successful update. The account settings page stays on the same page and shows an inline success message, since the user is already authenticated.

---

### `handleLocationChange`

Triggered by the `<select>` element's `onChange` event.

```ts
const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedId = e.target.value;
  const selectedLocation = locations.find((loc) => loc.id === selectedId);
  if (selectedLocation) {
    setCurrentLocation(selectedLocation);
    setShowLocationSelect(false);
  }
};
```

- Looks up the full location object by `id` from the `locations` array provided by `useLocation`
- Calls `setCurrentLocation` (which also persists the selection to `localStorage` via the context)
- Hides the dropdown by setting `showLocationSelect` back to `false`

**Key difference from `app/select-location/page.tsx`:**
The standalone select-location page calls `router.push("/")` after selecting a location. The account settings page does not redirect — it simply collapses the dropdown and shows the updated location name inline.

---

## UI Sections

### Email Display

- Read-only — the email is fetched from Supabase and displayed as plain text
- Shows `"Loading..."` until the `useEffect` resolves

### Change Password Form

- Two password inputs: **New Password** and **Confirm Password**
- Both use a lock icon SVG for visual consistency with the rest of the auth pages
- Inline mismatch warning appears below the confirm field if the values differ (only when the confirm field has a value)
- A hint line reads: _"Must be 8+ characters with uppercase and number"_
- The submit button is disabled when:
  - Either field is empty
  - Passwords do not match
  - A request is currently in flight (`isLoading`)
- Success and error alerts use DaisyUI `alert alert-success` / `alert alert-error` classes

### Change Location

- Displays the current location name (or `"Not set"` if none is saved)
- Shows `"Loading..."` while the locations are being fetched from Supabase
- A **"Change Location"** button toggles `showLocationSelect` to `true`
- When toggled on, the button is replaced by a `<select>` dropdown populated from `useLocation().locations`
- Selecting a value immediately updates the context and hides the dropdown (no separate "Save" step)

---

## Source Pages Referenced

| Feature                                                 | Adapted from                         |
| ------------------------------------------------------- | ------------------------------------ |
| Password inputs, validation logic, error/success alerts | `app/(auth)/reset-password/page.tsx` |
| Location dropdown, `useLocation` hook usage             | `app/select-location/page.tsx`       |
| Layout (sidebar, main content wrapper)                  | `app/(protected)/layout.tsx`         |
