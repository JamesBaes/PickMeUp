# Color System Refactor

All hardcoded Tailwind palette classes (`gray-*`, `red-*`, `blue-*`, `green-*`, `amber-*`, `emerald-*`, `slate-*`, `pink-*`) have been replaced with CSS custom properties defined in `app/globals.css`. Every color decision now routes through a single source of truth.

---

## What Changed

### `app/globals.css`
Added a complete custom color system to `:root` and registered each variable in `@theme inline` so they work as Tailwind utilities (`bg-danger`, `text-neutral-600`, etc.).

**Color groups added:**

| Group | Variables | Purpose |
|---|---|---|
| Neutral | `neutral-50` → `neutral-900` | Grays for text, borders, backgrounds |
| Danger | `danger`, `danger-dark`, `danger-subtle`, `danger-border`, `danger-text` | Errors, destructive actions |
| Info | `info-muted`, `info`, `info-hover`, `info-dark`, `info-bg`, `info-border` | Blue buttons, info alerts |
| Success | `success`, `success-dark`, `success-subtle`, `success-indicator` | Pay button, badges, sync indicator |
| Warning | `warning-bg`, `warning-bg-hover`, `warning-highlight`, `warning-text`, `warning-text-dark` | Cart conflict banner |
| Misc | `heart`, `rating`, `black` | Favorites icon, star ratings |

Brand colors (`accent`, `secondary`, `active`, `background`, `foreground`, `offwhite`) were already in globals.css and left unchanged.

---

### Files Updated (16 total)

| File | Changes |
|---|---|
| `components/NavBar.tsx` | gray→neutral, blue button→info, slate→neutral-800 |
| `components/MenuItemCard.tsx` | gray→neutral, red→danger, green→success |
| `components/CartItemCard.tsx` | gray→neutral, red→danger |
| `components/Footer.tsx` | gray→neutral |
| `components/OrderSummary.tsx` | gray→neutral, green→success |
| `components/PaymentForm.tsx` | gray→neutral |
| `components/PromoCodeInput.tsx` | gray→neutral, blue→info, red→danger |
| `components/ContactDetailsForm.tsx` | gray→neutral, blue→info, red→danger |
| `components/CardholderForm.tsx` | gray→neutral, blue→info, red→danger |
| `components/BillingAddressForm.tsx` | gray→neutral, blue→info, red→danger |
| `components/PasswordRequirements.tsx` | gray→neutral (daisyUI badge classes unchanged) |
| `app/page.tsx` | gray→neutral, red→danger, black preserved |
| `app/cart/page.tsx` | Full audit — all status colors, alerts, badges |
| `app/checkout/page.tsx` | gray→neutral, green pay button→success, red error→danger |
| `app/(auth)/login/page.tsx` | gray→neutral, blue→info |
| `app/(auth)/sign-up/page.tsx` | gray→neutral, blue→info |
| `app/(auth)/forgot-password/page.tsx` | gray→neutral, blue→info |
| `app/(auth)/reset-password/page.tsx` | gray→neutral, blue→info |
| `app/(auth)/verify-email/page.tsx` | gray→neutral |
| `app/select-location/page.tsx` | gray→neutral |
| `app/[item]/page.tsx` | gray→neutral, amber→rating, red→danger, green→success |
| `app/order-confirmation/page.tsx` | gray→neutral, red→danger, green→success |
| `app/order-confirmation/[orderId]/page.tsx` | gray→neutral, red→danger, green→success |
| `app/(protected)/layout.tsx` | slate→neutral |
| `app/(protected)/account/page.tsx` | slate→neutral, red danger zone→danger |
| `app/(protected)/favorites/page.tsx` | slate→neutral, pink→heart |
| `app/(protected)/order-history/page.tsx` | slate→neutral, green progress→success, status badges→success/danger |

---

## Consolidation (Second Pass)

After the initial migration, near-identical shades used by similar elements were merged to reduce the variable count from 47 → 32.

| Removed | Replaced With | Rationale |
|---|---|---|
| `danger-muted` (red-400) | `danger` (red-500) | Same context, negligible difference |
| `danger-bg` (red-50) | `danger-subtle` (red-100) | Both light-red backgrounds |
| `danger-border-strong` (red-300) | `danger-border` (red-200) | One border shade is enough |
| `danger-text-dark` (red-800) | `danger-text` (red-700) | Same purpose, near-identical shade |
| `info-border-strong` (blue-300) | `info-border` (blue-200) | One border shade is enough |
| `info-bg-hover` (blue-100) | `info-border` (blue-200) | Used as hover bg — close enough |
| `success-text` (emerald-600) | `success-indicator` (emerald-500) | Same location, near-identical shade |
| `success-progress` (green-500) | `success` (green-600) | Progress dots use primary success color |
| `warning-text-darkest` (amber-900) | `warning-text-dark` (amber-800) | One shade difference, same purpose |
| `slate-400/500/600/700/900` + `slate` | `neutral-*` equivalents | Slate and neutral are near-identical grays |

---

## Rules

- **No raw palette names** in any `.tsx` file — `gray-*`, `red-*`, `blue-*`, `green-*`, `amber-*`, `emerald-*`, `slate-*`, `pink-*` are all banned.
- **DaisyUI semantic classes** (`badge-success`, `badge-error`, `alert-warning`, `btn`, etc.) are left as-is — they are framework-controlled.
- To change any color, edit only `app/globals.css`.
