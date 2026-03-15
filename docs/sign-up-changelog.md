# Sign Up Page - Changelog

**Date:** 2026-03-08
**Branch:** DEV-129
**Files Changed:**
- `app/(auth)/sign-up/page.tsx`
- `components/PasswordRequirements.tsx` _(new file)_

---

## Overview

The sign-up page received a full UI overhaul to match the design language of the login and reset-password pages, plus a new live password requirements tracker component.

1. Replaced custom input styling with DaisyUI `input input-bordered` components
2. Replaced the custom red error div with a DaisyUI `alert alert-error`
3. Updated the page background, form layout, button, and footer link to match the login page
4. Added show/hide password toggles to both password fields
5. Created a new `PasswordRequirements` component that tracks password rules in real time

---

## Detailed Changes

### `app/(auth)/sign-up/page.tsx` — Updated

#### Layout & Background

| Before | After |
|--------|-------|
| `bg-accent` (dark red) background | No background class (inherits white from layout) |
| `gap-8` between elements | `gap-6` between elements |
| No horizontal padding | `px-4` added for mobile safety |
| `font-semibold` heading | `font-black` heading matching login style |
| `text-white` heading colour | `text-gray-700` heading colour |

#### Input Components

| Before | After |
|--------|-------|
| `input validator` with custom `border-2 border-gray-50 shadow-xs rounded-lg p-3 w-md` | `input input-bordered` DaisyUI standard component |
| Fixed `w-md` width | `w-full` with `max-w-sm` on the form |
| `py-4` on inner `<input>` | `grow` on inner `<input>` (fills available space) |
| `h-[1em]` icon size | `h-4 w-4 shrink-0` icon size (matches login) |

#### Error Alert

| Before | After |
|--------|-------|
| Custom `bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded` div | DaisyUI `alert alert-error font-heading text-sm` |

#### Submit Button

| Before | After |
|--------|-------|
| `bg-foreground` (dark) with nested `<p>` tag | `bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white` |
| `mt-2 mb-6` spacing | No extra margin (handled by form `gap-4`) |
| `hover:shadow-xl` | `transition-colors` |

#### Footer Link

| Before | After |
|--------|-------|
| `text-background` (white) paragraph text | `text-grey-700` paragraph text |
| `underline hover:text-gray-200` link | `text-blue-500 hover:text-blue-700` link |

#### Password Show/Hide Toggle

Two new state variables were added:

```ts
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

Both the **Password** and **Confirm Password** inputs now have an eye icon button inside the input box. Clicking it toggles between `type="password"` (hidden) and `type="text"` (visible), identical to the pattern used in `login/page.tsx`.

#### Password State (required for PasswordRequirements)

A new controlled state variable was added for the password field:

```ts
const [password, setPassword] = useState("");
```

The password `<input>` now has `value={password}` and `onChange={(e) => setPassword(e.target.value)}` so the `PasswordRequirements` component always receives the latest value.

#### Static Hint Text Removed

The static `<p>Must be 8+ characters with uppercase and number</p>` line was removed and replaced by the live `<PasswordRequirements>` component.

---

### `components/PasswordRequirements.tsx` — New File

A new reusable component that accepts the current password string and displays a live checklist of the three rules enforced by `sign-up/actions.ts`.

**Rules tracked:**

| Rule | How it's checked |
|------|-----------------|
| At least 8 characters | `password.length >= 8` |
| One uppercase letter | `/[A-Z]/.test(password)` |
| One number | `/[0-9]/.test(password)` |

**Behaviour:**
- Renders nothing (`return null`) when the password field is empty
- Each rule shows a green `badge-success` with a checkmark when met
- Each rule shows a red `badge-error` with an X when not met
- Label text is always `text-gray-800` for consistent visibility

**Placed** directly below the Password input and above the Confirm Password input in the sign-up form.
