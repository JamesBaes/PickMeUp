# Reset Password Page — Changes & How It Works

**File:** `app/(auth)/reset-password/page.tsx`

---

## What Changed

The reset-password page was fully redesigned to match the visual style and UX patterns used across the app's auth and account pages (`login/page.tsx` and `account/page.tsx`).

### 1. Overall Layout
Matches `login/page.tsx`:
- `bg-background` page background (was `bg-accent`)
- Centered column layout with `pt-16` top padding
- App logo (`gladiator-logo-circle.png`) displayed at the top
- Large bold heading using `font-heading`
- Form capped at `max-w-sm` width

### 2. Input Fields
Each password field now uses the DaisyUI `input input-bordered` pattern with:
- A key icon (SVG) on the left
- The text input in the middle (`grow font-heading`)
- A **show/hide password toggle button** on the right (eye/eye-off SVG icons)

The toggle switches the input `type` between `"password"` and `"text"` using local state (`showNewPassword`, `showConfirmPassword`).

### 3. Password Requirements Checklist
Adopted from `account/page.tsx`. Appears below the **New Password** field as soon as the user starts typing. Each requirement turns green (✓) when met, or stays dim (✗) when not:

| Requirement | Regex / Check |
|---|---|
| At least 8 characters | `newPassword.length >= 8` |
| At least one uppercase letter | `/[A-Z]/.test(newPassword)` |
| At least one number | `/[0-9]/.test(newPassword)` |

### 4. Confirm Password Mismatch Feedback
A small inline error message (`font-body text-xs text-error`) appears below the Confirm Password field in real time when the two passwords don't match.

### 5. Submit Button State & Cursor
The button is disabled (`disabled` HTML attribute) until **all** of the following are true:
- Password meets all three requirements
- Both fields are non-empty
- Both passwords match
- No request is currently in flight (`!isLoading`)

```ts
const canSubmit =
  passwordMeetsRequirements &&
  passwordsMatch &&
  !!newPassword &&
  !!confirmPassword &&
  !isLoading;
```

Cursor behaviour:
- `cursor-pointer` — shown when the button is enabled
- `disabled:cursor-not-allowed` — shown on hover when the button is disabled

### 6. Success & Error Alerts
Uses DaisyUI alert components consistent with the rest of the app:
- `alert alert-success` — shown after the password is updated successfully
- `alert alert-error` — shown when validation or Supabase returns an error

### 7. Session Guard
On mount, the component checks whether a valid Supabase session exists (the session is created when the user clicks the reset link from their email). If no session is found, the user is immediately redirected to `/forgot-password` to prevent accessing the page directly.

```ts
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/forgot-password');
    } else {
      setIsValidSession(true);
    }
  };
  checkSession();
}, [router]);
```

While the session is being verified, a "Verifying session..." loading state is shown instead of the form.

---

## How the Full Flow Works

```
User requests reset email
        ↓
Supabase sends a magic link to the user's email
        ↓
User clicks the link → Supabase exchanges the token and creates a session
        ↓
User lands on /reset-password
        ↓
useEffect checks for a valid session → redirects to /forgot-password if none found
        ↓
User fills in new password (checklist guides requirements in real time)
        ↓
User clicks "Reset Password" (only enabled when all requirements are met)
        ↓
supabase.auth.updateUser({ password }) is called
        ↓
On success → supabase.auth.signOut() is called (user is NOT left logged in)
        ↓
Success alert shown → user redirected to /login after 2 seconds
```

---

## State Variables

| Variable | Type | Purpose |
|---|---|---|
| `newPassword` | `string` | Controlled value for the new password input |
| `confirmPassword` | `string` | Controlled value for the confirm password input |
| `showNewPassword` | `boolean` | Toggles visibility of the new password field |
| `showConfirmPassword` | `boolean` | Toggles visibility of the confirm password field |
| `showSuccess` | `boolean` | Controls display of the success alert |
| `error` | `string \| null` | Holds any error message to display |
| `isLoading` | `boolean` | True while the Supabase update request is in flight |
| `isValidSession` | `boolean` | True after session check passes; gates form rendering |
