# New Developer Onboarding

## Project At A Glance
- Framework: Next.js App Router with client/server routes.
- Backend services: Supabase (auth, location/menu data, cart-related tables), Square payments.
- State strategy: React Context providers for auth, cart, location, favorites.

## Core Runtime Flow
1. App bootstraps providers in [app/layout.tsx](app/layout.tsx).
2. Location is restored from localStorage in [context/locationContext.tsx](context/locationContext.tsx).
3. Auth session is restored in [context/authContext.tsx](context/authContext.tsx).
4. Cart is restored from localStorage in [context/cartContext.tsx](context/cartContext.tsx).
5. Menu page [app/page.tsx](app/page.tsx) fetches location-aware menu data and renders category sections.

## Why Provider Order Matters
Current order in layout:
- PostHogProvider
- LocationProvider
- AuthProvider
- CartProvider
- FavoritesProvider

Important dependency:
- CartProvider reads useAuth(), so AuthProvider must wrap CartProvider.

## Files You Will Touch Most Often
- [app/page.tsx](app/page.tsx)
  Menu UX, category scroller, location dropdown, scroll behavior.
- [app/cart/page.tsx](app/cart/page.tsx)
  Cart grouping, totals, location mismatch guard before checkout.
- [context/locationContext.tsx](context/locationContext.tsx)
  Location persistence + available location list.
- [context/cartContext.tsx](context/cartContext.tsx)
  Cart operations used across menu/cart/checkout.
- [context/authContext.tsx](context/authContext.tsx)
  User session and guest-cart lifecycle.

## Current UX Patterns
- Location selection now lives in the menu sticky bar (not a separate selector page).
- Category scroller is single-line and horizontally scrollable.
- Active category is tracked via scrollspy and auto-centered in the scroller.
- On location change, menu uses a soft refresh state (fade + updating label).
- Cart checkout is guarded by location mismatch checks.

## Common Dev Tips
- If menu data looks stale, verify `selectedLocation` in localStorage.
- If cart badge and cart page disagree, inspect [context/cartContext.tsx](context/cartContext.tsx) first.
- If checkout is blocked, inspect mismatch logic in [app/cart/page.tsx](app/cart/page.tsx).
- For auth-related cart behavior, inspect merge logic in [context/authContext.tsx](context/authContext.tsx).

## Suggested Next Improvements
- Add centralized API/data layer helpers for Supabase queries.
- Add end-to-end tests for location-switch + cart mismatch flows.
- Add strict TypeScript types for all Supabase row shapes to reduce runtime checks.
