# Change Password Button — Disabled State & Cursor Behavior

**File:** `app/(protected)/account/page.tsx`

## Overview

The "Change Password" button uses a derived boolean `canSubmit` to control both its `disabled` attribute and its cursor style. The button is visually and functionally locked until all password requirements are met.

## `canSubmit` Logic

```ts
const passwordsMatch = newPassword === confirmPassword;

const passwordMeetsRequirements =
  newPassword.length >= 8 &&
  /[A-Z]/.test(newPassword) &&
  /[0-9]/.test(newPassword);

const canSubmit =
  passwordMeetsRequirements &&
  passwordsMatch &&
  !!newPassword &&
  !!confirmPassword &&
  !isLoading;
```

`canSubmit` is `true` only when **all** of the following conditions are satisfied:

| Condition | Description |
|---|---|
| `passwordMeetsRequirements` | Password is 8+ chars, has an uppercase letter, and has a number |
| `passwordsMatch` | New password and confirm password fields are identical |
| `!!newPassword` | New password field is not empty |
| `!!confirmPassword` | Confirm password field is not empty |
| `!isLoading` | No submission is currently in progress |

## Button JSX

```tsx
<button
  type="submit"
  disabled={!canSubmit}
  className={`... disabled:opacity-50 ${canSubmit ? "cursor-pointer" : "cursor-not-allowed"}`}
>
  {isLoading ? "Updating..." : "Change Password"}
</button>
```

## State Transitions

```
Fields empty / requirements not met
        │
        ▼
  disabled={true}
  cursor-not-allowed   ◄─── user sees 🚫 cursor, button faded (opacity-50)
        │
        │  user types valid password + matching confirm
        ▼
  disabled={false}
  cursor-pointer       ◄─── user sees 👆 cursor, button fully opaque
        │
        │  user clicks → isLoading = true
        ▼
  disabled={true}
  cursor-not-allowed   ◄─── prevents double-submit during API call
        │
        │  API resolves
        ▼
  fields cleared → back to initial disabled state
```

## Why `cursor-not-allowed` Instead of Relying on `disabled` Alone

Browsers apply `cursor: default` on disabled buttons, not `cursor: not-allowed`. The explicit Tailwind class `cursor-not-allowed` ensures the user gets a clear visual signal that the button is intentionally blocked, rather than just appearing inert.
