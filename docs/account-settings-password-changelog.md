# Account Settings — Password Field Changelog

**Date:** 2026-03-14
**Branch:** DEV-148-2
**Files Changed:**
- `app/(protected)/account/page.tsx`

---

## Overview

The Change Password section on the Account Settings page was updated to match the UX conventions already present in the reset password flow. Two features were added to both password fields:

1. **Show/hide password toggle** — an eye icon button lets users reveal or hide what they are typing
2. **Live password requirements checklist** — a checklist appears below the New Password field as the user types, showing in real time which requirements have been satisfied

---

## Detailed Changes

### `app/(protected)/account/page.tsx`

#### State added

```ts
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

#### New Password field

| Before | After |
|--------|-------|
| `type="password"` always | `type` toggled between `"password"` and `"text"` via `showNewPassword` |
| No toggle button | Eye / eye-off SVG button appended inside the input label |
| Static hint text below the confirm field | Live checklist below the new password field |

The toggle button uses `tabIndex={-1}` so it does not interrupt keyboard tab flow through the form.

#### Confirm Password field

| Before | After |
|--------|-------|
| `type="password"` always | `type` toggled between `"password"` and `"text"` via `showConfirmPassword` |
| No toggle button | Eye / eye-off SVG button appended inside the input label |

#### Live requirements checklist

Displayed only when `newPassword` is non-empty. Each item turns green (`text-success`) when its rule is satisfied, and stays muted (`text-base-content/40`) otherwise.

| Rule | Check |
|------|-------|
| At least 8 characters | `newPassword.length >= 8` |
| At least one uppercase letter | `/[A-Z]/.test(newPassword)` |
| At least one number | `/[0-9]/.test(newPassword)` |

These rules mirror the existing server-side validation already in `handleChangePassword`, so the checklist always reflects what the form will actually enforce on submit.

#### Removed

- The static `"Must be 8+ characters with uppercase and number"` hint text was removed, as it is now replaced by the live checklist.
