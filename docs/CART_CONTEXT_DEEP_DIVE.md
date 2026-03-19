# Cart Context — Complete Deep Dive

**File:** `context/cartContext.tsx`

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Types & Data Structures](#2-types--data-structures)
3. [State Variables & Refs](#3-state-variables--refs)
4. [Helper Functions](#4-helper-functions)
5. [The useEffect Hooks — In Order](#5-the-useeffect-hooks--in-order)
6. [Core Cart Functions](#6-core-cart-functions)
7. [The Context Provider & useCart Hook](#7-the-context-provider--usecart-hook)
8. [Full Flow Diagrams](#8-full-flow-diagrams)

---

## 1. The Big Picture

The Cart Context is a React **global state manager** for the shopping cart. It wraps the entire app so every component can read and modify cart data without prop drilling.

It has two modes that run in parallel:

| User Type | Where cart is stored | How tabs stay in sync |
|---|---|---|
| **Guest** (not logged in) | `localStorage` in the browser | Browser `storage` events |
| **Authenticated** | Supabase database (`cart_items` table) | Supabase Realtime broadcast |

The context also handles the **transition** between the two: when a guest logs in, their `localStorage` cart is automatically merged into their database cart, then `localStorage` is cleared.

---

## 2. Types & Data Structures

### `CartItemRow` — what comes back from Supabase

```typescript
type CartItemRow = {
  id: string;              // Supabase row UUID
  user_id: string | null;  // the logged-in user's ID
  session_id: string | null; // unused currently (for future anonymous sessions)
  item_id: string;         // the menu item's ID
  restaurant_id: string | null;
  name: string;
  unit_price_cents: number; // price stored as integer cents, e.g. 1299 = $12.99
  quantity: number;
  image_url: string | null;
  currency: string;        // always "CAD"
  location_id: string | null; // which store location this cart belongs to
  created_at: string;
  updated_at: string;
};
```

**Why store price in cents?** Floating point arithmetic is unreliable for money. `$12.99 + $0.01` in JavaScript can produce `$13.000000000002`. Storing as integers (cents) avoids this entirely.

---

### `toCartItem(row)` — the converter function

```typescript
const toCartItem = (row: CartItemRow): CartItem => ({
  item_id: row.item_id,
  restaurant_id: row.restaurant_id || '',
  name: row.name,
  description: '',          // not stored in cart_items table
  price: row.unit_price_cents / 100,  // converts cents back to dollars for display
  category: '',             // not stored in cart_items table
  calories: 0,
  allergy_information: '',
  image_url: row.image_url || '',
  list_of_ingredients: [],
  quantity: row.quantity,
});
```

**Why does it exist?** The database row format doesn't match the `CartItem` type the UI uses. This function is the bridge. Some fields like `description` and `calories` aren't stored in the cart table — they'd only be on the `MenuItem` object when you first add the item.

---

### `toUnitPriceCents(price)`

```typescript
const toUnitPriceCents = (price: number) => Math.round(price * 100);
```

Converts `$12.99` → `1299`. `Math.round()` handles any floating-point drift before storing.

---

## 3. State Variables & Refs

```typescript
const { user, loading } = useAuth();
const { currentLocation, isHydrated } = useLocation();
```

The cart context reads from two other contexts:
- `useAuth()` — tells it whether the user is logged in and who they are.
- `useLocation()` — tells it which store location is selected. Each location has its own cart.

---

```typescript
const [items, setItems] = useState<CartItem[]>([]);
```

The actual cart contents. Every component that calls `useCart()` reads from this array.

---

```typescript
const [lastCartSyncAt, setLastCartSyncAt] = useState<number | null>(null);
```

A timestamp (milliseconds since epoch) of the last time the cart was synced from another tab. Components can use this to trigger UI updates (e.g., a "cart updated" toast).

---

```typescript
const tabInstanceIdRef = useRef(
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
);
```

A **unique ID for this specific browser tab**, generated once when the component mounts. Used to prevent a tab from processing its own broadcast messages (you don't want Tab A to apply updates it just sent).

`crypto.randomUUID()` is the modern browser API. The fallback (`Math.random().toString(36)`) handles older environments.

---

```typescript
const lastSyncedHashRef = useRef('');
```

A hash (JSON string) of the last cart state that was synced. Used to prevent **duplicate updates** — if the incoming cart is identical to what we already have, we skip re-rendering.

---

```typescript
const realtimeChannelRef = useRef<any>(null);
```

Holds a reference to the active Supabase Realtime channel. Stored in a `ref` (not `state`) because changing the channel shouldn't cause a re-render.

---

```typescript
const isRealtimeSyncEnabled = Boolean(user?.id);
```

A boolean exposed to consumers so they can display an indicator like "Live sync active".

---

## 4. Helper Functions

### `getCartHash(cart)`

```typescript
const getCartHash = (cart: CartItem[]) => JSON.stringify(cart);
```

Converts the cart array to a string so two carts can be compared with `===`. If the strings match, the carts are identical.

---

### `applyLocationFilter(query)`

```typescript
const applyLocationFilter = (query) => {
  if (currentLocation?.id) {
    return query.eq('location_id', currentLocation.id);
  }
  return query.is('location_id', null);
};
```

Every Supabase query that touches `cart_items` runs through this function. It adds a `.eq('location_id', ...)` filter so you only ever read/write cart rows for the **currently selected location**.

Without this, adding items at Location A might show up in Location B's cart.

---

### `fetchUserCart()`

```typescript
const fetchUserCart = async () => {
  if (!user) { setItems([]); return; }

  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id);

  query = applyLocationFilter(query);
  const { data, error } = await query;

  setItems((data || []).map((row) => toCartItem(row as CartItemRow)));
};
```

Fetches all cart rows from Supabase for this user + location, converts each row with `toCartItem()`, and sets them as the new state. Called on login, on location change, and as an error recovery fallback if a mutation fails.

---

### `mergeGuestCartToUserCart()`

Called once when a user logs in. Reads the guest cart from `localStorage` and upserts each item into Supabase:

```
For each guest item:
  → Check if this item_id already exists in the user's database cart
     → YES: UPDATE quantity = existing.quantity + guest.quantity
     → NO:  INSERT new row
→ Clear localStorage
```

This way, if a logged-in user had 1 burger saved, and the guest cart had 2 burgers, after merging they'll have 3 burgers — items are never silently lost.

---

## 5. The useEffect Hooks — In Order

There are **6 useEffect hooks**. Here's what each one does and why it exists.

---

### Hook 1 — Initial Cart Load

```typescript
useEffect(() => {
  const loadCart = async () => {
    if (!isHydrated || loading) return; // wait for auth + location to be ready

    if (user) {
      await fetchUserCart(); // logged in → fetch from database
      return;
    }

    // guest → read from localStorage
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) setItems(JSON.parse(savedCart));
    else setItems([]);
  };
  void loadCart();
}, [user, currentLocation?.id, isHydrated, loading]);
```

**Why it's here:** When the page first loads, the cart needs to be populated. This waits until both the auth system (`loading = false`) and the location context (`isHydrated = true`) are ready before doing anything. Re-runs if the user logs in/out or changes location.

---

### Hook 2 — Merge Guest Cart on Login

```typescript
useEffect(() => {
  if (!isHydrated || loading || !user) return;

  const mergeThenFetch = async () => {
    await mergeGuestCartToUserCart();
    await fetchUserCart();
  };
  void mergeThenFetch();
}, [user?.id, currentLocation?.id, isHydrated, loading]);
```

**Why it's here:** Specifically triggered when `user?.id` appears (login event). It merges the guest cart first, then fetches the now-complete database cart.

---

### Hook 3 — Sync Location to Cart Rows

```typescript
useEffect(() => {
  if (!user || !currentLocation?.id || loading) return;

  const syncLocation = async () => {
    await supabase
      .from('cart_items')
      .update({ location_id: currentLocation.id })
      .eq('user_id', user.id);
  };
  void syncLocation();
}, [user, currentLocation?.id, loading]);
```

**Why it's here:** When the selected location changes, all existing cart rows need their `location_id` updated in Supabase. Without this, switching locations would orphan the rows under the old `location_id` and the cart would appear empty.

---

### Hook 4 — Persist Guest Cart to localStorage

```typescript
useEffect(() => {
  if (user) return; // logged-in users use Supabase, not localStorage

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}, [items, user]);
```

**Why it's here:** Runs every time `items` changes (for guests only). This is what makes the guest cart survive page refreshes — every mutation immediately writes to `localStorage`.

---

### Hook 5 — Cross-Tab Sync for Guests (localStorage events)

```typescript
useEffect(() => {
  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== cartStorageKey || !event.newValue) return;

    const incomingItems = JSON.parse(event.newValue) as CartItem[];
    const incomingHash = getCartHash(incomingItems);
    if (incomingHash === lastSyncedHashRef.current) return; // skip if same

    lastSyncedHashRef.current = incomingHash;
    setItems(incomingItems);
    setLastCartSyncAt(Date.now());
  };

  window.addEventListener('storage', onStorageChange);
  return () => window.removeEventListener('storage', onStorageChange);
}, []);
```

**Why it's here:** The browser fires a `storage` event on all **other** open tabs (not the one that wrote) whenever `localStorage` changes. This hook listens for that event and updates the cart state in the other tabs. Without it, opening PickMeUp in two windows as a guest would show different cart states.

The hash check prevents unnecessary re-renders if the data is already the same.

---

### Hook 6 — Cross-Tab Sync for Auth Users (Supabase Realtime)

```typescript
useEffect(() => {
  if (!user?.id) return;

  const channel = supabase
    .channel(`cart-sync:${user.id}`)
    .on('broadcast', { event: 'cart-updated' }, ({ payload }) => {
      const incoming = payload as { sourceId?: string; items?: CartItem[] };
      if (!incoming?.items) return;
      if (incoming.sourceId === tabInstanceIdRef.current) return; // ignore own messages

      const incomingHash = getCartHash(incoming.items);
      if (incomingHash === lastSyncedHashRef.current) return;

      lastSyncedHashRef.current = incomingHash;
      setItems(incoming.items);
      setLastCartSyncAt(Date.now());
    })
    .subscribe();

  realtimeChannelRef.current = channel;

  return () => {
    realtimeChannelRef.current = null;
    void supabase.removeChannel(channel);
  };
}, [user?.id]);
```

**Why it's here:** Logged-in users need cross-tab sync too, but `localStorage` events don't fire in the same tab (and authenticated users don't use `localStorage` for their cart). Supabase Realtime provides a **broadcast channel** — a WebSocket where all tabs subscribed to the same channel receive messages from each other.

The channel name is `cart-sync:{userId}` so only the same user's tabs share a channel.

The `sourceId` check is critical: without it, Tab A would send a broadcast and then immediately receive it back and re-set its own state unnecessarily.

The `return` cleanup function unsubscribes from the channel when the user logs out or the component unmounts, preventing memory leaks.

---

### Hook (inline) — Broadcast Cart Changes

```typescript
useEffect(() => {
  const currentHash = getCartHash(items);
  if (currentHash === lastSyncedHashRef.current) return; // skip if no real change

  lastSyncedHashRef.current = currentHash;
  if (!user?.id || !realtimeChannelRef.current) return;

  void realtimeChannelRef.current.send({
    type: 'broadcast',
    event: 'cart-updated',
    payload: {
      sourceId: tabInstanceIdRef.current,
      items,
    },
  });
}, [items, user?.id]);
```

**Why it's here:** This is the **sender** side of Realtime sync. Whenever `items` changes for an authenticated user, this sends the updated cart to all other tabs via the Realtime channel. The hash check prevents re-broadcasting a cart that was just received from another tab (which would create an infinite loop).

---

## 6. Core Cart Functions

### `addItem(menuItem, quantity = 1)`

**What it does:** Adds an item to the cart. If it's already there, increments the quantity instead.

**Auth path:**
1. Check if `menuItem.item_id` already exists in `items` state.
2. If YES → `setItems(...)` updating the quantity, then call Supabase `.update()`.
3. If NO → `setItems(...)` adding the new item, then call Supabase `.insert()`.
4. If either Supabase call fails → call `fetchUserCart()` to revert state to what the DB actually has.

**Guest path:**
1. Uses a functional `setItems` update (reads previous state safely).
2. If item exists → increment quantity in state.
3. If not → append new item to state.
4. Hook 4 automatically persists the new state to `localStorage`.

**Why the optimistic update pattern?** State is updated immediately before the Supabase call completes. This makes the UI feel instant. If the DB call fails, state is rolled back by re-fetching.

---

### `removeItem(itemId)`

**What it does:** Removes an item entirely from the cart, regardless of quantity.

**Auth path:**
1. `setItems(prevItems => prevItems.filter(item => item.item_id !== itemId))` — removes from UI immediately.
2. Calls Supabase `.delete()` with `user_id` + `item_id` + location filter.
3. On error → `fetchUserCart()` to recover.

**Guest path:**
1. Same `filter()` call, but no Supabase call — Hook 4 writes to `localStorage`.

---

### `updateQuantity(itemId, quantity)`

**What it does:** Sets the quantity of a specific item to an exact number.

```typescript
if (quantity <= 0) {
  removeItem(itemId); // auto-remove rather than showing quantity 0
  return;
}
```

This guard means decrementing to 0 cleanly removes the item rather than leaving a ghost entry.

**Auth path:** `setItems(...)` mapping over items to update the matching one, then Supabase `.update({ quantity })`.

**Guest path:** Same map, localStorage handles persistence.

---

### `clearCart()`

**What it does:** Removes all items at once. Called after successful checkout.

**Auth path:**
1. `setItems([])` immediately.
2. Supabase `.delete().eq('user_id', user.id)` with location filter removes all rows.

**Guest path:**
1. `setItems([])`.
2. Hook 4 writes the empty array to `localStorage`.

---

### `swapItemsToNewLocation(swaps)`

**What it does:** Replaces cart items with their equivalent items at a new location.

```typescript
const swapItemsToNewLocation = (swaps: Array<{ oldItemId: string; newItem: MenuItem }>) => {
  setItems((prevItems) =>
    prevItems.map((cartItem) => {
      const swap = swaps.find((s) => s.oldItemId === cartItem.item_id);
      if (swap) {
        return { ...swap.newItem, quantity: cartItem.quantity }; // new item, same quantity
      }
      return cartItem; // no swap found, keep as-is
    })
  );
};
```

**Why it's needed:** Different locations may have different `item_id` values for what is conceptually the same menu item. When a user switches their pickup location, the caller provides a mapping of `{ oldItemId → newItem }` and this function applies those swaps while preserving quantities.

---

### `getItemCount()`

```typescript
const getItemCount = () =>
  items.reduce((total, item) => total + item.quantity, 0);
```

Returns the total number of individual items (e.g., 3 burgers + 2 fries = 5). Used for the number badge on the cart icon in the navbar.

---

### `getTotal()`

```typescript
const getTotal = () =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);
```

Returns the subtotal in dollars. Used by the order summary and checkout page.

---

## 7. The Context Provider & useCart Hook

### The Provider

```typescript
return (
  <CartContext.Provider
    value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getTotal,
      lastCartSyncAt,
      isRealtimeSyncEnabled,
      swapItemsToNewLocation,
    }}
  >
    {children}
  </CartContext.Provider>
);
```

`CartProvider` wraps the app (in `layout.tsx`). Everything inside `{children}` can call `useCart()` to access any of these values and functions.

---

### `useCart()` Hook

```typescript
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
```

A custom hook that reads the context. The `undefined` check is a developer safety net — if you accidentally call `useCart()` in a component that isn't inside `<CartProvider>`, you get a clear error message instead of a cryptic null reference.

Usage in any component:
```typescript
const { items, addItem, getTotal } = useCart();
```

---

## 8. Full Flow Diagrams

### Guest adds an item to cart

```
User clicks "Add to Cart"
  → addItem(menuItem) called
  → user is null (guest)
  → setItems(prev => [...prev, newItem]) — state updates
  → React re-renders NavBar badge, cart sidebar
  → Hook 4 fires: localStorage.setItem('cart', JSON.stringify(items))
  → Other open tabs receive 'storage' event
  → Hook 5 in other tabs: setItems(incomingItems)
```

---

### Authenticated user adds an item to cart

```
User clicks "Add to Cart"
  → addItem(menuItem) called
  → user exists
  → setItems(...) — optimistic UI update, instant feedback
  → Supabase .insert() or .update() called
     → Success: DB and state are in sync
     → Failure: fetchUserCart() called to revert to DB truth
  → Hook (broadcast) fires: sends {sourceId, items} to cart-sync:{userId} channel
  → Hook 6 in other tabs: receives broadcast
     → sourceId check: is it from me? → skip
     → is it identical? → skip
     → Otherwise: setItems(incoming.items)
```

---

### Guest logs in

```
Auth state changes → user?.id appears
  → Hook 2 fires: mergeThenFetch()
     1. mergeGuestCartToUserCart()
        → Reads localStorage
        → For each item: SELECT existing row from cart_items
           → Exists: UPDATE quantity += guest.quantity
           → New: INSERT row
        → localStorage.removeItem('cart')
     2. fetchUserCart()
        → SELECT * from cart_items WHERE user_id = ...
        → setItems(data.map(toCartItem))
  → Guest cart is now in DB, localStorage is clean
```

---

### User changes pickup location

```
currentLocation.id changes
  → Hook 1 fires: fetchUserCart() — loads cart for new location
  → Hook 3 fires: UPDATE cart_items SET location_id = newId WHERE user_id = ...
  → If no items exist at new location, cart appears empty
  → If swapItemsToNewLocation() was called first, items carry over
```
