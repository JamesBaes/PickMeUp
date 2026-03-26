# Order Confirmation — Complete Deep Dive

**Primary file:** `app/order-confirmation/page.tsx`
**Related files:**
- `app/api/orders/receipt/[receiptToken]/route.ts`
- `app/api/orders/[orderId]/route.ts`

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Types & Data Structures](#2-types--data-structures)
3. [Security Model — Why the Receipt Token Exists](#3-security-model--why-the-receipt-token-exists)
4. [State Variables](#4-state-variables)
5. [The Two useEffect Hooks](#5-the-two-useeffect-hooks)
6. [The API Routes](#6-the-api-routes)
7. [The Progress Bar — Status Machine](#7-the-progress-bar--status-machine)
8. [Real-Time Order Tracking](#8-real-time-order-tracking)
9. [UI Sections Breakdown](#9-ui-sections-breakdown)
10. [Full Flow Diagram](#10-full-flow-diagram)

---

## 1. The Big Picture

The Order Confirmation page does two things:

1. **Displays a receipt** — order items, totals, billing info, pickup time — fetched securely from the server immediately after checkout.
2. **Tracks order status in real time** — a live progress bar updates automatically as the kitchen marks the order through `paid → in_progress → ready → completed`.

It is a **client component** (`"use client"`) because it needs:
- `sessionStorage` access (browser-only API)
- `useEffect` for data fetching and Supabase real-time subscriptions
- State management for live status updates

---

## 2. Types & Data Structures

### `OrderStatus`

```typescript
type OrderStatus = "paid" | "in_progress" | "ready" | "completed";
```

Four possible states, always moving forward. These values come directly from the `status` column in the `orders` Supabase table. The Manager app is responsible for advancing the status.

---

### `OrderItem`

```typescript
interface OrderItem {
  name: string;
  quantity: number;
  price: number;       // in dollars (already converted from cents by the API)
  image_url: string;
}
```

Represents a single line item in the order summary. Price is stored in the database as integer cents but the API route converts it to dollars before sending it to the client.

---

### `OrderData`

```typescript
interface OrderData {
  id: string;                   // real Supabase UUID (never shown to user)
  orderNumber: string;          // formatted: "ORD-XXXXXXXX"
  date: string;                 // human-readable: "March 26, 2026"
  paymentMethod: string;        // "VISA" (currently hardcoded)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  items: OrderItem[];
  subtotal: number;             // derived from total (see API section)
  tax: number;                  // derived from total
  total: number;                // total_cents / 100
  pickupTime: string;           // ISO timestamp from DB
  status: OrderStatus;
  locationName?: string | null; // joined from restaurant_locations table
}
```

This is the shape the page works with. It is assembled by the API route from the raw database row — the page never touches the database directly.

---

## 3. Security Model — Why the Receipt Token Exists

This is one of the most important design decisions in the checkout flow.

**The problem:** After a successful payment, the app needs to show the customer their order. The naive approach would be to put the order's UUID in the URL: `/order-confirmation?id=abc-123`. But this creates a security hole — any user could guess or increment IDs and view other people's receipts.

**The solution — the receipt token:**

When an order is created in the database, a second column `receipt_token` is populated with a random UUID. This token is:
- Stored only in `sessionStorage` (never in the URL)
- Single-use from the page's perspective — it is cleared from `sessionStorage` after a successful fetch
- Used to look up the order server-side instead of the real `id`

```
Checkout completes
  → sessionStorage.setItem("pendingReceiptToken", receiptToken)
  → User is redirected to /order-confirmation

/order-confirmation loads
  → Reads receiptToken from sessionStorage
  → If missing → redirect to / (no valid session, can't show page)
  → Calls /api/orders/receipt/{receiptToken}
  → API looks up order WHERE receipt_token = receiptToken
  → Returns order data
  → sessionStorage.removeItem("pendingReceiptToken")  ← token consumed
```

**Why sessionStorage and not a URL param?**
- `sessionStorage` is not visible in the browser URL bar, address bar sharing, or server logs
- It is scoped to the current tab and cleared when the tab is closed
- Refreshing the page after the token is consumed redirects to home instead of showing a broken/replayed receipt — this is intentional

**Why clear the token after fetching?**
Prevents replay. Once the order data is loaded and stored in React state, the token has served its purpose. If the user refreshes, the token is gone and they are redirected to `/` — they can still find the order in order history.

---

## 4. State Variables

```typescript
const [orderData, setOrderData] = useState<OrderData | null>(null);
```
Holds the full order details. Starts as `null` while loading. If it stays `null` after loading, the error state is shown.

```typescript
const [loading, setLoading] = useState(true);
```
Controls which UI state is shown — loading spinner, error message, or the actual confirmation page.

```typescript
const [error, setError] = useState<string | null>(null);
```
Stores any error message from the fetch. Displayed to the user with a "Return to menu" link if set.

```typescript
const router = useRouter();
```
Used to redirect to `/` when there is no valid receipt token or when "Return to menu" is clicked.

---

## 5. The Two useEffect Hooks

### Hook 1 — Fetch Order Data

```typescript
useEffect(() => {
  const receiptToken = sessionStorage.getItem("pendingReceiptToken");

  if (!receiptToken) {
    router.replace("/");
    return;
  }

  const fetchOrderData = async () => {
    try {
      const response = await fetch(`/api/orders/receipt/${receiptToken}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      const data = await response.json();
      setOrderData(data);
      sessionStorage.removeItem("pendingReceiptToken"); // consume the token
    } catch (err) {
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  fetchOrderData();
}, [router]);
```

**Why `router.replace("/")` and not `router.push("/")`?**
`replace` removes the `/order-confirmation` entry from the browser history stack. If the user was redirected due to a missing token, pressing the back button should not bring them back to an empty confirmation page — `replace` ensures it doesn't appear in history at all.

**Why `[router]` as the dependency?**
This effect should only run once on mount. `router` is stable (doesn't change between renders), so it effectively acts the same as `[]`. It's included to satisfy the ESLint exhaustive-deps rule.

---

### Hook 2 — Real-Time Status Subscription

```typescript
useEffect(() => {
  if (!orderData?.id) return;

  const channel = supabase
    .channel(`order-confirmation-receipt-${orderData.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderData.id}`,
      },
      (payload) => {
        setOrderData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: (payload.new.status as OrderStatus) ?? prev.status,
            pickupTime: payload.new.pickup_time ?? prev.pickupTime,
          };
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [orderData?.id]);
```

**What it does:** Opens a Supabase Realtime subscription that listens for `UPDATE` events on the specific row matching `orderData.id`. When the Manager app changes the order status, this fires and updates the progress bar live without a page reload.

**Why `[orderData?.id]` as the dependency?**
`orderData` is `null` on initial render — the subscription can't be set up until the order is fetched. `orderData?.id` is `undefined` while loading, then resolves to the real UUID after Hook 1 completes. This triggers the subscription at the right moment.

**Why the cleanup `return () => supabase.removeChannel(channel)`?**
If the component unmounts (user navigates away), the WebSocket subscription must be closed. Without this, you'd have a memory leak — an active WebSocket connection polling for updates for a component that no longer exists.

**Why store `orderData.id` in the channel name?**
`order-confirmation-receipt-${orderData.id}` makes the channel unique per order. If two browser tabs are open showing different orders, each gets its own channel and updates independently.

**What can update?**
- `status` — drives the progress bar forward
- `pickupTime` — the kitchen can adjust the estimated pickup time after the order is placed

---

## 6. The API Routes

### `GET /api/orders/receipt/[receiptToken]`

**File:** `app/api/orders/receipt/[receiptToken]/route.ts`

This is the primary route used by the confirmation page. It accepts a `receiptToken` (the opaque single-use token) instead of the real order UUID.

**Why it uses `SUPABASE_SERVICE_ROLE_KEY`:**
The order lookup is done server-side with admin privileges. This bypasses Supabase Row Level Security (RLS) policies, which is intentional — the token is the authorization mechanism here. The real `id` is never exposed to the client.

**Tax calculation:**
```typescript
const TAX_RATE = 0.13; // 13% Ontario HST
const subtotal = totalDollars / (1 + TAX_RATE);
const tax = totalDollars - subtotal;
```

The database stores only `total_cents` (the amount actually charged). Subtotal and tax are **derived** from the total, not stored separately. This avoids the database getting out of sync with the displayed values.

**`locationName` normalization:**
```typescript
locationName: order.restaurant_locations?.location_name
  ?.replace(/_/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase()) ?? null
```

Location names are stored in the database with underscores (e.g., `downtown_location`). This converts them to title case (`Downtown Location`) for display. The `?? null` fallback handles orders that don't have a location attached.

**`orderNumber` formatting:**
```typescript
orderNumber: `ORD-${order.id.toString().slice(0, 8).toUpperCase()}`
```

Takes the first 8 characters of the UUID and prefixes with `ORD-`. Gives the customer a short, readable reference number (e.g., `ORD-A1B2C3D4`) without exposing the full UUID.

---

### `GET /api/orders/[orderId]`

**File:** `app/api/orders/[orderId]/route.ts`

A separate route that looks up an order by its real UUID. Used by the Manager app and order history — not by the confirmation page. It has the same response shape and tax calculation logic as the receipt route.

---

## 7. The Progress Bar — Status Machine

```typescript
const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "paid",        label: "Order Placed", icon: "1" },
  { key: "in_progress", label: "Preparing",    icon: "2" },
  { key: "ready",       label: "Ready",        icon: "3" },
  { key: "completed",   label: "Completed",    icon: "4" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  paid: 0,
  in_progress: 1,
  ready: 2,
  completed: 3,
};
```

`STEPS` is the ordered list of stages. `STATUS_INDEX` maps each status string to its position (0–3).

**Rendering logic:**
```typescript
const currentIndex = STATUS_INDEX[orderData.status] ?? 0;
const isCompleted = i < currentIndex;   // all steps before current → filled green
const isActive    = i === currentIndex; // current step → filled green
```

- Steps before the current one (`isCompleted`) are green — already done.
- The current step (`isActive`) is also green — currently happening.
- Steps after the current one — grey — not yet reached.
- The connector line between steps is also conditionally green: `i < currentIndex`.

This means the progress bar always reflects the live status, and when Hook 2 fires an update, React re-renders just the progress bar with the new `orderData.status` — no full page reload required.

---

## 8. Real-Time Order Tracking

Here is the full path from the Manager marking an order as `in_progress` to the customer's progress bar updating:

```
Manager app:
  Staff clicks "Start Order" on the live orders page
    → Supabase UPDATE orders SET status = 'in_progress' WHERE id = '...'

Supabase Realtime:
  Detects the UPDATE on the orders table
    → Broadcasts to all subscribers of the matching filter

Customer's browser (Hook 2):
  Receives the postgres_changes event
    → payload.new.status = "in_progress"
    → setOrderData(prev => ({ ...prev, status: "in_progress" }))

React re-renders:
  STATUS_INDEX["in_progress"] = 1
  Step 0 → isCompleted (green)
  Step 1 → isActive (green)
  Steps 2-3 → grey
  Progress bar visually advances
```

No polling. No page refresh. The customer sees the update within ~1 second of the staff action.

---

## 9. UI Sections Breakdown

The page is a two-column grid on large screens, single column on mobile.

### Left Column

**1. Thank You Message & Pickup Time**
Static text with the formatted pickup time. `formatPickupTime` converts the ISO timestamp to a human-readable 12-hour format (e.g., `3:30 PM`). If the kitchen updates `pickup_time`, Hook 2 will update this live.

**2. Order Progress Bar**
The real-time status tracker described above. Four steps connected by lines, styled green for completed/active and grey for pending.

**3. Payment Summary Card**
Billing address, customer name, email, and phone. Static after load.

> Note: There is a commented-out "Email Receipt" button (`handleEmailReceipt`). This feature was built and tested but is currently disabled. The handler calls `POST /api/send-receipt` with the full `orderData`. It can be re-enabled by uncommenting the JSX block and the handler function.

### Right Column

**Order Summary Card**
- Order number, date, payment method
- Line items with images (via Cloudinary CDN), name, quantity, and price per line
- Subtotal, tax, and order total

Item name formatting:
```typescript
item.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
```
Same underscore-to-title-case normalization applied to item names as location names.

---

## 10. Full Flow Diagram

### Happy path — customer completes checkout

```
Checkout page:
  Payment succeeds
    → Server stores order in Supabase with receipt_token = randomUUID()
    → Returns receipt_token to client
    → Client: sessionStorage.setItem("pendingReceiptToken", token)
    → router.push("/order-confirmation")

Order Confirmation page mounts:
  Hook 1 fires:
    → sessionStorage.getItem("pendingReceiptToken") → token found
    → fetch("/api/orders/receipt/{token}")
    → API: SELECT * FROM orders WHERE receipt_token = token
    → Returns formatted OrderData
    → setOrderData(data)
    → setLoading(false)
    → sessionStorage.removeItem("pendingReceiptToken")

  Hook 2 fires (triggered by orderData?.id becoming defined):
    → Opens Supabase Realtime channel for this order's id
    → Listens for UPDATE events on the orders table

Page renders:
  → Progress bar shows "Order Placed" (status = "paid")
  → Items, totals, billing info displayed

Later — Manager updates status to "in_progress":
  → Realtime event fires in Hook 2
  → setOrderData updates status
  → Progress bar advances to "Preparing"

User navigates away:
  → Hook 2 cleanup: supabase.removeChannel(channel)
  → WebSocket connection closed
```

### Edge case — user opens /order-confirmation directly (no token)

```
Page mounts:
  Hook 1 fires:
    → sessionStorage.getItem("pendingReceiptToken") → null
    → router.replace("/")
    → User lands on home page, /order-confirmation not in history
```

### Edge case — API fetch fails

```
Hook 1 fires:
  → fetch("/api/orders/receipt/{token}") → non-200 response
  → catch block: setError("Failed to load order details")
  → setLoading(false)

Page renders error state:
  → "Failed to load order details"
  → "Return to menu" link → router.push("/")
```
