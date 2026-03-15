# Forgot Password - How It Works (Plain English)

**Date:** 2026-03-08

---

## What changed and why?

We made three improvements to the "Forgot Password" page:

1. **The page now checks if your email actually exists before sending anything**
2. **After the email is sent, a "Back to Login" button appears**
3. **The page looks the same as the login page** (white background, same input style, same blue button)

---

## Feature 1 — Email Existence Check

### The old behaviour
Before, if you typed any email address (even one that was never registered), the app would silently try to send a reset email. Supabase wouldn't actually send anything to unknown addresses, but the app had no way to tell you that — it just showed the success message regardless.

### The new behaviour
Now, before sending the email, the app checks our Supabase database to see if that email address belongs to a real account.

- **If the email exists** → the reset email is sent and the confirmation message is shown.
- **If the email does not exist** → the same confirmation message is shown, but no email is sent.

This means users (and attackers) always see the same response regardless of whether the email is registered, which prevents anyone from using this form to figure out which email addresses have accounts.

### How does it check?
A behind-the-scenes server function (called a **server action**) runs the check. It uses a special admin key that has permission to look up all registered users. This key is kept secret on the server — it is never sent to the browser.

---

## Feature 2 — Back to Login Button

After you successfully submit a valid email and the reset link is sent, a blue **"Back to Login"** button appears below the confirmation message. Clicking it takes you straight back to `/login` so you don't have to navigate manually.

---

## Feature 3 — UI Consistency

The page was restyled to match the login page exactly:

| Element | Before | After |
|---------|--------|-------|
| Background | Red | White |
| Input field | Custom border styling | DaisyUI standard input |
| Submit button | Dark/black | Blue (same as login) |
| Error messages | Not shown to the user | Shown in a red alert box |
| Loading state | Button always said "Send..." | Button says "Sending..." and is disabled while waiting |

---

## How the full flow works (step by step)

```
User types their email → clicks "Send Password Reset Link"
        ↓
App sends the email to a server function (server action)
        ↓
Server function checks: does this email exist in our database?
        ↓
    NO → Returns error message → Page shows red alert
        ↓
    YES → Sends reset email via Supabase
        ↓
Page shows: "If this email exists we will send you an email to reset your password"
+ "Back to Login" button appears
        ↓
User clicks the link in their email → taken to Reset Password page
        ↓
User sets a new password → redirected to Login
```

---

## Security notes

- The admin key used to look up users is **only accessible on the server**. Regular users cannot see or use it.
- The same success message is shown whether or not the email exists. This is intentional — it prevents **email enumeration**, where an attacker submits many different addresses to find out which ones have accounts.
