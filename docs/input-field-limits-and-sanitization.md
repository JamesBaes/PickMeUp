# Input Field Limits & Sanitization - Changelog

**Date:** 2026-03-19
**Summary:** Added character limits and input sanitization to all user-facing input and textarea fields across the app.

---

## 🎯 Overview

Two improvements were applied to every input and textarea field:

1. **Character limits (`maxLength`)** — prevent excessively long values from being submitted
2. **Input sanitization** — strip characters commonly used in injection and XSS attacks before they reach state or the server

---

## 📋 Part 1: Character Limits

### Payment Form Components

| File | Field | Limit |
|---|---|---|
| `components/CardholderForm.tsx` | Full name on card | 50 |
| `components/ContactDetailsForm.tsx` | Email address | 50 |
| `components/ContactDetailsForm.tsx` | Phone number | 20 |
| `components/BillingAddressForm.tsx` | Billing address | 100 |

> Address was set to 100 (not 50) because real street addresses commonly exceed 50 characters.

### Item Page

| File | Field | Old Limit | New Limit |
|---|---|---|---|
| `app/[item]/page.tsx` | New comment textarea | 500 | 400 |
| `app/[item]/page.tsx` | Edit comment textarea | 500 | 400 |

### Other Fields

| File | Field | Limit |
|---|---|---|
| `components/PromoCodeInput.tsx` | Promo code | 20 |
| `app/(protected)/order-history/page.tsx` | Order search | 100 |

### Auth & Account Pages

| File | Field | Limit |
|---|---|---|
| `app/(auth)/sign-up/page.tsx` | Email | 254 |
| `app/(auth)/sign-up/page.tsx` | Password | 128 |
| `app/(auth)/sign-up/page.tsx` | Confirm password | 128 |
| `app/(auth)/login/page.tsx` | Email | 254 |
| `app/(auth)/login/page.tsx` | Password | 128 |
| `app/(auth)/forgot-password/page.tsx` | Email | 254 |
| `app/(auth)/reset-password/page.tsx` | New password | 128 |
| `app/(auth)/reset-password/page.tsx` | Confirm password | 128 |
| `app/(protected)/account/page.tsx` | New password | 128 |
| `app/(protected)/account/page.tsx` | Confirm password | 128 |

> Email limit of 254 follows RFC 5321 (the maximum allowed email address length).
> Password fields are not restricted below 128 — users need access to special characters for strong passwords.

---

## 📋 Part 2: Input Sanitization

### New Helper Functions — `helpers/checkoutValidation.ts`

Three sanitization helpers were added:

```typescript
// Restrict name fields to letters, spaces, hyphens, apostrophes, and periods
export const sanitizeNameInput = (value: string): string =>
  value.replace(/[^a-zA-Z\s\-'.,]/g, "");

// Restrict address fields to alphanumeric and common address punctuation
export const sanitizeAddressInput = (value: string): string =>
  value.replace(/[^a-zA-Z0-9\s\-.,#/]/g, "");

// Strip characters commonly used in injection and XSS attacks
export const stripInjectionChars = (value: string): string =>
  value.replace(/[<>"`;\\]/g, "");
```

### Where Each Sanitizer Is Applied

| File | Field | Sanitizer |
|---|---|---|
| `components/CardholderForm.tsx` | Cardholder name | `sanitizeNameInput` |
| `components/ContactDetailsForm.tsx` | Email | `stripInjectionChars` |
| `components/BillingAddressForm.tsx` | Billing address | `sanitizeAddressInput` |
| `components/PromoCodeInput.tsx` | Promo code | inline `/[^A-Z0-9\-]/g` (already uppercased) |
| `app/[item]/page.tsx` | New comment | `stripInjectionChars` |
| `app/[item]/page.tsx` | Edit comment | `stripInjectionChars` |
| `app/(protected)/order-history/page.tsx` | Order search | `stripInjectionChars` |
| `app/(auth)/forgot-password/page.tsx` | Email | inline `/[<>"`;\\]/g` via `onChange` |
| `app/(auth)/sign-up/page.tsx` | Email | inline `/[<>"`;\\]/g` via `onInput` |
| `app/(auth)/login/page.tsx` | Email | inline `/[<>"`;\\]/g` via `onInput` |

> Phone number fields are already sanitized — `formatPhoneNumber` (existing helper) strips all non-numeric characters.
> Password fields have **no** sanitization applied. Restricting characters in passwords weakens security.

### Characters Stripped by `stripInjectionChars`

| Character | Risk |
|---|---|
| `<` `>` | HTML injection / XSS |
| `"` | Attribute injection |
| `` ` `` | Template literal injection |
| `;` | SQL statement terminator |
| `\` | Escape sequence abuse |

---

## 🔐 Security Note

Client-side sanitization is a **defense-in-depth** measure, not a primary security control. The app's primary protection against SQL injection is Supabase's parameterized queries, which prevent injection attacks regardless of what values are submitted. These client-side filters:

- Improve UX by giving immediate feedback (characters simply don't appear)
- Reduce the surface area of malformed input reaching the server
- Protect against reflected XSS if any input values are ever rendered without escaping

---

## 🗂️ Files Modified

**Helpers:**
- `helpers/checkoutValidation.ts` — added `sanitizeNameInput`, `sanitizeAddressInput`, `stripInjectionChars`

**Payment Components:**
- `components/CardholderForm.tsx`
- `components/ContactDetailsForm.tsx`
- `components/BillingAddressForm.tsx`
- `components/PromoCodeInput.tsx`

**Pages:**
- `app/[item]/page.tsx`
- `app/(protected)/order-history/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(protected)/account/page.tsx`

---

## 🧪 Testing Recommendations

### Character Limits

1. Go to the checkout page and try typing more than 50 characters into the cardholder name field — input should stop at 50.
2. Try typing more than 20 characters into the phone field — should stop at 20.
3. On an item page, try typing more than 400 characters into the comment box — should stop at 400.
4. On the sign-up page, try pasting a very long email or password — should be capped at 254 / 128.

### Input Sanitization

1. On the checkout page, try typing `<script>` into the cardholder name field — the `<`, `>`, and `;` characters should not appear.
2. Try typing `" OR 1=1 --` into the billing address field — the `"` should be stripped immediately.
3. Try typing `<b>bold</b>` into the comment textarea — the angle brackets should be stripped.
4. Try typing `'; DROP TABLE` into the order history search — the `'` and `;` should be stripped.

---

## 🔄 Migration Notes

No breaking changes. No API, database schema, or environment variable updates required. All changes are purely client-side input handling.
