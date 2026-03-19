# PickMeUp — Technical Presentation Study Guide

> Covers: Cart Context · Order Confirmation · Text Input Validation & Sanitization · Global CSS & Colors · Delete Account

---

## Table of Contents

1. [Cart Context](#1-cart-context)
2. [Order Confirmation](#2-order-confirmation)
3. [Text Inputs — Validation, Max Characters & Sanitization](#3-text-inputs--validation-max-characters--sanitization)
4. [Global CSS & Color System](#4-global-css--color-system)
5. [Delete Account](#5-delete-account)

---

## 1. Cart Context

**File:** `context/cartContext.tsx`

### What It Does

The Cart Context is the single source of truth for everything in the shopping cart. It uses React's Context API so any component in the app can read or modify the cart without passing props through every layer. It supports two modes simultaneously: **authenticated users** (cart saved to the database) and **guests** (cart saved to `localStorage`).

---

### Key Types

```typescript
// What a row looks like when fetched from the Supabase database
type CartItemRow = {
  id: string;
  user_id: string;
  item_id: string;
  unit_price_cents: number;
  quantity: number;
  image_url: string;
  location_id: string;
};

// What a cart item looks like in the frontend (extends MenuItem with a quantity)
type CartItem = MenuItem & { quantity: number };
```

The `toCartItem(row)` helper converts a database row into a `CartItem` that the frontend uses.

---

### Core Functions

#### `addItem(menuItem, quantity = 1)`

Adds an item to the cart. If the item already exists, it **increments the quantity** instead of duplicating.

- **Authenticated users:** Calls Supabase `upsert` to insert or update the row in the `cart_items` table.
- **Guest users:** Updates local state and writes to `localStorage`.
- After updating, it broadcasts the change to other open browser tabs using Supabase Realtime.

```
User clicks "Add to Cart"
  → addItem() is called
  → Check if item already in state
     → Yes: increment quantity
     → No: add new entry
  → Save to Supabase (auth) OR localStorage (guest)
  → Broadcast to other tabs
```

---

#### `removeItem(itemId)`

Removes a single item entirely from the cart regardless of quantity.

- Auth: Deletes the row from Supabase using `location_id` filter.
- Guest: Filters out the item from local state and updates `localStorage`.

---

#### `updateQuantity(itemId, quantity)`

Changes how many of a specific item the user wants.

- If `quantity` reaches **0**, it automatically calls `removeItem()` to clean up the entry.
- Auth: Updates the `quantity` field in Supabase.
- Guest: Updates local state.

---

#### `clearCart()`

Removes **all** items from the cart at once. Used after a successful checkout.

- Auth: Deletes all rows from `cart_items` table for this user + location.
- Guest: Clears the `localStorage` entry.

---

#### `getItemCount()`

Returns the **total number of items** across all cart entries (summing quantities).

```typescript
items.reduce((total, item) => total + item.quantity, 0)
```

Used to show the badge number on the cart icon in the navbar.

---

#### `getTotal()`

Returns the **total price in dollars** across all cart items.

```typescript
items.reduce((total, item) => total + item.price * item.quantity, 0)
```

---

#### `swapItemsToNewLocation(swaps)`

Called when the user switches pickup locations. Replaces cart items with equivalent items at the new location while **preserving quantities**. Only the `item_id` and `restaurant_id` change.

---

### Guest → Auth: `mergeGuestCartToUserCart()`

When a guest logs in, this function runs automatically. It:
1. Reads all items from `localStorage`.
2. For each item, either inserts it into Supabase or increases the quantity if the user already had it in their saved cart.
3. Clears `localStorage` once merged.

This means guests never lose their cart when they log in.

---

### Multi-Tab Synchronization

The cart stays in sync across multiple browser tabs:

| Mechanism | Who It's For | How It Works |
|---|---|---|
| `localStorage` events | Guests | Browser fires a `storage` event when another tab writes to `localStorage`. The cart listens and updates state. |
| Supabase Realtime | Auth users | Uses a `cart-sync:{userId}` channel. When one tab updates the cart, it broadcasts a `cart-updated` event. Other tabs receive it and refresh their state. |

A unique tab ID (`tabInstanceId`) is generated using `useRef` so a tab doesn't reprocess its own broadcasts.

---

### How Components Use It

```typescript
// Any component can access the cart like this:
const { items, addItem, removeItem, getTotal } = useCart();
```

`useCart()` is a custom hook that calls `useContext(CartContext)` and throws an error if used outside of `<CartProvider>`.

---

## 2. Order Confirmation

**Files:**
- `app/order-confirmation/page.tsx` — shown immediately after checkout
- `app/order-confirmation/[orderId]/page.tsx` — shown when viewing an order from history

---

### Flow: What Happens After Payment

```
User pays at /checkout
  → POST /api/payments is called
  → Square charges the card
  → A new order row is created in Supabase with a receiptToken (UUID)
  → receiptToken is returned to the client
  → Client stores receiptToken in sessionStorage as "pendingReceiptToken"
  → Cart is cleared
  → User is redirected to /order-confirmation
```

```
User lands on /order-confirmation
  → Page reads receiptToken from sessionStorage
  → If no token → redirect to "/" (prevents someone bookmarking the blank confirmation page)
  → Fetches order details from GET /api/orders/receipt/{receiptToken}
  → Clears token from sessionStorage (prevents seeing stale confirmation on refresh)
  → Displays full order summary
```

---

### Why Use a Receipt Token Instead of the Order ID in the URL?

The `receiptToken` is a random UUID generated server-side and never put in the URL. This means:
- Users can't guess or enumerate other orders by changing the URL.
- The same confirmation page can be shared (e.g., via email) without exposing internal database IDs.

---

### Key State Variables

```typescript
const [orderData, setOrderData] = useState<OrderData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [sendingEmail, setSendingEmail] = useState(false);
const [emailSent, setEmailSent] = useState(false);
```

---

### `handleEmailReceipt()`

When the user clicks "Email Receipt":
1. POSTs `orderData` to `/api/send-receipt`.
2. Sets `emailSent = true` for 5 seconds, then resets it.
3. Shows a success message to the user.

---

### `formatPickupTime(isoString)`

Converts an ISO 8601 datetime string (e.g. `2025-01-15T14:30:00Z`) into a human-readable time like `2:30 PM`.

```typescript
const formatPickupTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
```

---

### The `[orderId]` Variant (Order History)

When viewing a past order from order history at `/order-confirmation/[orderId]`:
- The `orderId` is extracted from the URL params.
- The page fetches from `GET /api/orders/{orderId}`.
- It also **caches the order in sessionStorage** under the key `order-details:{orderId}`.
- If the API fails (e.g., no internet), it falls back to the sessionStorage snapshot so the user can still view their order.

---

### What Gets Displayed

- Order number, date, payment method
- Customer name, email, phone, billing address
- Each item: image, name, quantity, price
- Subtotal, tax, total
- Pickup time
- Button to email the receipt

---

## 3. Text Inputs — Validation, Max Characters & Sanitization

**Key Files:**
- `helpers/checkoutValidation.ts` — shared sanitization and validation functions
- `components/PasswordRequirements.tsx` — visual password checklist
- `app/(auth)/sign-up/actions.ts` — server-side validation for registration
- `app/(auth)/login/actions.ts` — server-side validation for login
- `components/CardholderForm.tsx`, `ContactDetailsForm.tsx`, `BillingAddressForm.tsx` — payment form fields

---

### Email Validation

Email is validated in **two places** for defence in depth:

**Client-side (checkout form):**
```typescript
// helpers/checkoutValidation.ts
export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email address";
  return undefined;
};
```

The regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` means:
- `[^\s@]+` — one or more characters that are not a space or `@`
- `@` — the literal `@` symbol
- `[^\s@]+` — domain name characters
- `\.` — a literal dot
- `[^\s@]+` — the TLD (e.g., `com`, `ca`)

**Server-side (sign-up action):**
```typescript
// app/(auth)/sign-up/actions.ts
if (!email || !email.includes("@") || email.length > 255) {
  return { error: "Please enter a valid email" };
}
```

This acts as a second check even if the client-side was bypassed.

---

### Password Requirements

Password rules are enforced consistently in three places: the visual checklist component, client-side validation, and server-side validation.

**The Rules:**
1. At least **8 characters**
2. At least one **uppercase letter**
3. At least one **number**

**Visual Checklist Component (`components/PasswordRequirements.tsx`):**
```typescript
const requirements = [
  { label: "At least 8 characters",  met: password.length >= 8 },
  { label: "One uppercase letter",   met: /[A-Z]/.test(password) },
  { label: "One number",             met: /[0-9]/.test(password) },
];
```

Each requirement shows in **green** when met and **grey** when not, updating in real time as the user types.

**Server-side validation (`app/(auth)/sign-up/actions.ts`):**
```typescript
if (password.length < 8)      return { error: "Password must be at least 8 characters" };
if (!/[A-Z]/.test(password))  return { error: "Password must contain an uppercase letter" };
if (!/[0-9]/.test(password))  return { error: "Password must contain a number" };
```

> **Note on passwords:** Password fields intentionally have **no character sanitization**. Restricting which characters are allowed in a password actually weakens security. All password fields use `maxLength={128}` to prevent extremely long inputs.

---

### Maximum Character Limits

Every input field has a `maxLength` attribute set. This prevents users from entering more characters than the system can handle and protects against oversized payloads.

**Auth & Account Fields:**

| Field | Max Length | Why |
|---|---|---|
| Email | 254 | RFC 5321 email address maximum |
| Password | 128 | Prevents bcrypt/hashing abuse |
| Confirm password | 128 | Matches password field |

**Payment & Checkout Fields:**

| Field | Max Length | Why |
|---|---|---|
| Cardholder name | 50 | Reasonable name length |
| Email (checkout) | 50 | Contact form constraint |
| Phone number | 20 | International number formats |
| Billing address | 100 | Full street address |
| Promo code | 20 | Code length constraint |

**Other:**

| Field | Max Length |
|---|---|
| Comment / review textarea | 400 characters |
| Order history search | 100 characters |

---

### Input Sanitization

Sanitization **cleans dangerous characters before they reach state or the server**, protecting against XSS and injection attacks.

**Three sanitization functions in `helpers/checkoutValidation.ts`:**

```typescript
// 1. For name fields — only allows letters, spaces, hyphens, apostrophes, periods
export const sanitizeNameInput = (value: string): string =>
  value.replace(/[^a-zA-Z\s\-'.,]/g, "");

// 2. For address fields — allows letters, numbers, and common address punctuation
export const sanitizeAddressInput = (value: string): string =>
  value.replace(/[^a-zA-Z0-9\s\-.,#/]/g, "");

// 3. For general text — strips characters used in injection/XSS attacks
export const stripInjectionChars = (value: string): string =>
  value.replace(/[<>"`;\\]/g, "");
```

**Why those specific characters in `stripInjectionChars`?**

| Character | Threat |
|---|---|
| `<` `>` | HTML tags — used to inject `<script>` or other HTML |
| `"` | Breaks out of HTML attributes: `" onmouseover="alert()"` |
| `` ` `` | Template literal injection in JavaScript |
| `;` | SQL statement terminator: `'; DROP TABLE users; --` |
| `\` | Escape sequence abuse in strings |

**Where each sanitizer is applied:**

| Field | Sanitizer Used |
|---|---|
| Cardholder name | `sanitizeNameInput` |
| Billing address | `sanitizeAddressInput` |
| Checkout email | `stripInjectionChars` |
| Auth emails (login, sign-up, forgot password) | Inline: `.replace(/[<>"`;\\]/g, "")` |
| Comments / reviews | `stripInjectionChars` |
| Promo code | Inline: `.replace(/[^A-Z0-9\-]/g, "")` — only uppercase letters, numbers, hyphens |

**Phone Number Auto-Formatting:**

```typescript
export const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, "");  // strip all non-digits
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};
```

As the user types, the phone number is automatically formatted as `(604) 123-4567`. This also implicitly sanitizes the field by stripping any letters or symbols.

---

### How Error Messages Are Shown

**Server-side errors** (returned from server actions) are displayed in a red alert box at the top of the form:
```tsx
<div role="alert" className="alert alert-error font-heading text-sm">
  {errorMessage}
</div>
```

**Field-level validation errors** are shown directly under the specific input:
```tsx
<p id="email-error" className="mt-1 text-sm text-danger-dark">
  {emailError}
</p>
```

---

## 4. Global CSS & Color System

**File:** `app/globals.css`

---

### How It's Structured

The CSS file has three main sections:

1. **`:root` block** — defines all CSS custom properties (variables) for the entire app
2. **`@theme inline` block** — registers those variables into Tailwind so they become utility classes
3. **Base styles** — applies default colors to `body`, and defines utility classes like `.no-scrollbar`

---

### CSS Custom Properties (Variables)

All colors are defined as CSS variables in `:root`. This means changing one variable changes the color everywhere it's used.

**Brand Colors:**
```css
:root {
  --background: #FFFFFF;
  --foreground: #001219;   /* near-black text */
  --offwhite:   #F2F0EF;
  --accent:     #A30000;   /* primary brand red */
  --secondary:  #850000;   /* darker red (hover state) */
  --active:     #6D0000;   /* darkest red (active/pressed state) */
}
```

**Neutral Scale (10 shades from near-white to near-black):**
```css
--neutral-50:  #F9FAFB;
--neutral-100: #F3F4F6;
--neutral-200: #E5E7EB;
--neutral-300: #D1D5DB;
--neutral-400: #9CA3AF;
--neutral-500: #6B7280;
--neutral-600: #4B5563;
--neutral-700: #374151;
--neutral-800: #1F2937;
--neutral-900: #111827;
```

**Semantic Color Groups:**

| Group | Variables | Hex Values |
|---|---|---|
| Danger/Error | `--danger`, `--danger-dark`, `--danger-subtle`, `--danger-border`, `--danger-text` | Reds: `#EF4444` → `#B91C1C` |
| Info | `--info-muted`, `--info`, `--info-hover`, `--info-dark`, `--info-bg`, `--info-border` | Blues: `#3B82F6` → `#1E40AF` |
| Success | `--success`, `--success-dark`, `--success-subtle`, `--success-indicator` | Greens: `#16A34A` → `#10B981` |
| Warning | `--warning-bg`, `--warning-highlight`, `--warning-text`, `--warning-text-dark` | Ambers: `#FFFBEB` → `#92400E` |
| Misc | `--heart`, `--rating` | Pink `#EC4899`, Amber `#F59E0B` |

---

### Tailwind Integration via `@theme inline`

Without extra configuration, Tailwind doesn't know about custom CSS variables. The `@theme inline` block registers each variable as a Tailwind color:

```css
@theme inline {
  --color-background: var(--background);
  --color-accent:     var(--accent);
  --color-danger:     var(--danger);
  --color-neutral-50: var(--neutral-50);
  /* ...and so on for every variable */
}
```

This generates Tailwind utility classes like:
- `bg-accent` → `background-color: #A30000`
- `text-neutral-600` → `color: #4B5563`
- `border-danger-border` → `border-color: #FECACA`
- `text-success` → `color: #16A34A`

**The benefit:** Every color in the app traces back to one central definition in `globals.css`. To rebrand the app, you change one hex value.

---

### How Colors Are Used in Components

Components **never use raw Tailwind palette names** like `red-600` or `blue-500`. Everything goes through the custom variables. This ensures visual consistency.

**Pattern: Interactive states using the brand red family**
```tsx
// Button using accent → secondary → active for hover/press feedback
<button className="bg-accent hover:bg-secondary active:bg-active text-white">
  Add to Cart
</button>
```

**Pattern: Semantic colors for meaning**
```tsx
// Success = green = cart confirmation
<button className="bg-success text-white">Added!</button>

// Danger = red = destructive action
<button className="text-danger hover:text-danger-dark">Remove</button>

// Info = blue = non-destructive action
<button className="bg-info hover:bg-info-hover">Sign Up</button>
```

**Pattern: Neutral scale for structure**
```tsx
// Borders, backgrounds, muted text all use the neutral scale
<div className="border border-neutral-200 bg-neutral-50">
  <p className="text-neutral-500">Descriptive text</p>
  <p className="text-neutral-900">Primary text</p>
</div>
```

**Pattern: Special purpose colors**
```tsx
// Heart icon for favourites
<HeartIcon className={isFavourite ? "text-heart" : "text-neutral-400"} />

// Star ratings
<StarIcon className="text-rating" />
```

---

## 5. Delete Account

**Files:**
- `app/(protected)/account/page.tsx` — the frontend: button, modal, error handling
- `app/(protected)/account/actions.ts` — the backend: the actual deletion logic

---

### Why a Server Action?

The deletion uses a **Next.js Server Action** — a function that runs exclusively on the server. This is important because:
- The admin credentials (`SUPABASE_SERVICE_ROLE_KEY`) are never exposed to the browser.
- The deletion can't be triggered by manipulating client-side code.
- It runs with elevated privileges that the regular client SDK doesn't have.

---

### Frontend: State Management

```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleteError, setDeleteError]         = useState<string | null>(null);
const [isDeleting, setIsDeleting]           = useState(false);
```

- `showDeleteModal` — controls whether the confirmation dialog is visible
- `deleteError` — holds any error message to display inside the modal
- `isDeleting` — disables buttons while the async deletion is in progress

---

### The Confirmation Modal

When the user clicks "Delete Account":
1. `showDeleteModal` is set to `true`, opening a `<dialog>` element.
2. The modal shows a warning: *"This action is permanent and cannot be undone. Your favourites and cart will be deleted."*
3. Two buttons are shown: **Cancel** and **Yes, Delete My Account**.
4. While deletion is running (`isDeleting = true`), both buttons are disabled and the backdrop click is also disabled — preventing the user from accidentally dismissing or double-clicking.

```tsx
<dialog open={showDeleteModal} className="modal">
  <div className="modal-box">
    <h3>Are you sure?</h3>
    <p>This action is permanent and cannot be undone...</p>

    {deleteError && <div className="alert alert-error">{deleteError}</div>}

    <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
      Cancel
    </button>
    <button onClick={handleDeleteAccount} disabled={isDeleting}>
      Yes, Delete My Account
    </button>
  </div>
</dialog>
```

---

### Frontend: `handleDeleteAccount()`

```typescript
const handleDeleteAccount = async () => {
  setIsDeleting(true);
  setDeleteError(null);

  const result = await deleteAccount();  // calls the server action

  if (result?.error) {
    setDeleteError(result.error);  // show error, let user try again
    setIsDeleting(false);
  }
  // If successful: no UI reset needed — the server redirects to "/"
};
```

If the deletion fails, the error message appears inside the modal and the user can try again. If it succeeds, the server handles the redirect — the component never needs to navigate manually.

---

### Backend: `deleteAccount()` Server Action

```typescript
// app/(protected)/account/actions.ts
export async function deleteAccount(): Promise<{ error: string } | void> {
  // 1. Get the current user from the session
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 2. Create an admin client with elevated privileges
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // server-only secret
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 3. Delete the auth user — cascade handles all linked rows
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) return { error: 'Failed to delete account. Please contact support.' };

  // 4. Sign out and redirect to home page
  await supabase.auth.signOut();
  redirect('/');
}
```

**Step-by-step breakdown:**

| Step | What Happens | Why |
|---|---|---|
| **1. Get user** | Reads the current session to identify who is deleting | Can't delete an account without knowing which one |
| **2. Admin client** | Creates a privileged Supabase client using the service role key | The regular client doesn't have permission to delete auth users |
| **3. Delete user** | Calls `auth.admin.deleteUser(user.id)` | Removes the user from the Supabase `auth.users` table |
| **Cascade** | Database foreign key cascade rules delete all related rows | Favourites, cart items, and order history are cleaned up automatically |
| **4. Sign out** | Calls `signOut()` to invalidate the session | The session token would be invalid anyway, but this ensures cleanup |
| **5. Redirect** | `redirect('/')` sends the user to the home page | The user no longer has an account, so protected pages would fail |

---

### Security Design

- **Service role key is never sent to the browser** — it exists only in server environment variables.
- **Authentication is verified first** — the function checks `getUser()` before doing anything; a non-authenticated call returns an error immediately.
- **Vague error messages** — if deletion fails, the user sees "Please contact support" rather than internal error details. This prevents information leakage.
- **No client-side bypass** — because this is a server action, there's no API endpoint to intercept or manipulate from the browser's network tab.

---

*End of Study Guide*
