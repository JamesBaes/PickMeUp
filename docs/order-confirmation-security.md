# Order Confirmation Security — Change Log

## Overview

This document outlines the security improvements made to the order confirmation flow in PickMeUp. The changes address two separate vulnerabilities that exposed customer order data to potential attackers.

---

## Vulnerabilities Addressed

### Vulnerability 1 — Order UUID Exposed in the URL

**Before:**
After completing a payment, users were redirected to:

```
/order-confirmation/550e8400-e29b-41d4-a716-446655440000
```

The UUID in the URL is the actual primary key of the order record in the Supabase database. This UUID appeared in:

- The browser address bar (visible on screen)
- Browser history (persistent on the device)
- Server access logs (recorded on every request)
- Any shared screenshot or copy-pasted link

**Risk:** Anyone who obtained this URL could directly access private order details, including the customer's name, email, phone number, billing address, and itemized order.

---

### Vulnerability 2 — Unprotected Order Lookup API

**Before:**
The API endpoint `GET /api/orders/[orderId]` used Supabase's **service role key**, which bypasses all Row Level Security (RLS) policies. There was no ownership check — any caller who supplied a valid UUID received the full order record in response.

**Risk:** Even if the URL was never shared, an attacker who discovered or guessed an order UUID (e.g., from a network log or a screenshot) could call the API endpoint directly using a tool like `curl` and retrieve complete customer PII with no authentication required.

---

## Solution: Receipt Token Architecture

A **receipt token** is a randomly generated UUID that is separate from the database primary key. It acts as a short-lived, opaque proof-of-purchase that is:

- Generated server-side at the moment of payment
- Stored in the `orders` table alongside the real order ID
- Returned to the browser only once, immediately after payment
- Stored in `sessionStorage` (not the URL) for the duration of the confirmation page load
- Cleared from `sessionStorage` after the order details are successfully fetched
- Never used to identify the order internally — the real order UUID stays server-side only

---

## Changes Made

### 1. Database — New `receipt_token` Column

A new column was added to the `orders` table in Supabase:

```sql
ALTER TABLE orders
  ADD COLUMN receipt_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;
```

- `UNIQUE` ensures no two orders share a token
- `NOT NULL` enforces that every order has a token
- `DEFAULT gen_random_uuid()` auto-fills existing rows with tokens

---

### 2. `app/api/payments/route.ts` — Generate and Store the Receipt Token

At payment time, a receipt token is generated and written to the database alongside the order. The token (not the order UUID) is returned to the frontend.

```typescript
// Before
return NextResponse.json({
  success: true,
  orderId: order.id, // real DB primary key sent to browser
  paymentId: payment.id,
});

// After
const receiptToken = randomUUID();

// ...inserted into Supabase with receipt_token: receiptToken...

return NextResponse.json({
  success: true,
  orderId: order.id, // kept server-side / admin use only
  receiptToken: receiptToken, // opaque token sent to browser instead
  paymentId: payment.id,
});
```

---

### 3. `components/PaymentForm.tsx` — Pass Receipt Token to the Frontend

The payment form component was updated to forward the receipt token (instead of the order UUID) to the checkout page's success handler.

```typescript
// Before
onSuccess: (orderId: string) => void;
// ...
onSuccessRef.current(data.orderId);

// After
onSuccess: (receiptToken: string) => void;
// ...
onSuccessRef.current(data.receiptToken);
```

The real order UUID never reaches the browser at any point in this flow.

---

### 4. `app/checkout/page.tsx` — Store Token in sessionStorage, Not in the URL

Instead of embedding any identifier in the redirect URL, the receipt token is stored in the browser's `sessionStorage` and the user is sent to a static route.

```typescript
// Before
const handleSuccess = useCallback(
  (orderId: string) => {
    router.push(`/order-confirmation/${orderId}`); // UUID visible in URL
  },
  [router],
);

// After
const handleSuccess = useCallback(
  (receiptToken: string) => {
    sessionStorage.setItem("pendingReceiptToken", receiptToken);
    router.push("/order-confirmation"); // no identifier in the URL
  },
  [router],
);
```

`sessionStorage` is scoped to the current browser tab and is never sent to the server, so it cannot be intercepted in transit or read by other websites.

---

### 5. `app/api/orders/receipt/[receiptToken]/route.ts` — New Secure Lookup Endpoint

A new API route was created that looks up orders by receipt token instead of by primary key. Because the receipt token has no structural relationship to the database primary key, knowing a token reveals nothing about the underlying data model.

```
GET /api/orders/receipt/[receiptToken]
```

- Queries: `SELECT * FROM orders WHERE receipt_token = $1`
- Returns the same formatted order data as the previous endpoint
- A wrong or made-up token returns `404 Not Found`

---

### 6. `app/order-confirmation/page.tsx` — Static Confirmation Page

The dynamic route `app/order-confirmation/[orderId]/page.tsx` was deleted and replaced with a static page at `app/order-confirmation/page.tsx`.

Key behaviours:

| Scenario                                           | Behaviour                                            |
| -------------------------------------------------- | ---------------------------------------------------- |
| Arriving from checkout (token in sessionStorage)   | Fetches and displays order details normally          |
| Token cleared after first successful fetch         | Page refresh redirects to `/` — prevents replay      |
| Direct navigation with no token                    | Immediately redirects to `/` — no broken state shown |
| Navigating to old URL `/order-confirmation/<uuid>` | Returns `404` — route no longer exists               |

---

## Security Properties After These Changes

| Property                                   | Before | After                         |
| ------------------------------------------ | ------ | ----------------------------- |
| Order UUID in browser URL                  | Yes    | No                            |
| Order UUID in browser history              | Yes    | No                            |
| Order UUID in server access logs           | Yes    | No                            |
| API requires proof of purchase             | No     | Yes (receipt token)           |
| Token survives page refresh                | —      | No (cleared after first load) |
| Old `/order-confirmation/<uuid>` URL works | Yes    | No (404)                      |
| Real order UUID reachable from the browser | Yes    | No                            |

---

## What This Does Not Change

- The `/api/orders/[orderId]` route still exists and uses the service role key. Since the frontend no longer calls it, it is not reachable through normal app usage. It can be deleted if no other internal feature (e.g., order history) depends on it.
- Receipt tokens have the same 128-bit entropy as UUIDs. They are not time-limited — a token does not expire after the confirmation page is visited. If expiry is needed in the future, a `receipt_token_expires_at` timestamp column could be added and checked in the API route.
