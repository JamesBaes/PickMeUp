# reCAPTCHA v3 - How It Works (Beginner's Guide)

**Date:** 2026-03-08
**Files Changed:**
- `app/(auth)/sign-up/page.tsx`
- `app/(auth)/sign-up/actions.ts`
- `.env.local`

---

## What is reCAPTCHA and why did we add it?

reCAPTCHA is a free security service made by Google. Its job is to tell the difference between a real human visiting your website and a **bot** (an automated program written to abuse your site).

Without it, a bot could:
- Create thousands of fake accounts in seconds
- Flood your sign-up form with spam traffic
- Try to brute-force passwords at scale

We added **reCAPTCHA v3** specifically — the invisible version. Unlike the classic "I'm not a robot" checkbox (v2), v3 works silently in the background. The user never has to click or solve a puzzle. Instead, Google watches how the user interacts with the page (mouse movements, typing speed, navigation) and gives them a **score from 0.0 to 1.0**:

| Score | Meaning |
|-------|---------|
| 1.0 | Almost certainly a real human |
| 0.5 | Uncertain |
| 0.0 | Almost certainly a bot |

We reject any submission with a score below **0.5**.

---

## The two parts of reCAPTCHA

reCAPTCHA always has two sides working together:

| Side | Where it runs | What it does |
|------|--------------|-------------|
| **Client (browser)** | `page.tsx` | Loads Google's script, silently analyses the user, produces a one-time token |
| **Server** | `actions.ts` | Sends that token to Google's API to get the score, then decides whether to allow the sign-up |

The token is the key piece — it is a short-lived code that proves "Google assessed this specific submission." The server **must** verify it because a bot could fake a form submission without ever loading the page.

---

## Environment variables

Before touching code, we added two secret keys to `.env.local`:

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

