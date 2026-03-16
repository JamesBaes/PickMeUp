# Restaurant ID Order Tracking - Changelog

**Date:** 2026-03-16
**Branch:** DEV-164
**Summary:** Wired the selected restaurant location into the order creation flow so each order is tagged with the `restaurant_id` of the location it was placed at.

---

## Overview

Previously, orders were saved to Supabase with no reference to which restaurant location they came from. This made it impossible for backend staff to filter and view only orders relevant to their specific location.

This change threads `restaurant_id` — sourced from `LocationContext` — through the entire checkout flow and persists it alongside every new order record.

---

## Why This Was Needed

- Backend staff at each location need to see only their own orders
- Orders were being stored without any location identifier, making location-based filtering impossible
- The `LocationContext` already tracked the user's selected location but it was never used during order creation

---

## Files Changed

### 1. `components/PaymentForm.tsx`

**What changed:** Added `restaurantId` to the `OrderDetails` interface.

```ts
// Before
interface OrderDetails {
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  pickupTime: string;
}

// After
interface OrderDetails {
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  pickupTime: string;
  restaurantId: string;  // ← added
}
```

`orderDetails` is passed as-is to `/api/payments`, so no other changes were needed in this file.

---

### 2. `app/checkout/page.tsx`

**What changed:** Imported `useLocation`, destructured `currentLocation`, and added `restaurantId` to the `orderDetails` object passed to `PaymentForm`.

```ts
// New import
import { useLocation } from "@/context/locationContext";

// New hook call inside CheckoutPage()
const { currentLocation } = useLocation();

// Added to orderDetails object
const orderDetails = {
  // ...existing fields...
  restaurantId: currentLocation?.id ?? "",  // ← added
};
```

`currentLocation.id` is the `restaurant_id` string from the `restaurant_locations` Supabase table, restored from `localStorage` on load by `LocationProvider`.

---

### 3. `app/api/payments/route.ts`

**What changed:** Added `restaurant_id` to the Supabase `orders` insert.

```ts
await supabase.from("orders").insert({
  // ...existing fields...
  restaurant_id: orderDetails.restaurantId,  // ← added
});
```

---

## Required Database Migration

A new column must be added to the `orders` table in Supabase before this works end-to-end. Run the following in the Supabase SQL editor:

```sql
ALTER TABLE orders ADD COLUMN restaurant_id TEXT;
```

---

## Data Flow

```
User selects location (LocationContext / localStorage)
        ↓
Checkout page reads currentLocation.id
        ↓
orderDetails.restaurantId passed to PaymentForm
        ↓
PaymentForm sends orderDetails to /api/payments
        ↓
API inserts restaurant_id into orders table
```

---

## How to Verify

1. Select a location from the location picker
2. Add items to cart and proceed to checkout
3. Complete a test payment
4. Open the `orders` table in Supabase Studio and confirm the `restaurant_id` column is populated with the correct restaurant ID