These come from registering the app on [google.com/recaptcha](https://www.google.com/recaptcha/admin/create).

**Why two keys?**

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — this is the **public** key. The `NEXT_PUBLIC_` prefix means Next.js will include it in the browser bundle so the reCAPTCHA script can load. It is safe to expose.
- `RECAPTCHA_SECRET_KEY` — this is the **private** key used only on the server to verify tokens with Google. It never leaves the server. If a bot got hold of this, they could fake verifications, so it must stay secret.

---

## What changed in `page.tsx`

### 1. The provider wrapper

```tsx
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const SignUp = () => (
  <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
    <SignUpForm />
  </GoogleReCaptchaProvider>
);
```

`GoogleReCaptchaProvider` is a **context provider** — think of it as a container that loads Google's reCAPTCHA script once and makes it available to every component inside it.

The `!` at the end of `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!` is TypeScript's **non-null assertion** — it tells TypeScript "I promise this value will exist at runtime, don't warn me that it might be undefined." Without it, TypeScript would complain because environment variables are technically `string | undefined`.

Because `GoogleReCaptchaProvider` needs to wrap the form component, we split the page into two components:
- `SignUpForm` — the actual form with all the logic (needs access to reCAPTCHA)
- `SignUp` — a thin wrapper that provides the reCAPTCHA context and renders `SignUpForm` inside it

`SignUp` is the default export, so Next.js renders it as the page.

---

### 2. The hook

```tsx
const { executeRecaptcha } = useGoogleReCaptcha();
```

A **hook** is a special React function that lets a component access shared functionality — in this case, the reCAPTCHA context provided by `GoogleReCaptchaProvider` above it.

`executeRecaptcha` is a function we get back from the hook. Calling it runs Google's invisible analysis and returns a **token** (a long string of characters). We call it at the moment the user submits the form, not before, so that the analysis reflects what the user just did.

---

### 3. The submit handler

```tsx
const handleSignUp = useCallback(async (formData: FormData) => {
  if (!executeRecaptcha) {
    setError("reCAPTCHA is not ready yet. Please try again.");
    return;
  }

  const token = await executeRecaptcha("sign_up");
  if (!token) {
    setError("reCAPTCHA verification failed. Please try again.");
    return;
  }

  setLoading(true);
  setError(null);

  formData.append("recaptchaToken", token);
  const result = await signUp(formData);
  ...
}, [executeRecaptcha]);
```

Breaking this down step by step:

**`useCallback`** — this wraps the function so React doesn't recreate it on every render. It only recreates it when `executeRecaptcha` changes (listed in the `[executeRecaptcha]` dependency array at the end). This is required here because `executeRecaptcha` comes from a hook and React needs to track when it changes.

**`if (!executeRecaptcha)`** — guards against the rare case where the reCAPTCHA script hasn't finished loading yet. The `!` means "if this value is falsy (null, undefined, false, empty)".

**`await executeRecaptcha("sign_up")`** — calls reCAPTCHA with an **action name**. The string `"sign_up"` is just a label so you can see which action triggered each score in the Google reCAPTCHA dashboard. `await` pauses until Google finishes the analysis and returns the token.

**`formData.append("recaptchaToken", token)`** — adds the token to the form data envelope so it travels to the server alongside the email and password. The server will use it to verify with Google.

---

## What changed in `actions.ts`

```ts
const recaptchaToken = formData.get("recaptchaToken") as string;

if (!recaptchaToken) {
  return { error: "reCAPTCHA verification required." };
}

const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
});

const verifyData = await verifyResponse.json();
if (!verifyData.success || verifyData.score < 0.5) {
  return { error: "reCAPTCHA verification failed. Please try again." };
}
```

**`formData.get("recaptchaToken") as string`** — pulls the token out of the form data envelope. The `as string` is a TypeScript **type assertion** — `formData.get()` returns `string | null` by default, and we're telling TypeScript to treat it as a plain `string` here.

**`fetch(...)`** — makes an HTTP request from our server to Google's verification API. This is a server-to-server call — the browser never sees it.

- `method: "POST"` — we are sending data to Google, not just requesting a page
- `headers: { "Content-Type": "application/x-www-form-urlencoded" }` — tells Google we're sending form data, not JSON
- `body: \`secret=...&response=...\`` — a template literal that builds the request body. It sends our secret key (so Google knows who is asking) and the token (so Google knows which assessment to look up)

**`verifyData.score < 0.5`** — this is the v3-specific check. Google's response includes both a `success` field (did the verification call itself work?) and a `score` field (how human does this submission look?). We reject if either fails. A score below 0.5 is considered likely bot activity.

This check happens **before** any of the email or password validation — if reCAPTCHA fails, we stop immediately and never touch the database.

---

## How the full reCAPTCHA flow works (step by step)

```
User opens the Sign Up page
        ↓
GoogleReCaptchaProvider loads Google's reCAPTCHA v3 script in the background
Google begins silently observing: mouse movements, typing, scroll behaviour
        ↓
User fills in email, password, confirm password
        ↓
User clicks "Create an Account"
        ↓
handleSignUp runs BEFORE any form data is sent
        ↓
executeRecaptcha("sign_up") is called
Google finishes its analysis → returns a one-time token
        ↓
Token is appended to FormData → signUp(formData) is called
        ↓
Server action (actions.ts) receives the form data
        ↓
Server sends the token + secret key to Google's API
Google checks: is this token valid? What was the score?
        ↓
    Score < 0.5 → return { error: "reCAPTCHA failed" } → page shows error
        ↓
    Score ≥ 0.5 → continue to email/password validation → create account
```

---

## Why verify on the server and not just the browser?

A bot doesn't have to use a browser at all. It can send a raw HTTP `POST` request directly to our sign-up endpoint, completely skipping the page — and therefore skipping any client-side checks.

By verifying the token on the server inside `actions.ts`, we ensure that **every single sign-up request** is checked against Google, no matter how it was submitted. There is no way to bypass it.
