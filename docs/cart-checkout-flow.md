# How the Cart & Checkout Flow Works

A complete walkthrough of every file involved in the process — from browsing the menu to paying for an order. Each section shows the actual code and explains what it does in plain language.

---

## The Big Picture

```
Menu Page ──> Item Detail Page ──> Cart Page ──> Checkout Page ──> Order Confirmation
  (browse)      (view & add)       (review)       (pay)             (done!)
```

---

## File 1: `types/index.tsx` — The Data Shapes

Before looking at any pages, it helps to understand the data types that get passed around. This file defines what a menu item and a cart item look like.

**MenuItem** — This is what comes from the Supabase database for every food item:

```ts
export interface MenuItem {
  item_id: string; // unique ID like "abc-123"
  restaurant_id: string; // which restaurant it belongs to
  name: string; // e.g. "gladiator_burger"
  description: string; // what the item is
  price: number; // price in dollars, e.g. 18.00
  category: string; // e.g. "beef_burgers"
  calories: number; // calorie count
  allergy_information: string;
  image_url: string; // link to the food photo
  list_of_ingredients: string[];
}
```

**CartItem** — This extends MenuItem by adding a `quantity` field. So a CartItem is just a MenuItem with a number tracking how many the customer wants:

```ts
export interface CartItem extends MenuItem {
  quantity: number;
}
```

Every file in the system references these two types. `MenuItem` is what the database gives us. `CartItem` is what the cart stores.

---

## File 2: `app/page.tsx` — The Menu Page

**What it does:** This is the home page. It loads all the food items from the database and displays them as a grid of cards, grouped by category (beef burgers, chicken burgers, etc.).

**How it works step by step:**

1. When the page loads, `fetchMenuItems()` runs. This calls Supabase and pulls every row from the `menu_items` table, sorted by category and name:

```ts
const { data } = await supabase
  .from("menu_items")
  .select("*")
  .order("category", { ascending: true })
  .order("name", { ascending: true });
```

2. The items get grouped by category using a helper function `groupByCategory()`. This turns a flat list of items into an object like `{ beef_burgers: [...], chicken_burgers: [...] }`.

3. For each category, the page renders a `CategorySection` component.

**This page does NOT directly have an "Add to Cart" button.** It delegates that to the `MenuItemCard` component inside each `CategorySection`.

---

## File 3: `components/CategorySection.tsx` — Category Grouping

**What it does:** Renders a section heading (like "Beef Burgers") with a description, then displays a grid of `MenuItemCard` components for each item in that category.

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
  {items.map((item) => (
    <MenuItemCard key={item.item_id || item.name} item={item} />
  ))}
</div>
```

This is a simple layout component — it doesn't handle any cart logic itself. It just passes each `MenuItem` down to `MenuItemCard`.

---

## File 4: `components/MenuItemCard.tsx` — The "Add to Cart" Card

**What it does:** Displays a single food item as a card with an image, name, price, description, and an **"Add to Cart"** button. The whole card is also a clickable link to the item detail page.

**The key parts:**

It pulls `addItem` from the cart context so it can add items to the shared cart:

```ts
const { addItem } = useCart();
```

When the customer clicks "Add to Cart", this function runs:

```ts
const handleAddToCart = (e: React.MouseEvent) => {
  e.preventDefault(); // stops the card from navigating to the detail page
  e.stopPropagation(); // stops the click from bubbling up to the <Link>
  setIsAdding(true); // changes button text to "Added!"

  addItem(item, 1); // adds 1 of this item to the cart

  setTimeout(() => {
    setIsAdding(false); // resets button text after 1 second
  }, 1000);
};
```

**Why `e.preventDefault()` and `e.stopPropagation()`?**
The entire card is wrapped in a `<Link>` tag (so clicking the card goes to the item detail page). Without these two lines, clicking "Add to Cart" would also trigger that navigation. These lines say "just add to cart, don't navigate anywhere."

---

## File 5: `app/[item]/page.tsx` — The Item Detail Page

**What it does:** Shows the full details of a single menu item — large image, price, description, calories, ingredients, allergy warnings — plus a quantity picker and an **"Add to Cart"** button.

**How the item loads:**

The `[item]` in the folder name is a dynamic route. If a customer navigates to `/abc-123`, then `itemId` equals `"abc-123"`. The page fetches that specific item from Supabase:

```ts
const { data } = await supabase
  .from("menu_items")
  .select("*")
  .eq("item_id", itemId)
  .single();
```

**How "Add to Cart" works here:**

Unlike the menu page (which always adds 1), this page lets the customer choose a quantity with +/- buttons. The quantity state starts at 1 and can be increased or decreased (minimum 1):

```ts
<button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
<span>{quantity}</span>
<button onClick={() => setQuantity(quantity + 1)}>+</button>
```

When they click "Add to Cart", it sends the item and the chosen quantity to the cart context:

```ts
const handleAddToCart = () => {
  if (!item) return; // safety check — do nothing if item didn't load
  addItem(item, quantity); // add to cart with the selected quantity
};
```

The button also shows the total price dynamically: `Add to Cart - $36.00` (if quantity is 2 and price is $18.00).

---

## File 6: `context/cartContext.tsx` — The Shared Cart (The Brain)

**What it does:** This is the central piece that connects everything. It's a React Context — think of it as a shared shopping bag that every page in the app can read from and write to. When you call `addItem` from the menu page or the item detail page, this is the code that actually runs.

**How it starts up:**

When the app first loads, it checks if there's a saved cart in the browser's localStorage and loads it:

```ts
useEffect(() => {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    setItems(JSON.parse(savedCart));
  }
}, []);
```

**How it saves automatically:**

Every time the `items` array changes (add, remove, quantity change), it saves the updated cart to localStorage:

```ts
useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(items));
}, [items]);
```

This means if the customer refreshes the page or closes the browser, their cart is still there when they come back.

**`addItem` — the most important function:**

```ts
const addItem = (menuItem: MenuItem, quantity: number = 1) => {
  setItems((prevItems) => {
    const existingItem = prevItems.find(
      (item) => item.item_id === menuItem.item_id,
    );

    if (existingItem) {
      // Item already in cart — just increase the quantity
      return prevItems.map((item) =>
        item.item_id === menuItem.item_id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    }

    // Item not in cart — add it as a new entry
    const newCartItem: CartItem = { ...menuItem, quantity };
    return [...prevItems, newCartItem];
  });
};
```

This checks: "Is this item already in the cart?" If yes, it bumps the quantity. If no, it creates a new cart entry. This prevents duplicate entries — clicking "Add to Cart" on the same burger 3 times gives you quantity 3, not 3 separate rows.

**Other cart functions:**

- `removeItem(itemId)` — Filters the item out of the array entirely
- `updateQuantity(itemId, quantity)` — Finds the item and sets its quantity to the new value. If quantity drops to 0 or below, it removes the item instead
- `clearCart()` — Sets items to an empty array
- `getItemCount()` — Adds up all quantities across all items
- `getTotal()` — Multiplies each item's price by its quantity and sums them all up

**How other files access it:**

Any component can call `useCart()` to get access to the cart. This is used by MenuItemCard, the item detail page, the cart page, and the checkout page:

```ts
const { items, addItem, removeItem } = useCart();
```

---

## File 7: `app/cart/page.tsx` — The Cart Page

**What it does:** Shows the customer everything they've added to their cart, lets them adjust quantities or remove items, and has a "Proceed to Checkout" button.

**Guest vs. logged-in users:**

The first thing this page does is check if the user is logged in:

```ts
const { user, loading } = useAuth();
```

- **If logged in:** It fetches the cart from Supabase (the database), so the cart syncs across devices
- **If guest:** It uses the cart context (which reads from localStorage)

```ts
useEffect(() => {
  if (!loading) {
    if (user) {
      fetchCartFromSupabase(); // logged-in: pull from database
    } else {
      setCartItems(guestCartItems); // guest: use localStorage cart
    }
  }
}, [user, loading, guestCartItems]);
```

**Price calculations:**

Whenever `cartItems` changes, the page recalculates the subtotal, tax (13% Ontario rate), and total:

```ts
const calculateTotal = () => {
  const newSubtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const newTax = newSubtotal * 0.13;
  setSubtotal(newSubtotal);
  setTax(newTax);
  setTotal(newSubtotal + newTax);
};
```

**Updating and removing items:**

Every cart operation checks if the user is logged in. If yes, it updates Supabase. If no, it updates the cart context (localStorage). For example, updating quantity:

```ts
const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
  if (newQuantity < 1) {
    await handleRemoveItem(itemId); // quantity 0 = remove item
    return;
  }

  if (user) {
    // Logged in: update in Supabase
    await supabase
      .from("cart")
      .update({ quantity: newQuantity })
      .eq("id", itemId);
    setCartItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  } else {
    // Guest: update via cart context
    updateGuestQuantity(itemId, newQuantity);
  }
};
```

**"Proceed to Checkout" button:**

At the bottom of the order summary, this button navigates to the checkout page. It's disabled when the cart is empty:

```tsx
<button
  disabled={cartItems.length === 0}
  onClick={() => router.push("/checkout")}
>
  Proceed to Checkout
</button>
```

---

## File 8: `app/checkout/page.tsx` — The Checkout Page

**What it does:** Reads the cart items and displays them alongside forms for contact info, payment, and billing. This is where the customer actually pays.

**Reading from the cart:**

The checkout page pulls items from the cart context using `useCart()`:

```ts
const { items } = useCart();
```

**The dollar-to-cents conversion:**

The cart stores prices in dollars (e.g., `price: 18.00`), but the checkout system works in cents (e.g., `1800`). This is a common pattern in payment processing to avoid floating-point rounding errors. The checkout page converts when it reads the cart:

```ts
const cartItems = items.map((item) => ({
  name: item.name,
  quantity: item.quantity,
  priceCents: Math.round(item.price * 100), // $18.00 becomes 1800
  image: item.image_url,
}));
```

**Calculating totals:**

Once converted to cents, the totals are calculated:

```ts
const subtotalCents = cartItems.reduce(
  (sum, item) => sum + item.priceCents * item.quantity,
  0,
);
const discountCents = Math.round(subtotalCents * (promoDiscount / 100));
const totalCents = subtotalCents - discountCents + taxCents;
```

**Building the order details:**

All the customer info and cart data gets bundled into one object that gets sent to Square for payment:

```ts
const orderDetails = {
  customerName,
  customerEmail,
  customerPhone,
  billingAddress,
  billingCountry,
  items: cartItems,
  totalCents,
  pickupTime: getPickupTime(),
};
```

**After successful payment:**

The customer gets redirected to the order confirmation page:

```ts
const handleSuccess = (orderId: string) => {
  router.push(`/order-confirmation/${orderId}`);
};
```

---

## File 9: `components/OrderSummary.tsx` — The Checkout Sidebar

**What it does:** Displays the list of items the customer is buying, the subtotal, any promo discount, and the total due. It appears on the left side of the checkout page.

It receives the cart items (already converted to cents) from the checkout page and displays each one:

```tsx
{
  cartItems.map((item, i) => (
    <div key={i} className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <h3 className="text-gray-900 font-medium">{item.name}</h3>
      <div className="text-gray-900 font-medium">
        {formatCurrency(item.priceCents)}
      </div>
    </div>
  ));
}
```

It also includes a `PromoCodeInput` component that lets customers apply a discount code. If a promo is applied, it shows the discount amount in green.

All prices are formatted using `formatCurrency()` from `helpers/checkoutHelpers.ts`, which converts cents back to a readable format: `1800` becomes `CA$18.00`.

---

## File 10: `helpers/checkoutHelpers.ts` — Price Formatting Utilities

**What it does:** Small helper functions used by the checkout system.

The most important one is `formatCurrency`, which turns cents into a dollar string:

```ts
export const formatCurrency = (cents: number): string => {
  return `CA$${(cents / 100).toFixed(2)}`;
};
```

So `formatCurrency(1800)` returns `"CA$18.00"`.

There's also `generatePickupTime`, which calculates a pickup time 30 minutes from now:

```ts
export const generatePickupTime = (): string => {
  return new Date(Date.now() + 30 * 60000).toISOString();
};
```

---

## File 11: `app/checkout/layout.tsx` — Loading the Square Payment SDK

**What it does:** This layout wraps the checkout page and loads the Square Web Payments SDK — a JavaScript file from Square's servers that provides the secure credit card form.

```tsx
<Script
  src="https://sandbox.web.squarecdn.com/v1/square.js"
  strategy="afterInteractive"
/>
```

- **`sandbox.web.squarecdn.com`** — This is Square's test/development URL. For real payments, you would switch to the production URL (`web.squarecdn.com`)
- **`strategy="afterInteractive"`** — This tells Next.js to load the script after the page becomes interactive. This is important because the script is loaded in a nested layout (not the root layout), so `beforeInteractive` would not work here

---

## File 12: `components/PaymentForm.tsx` — Secure Payment Processing

**What it does:** This component handles the actual credit card input and payment. It's the most security-sensitive part of the app.

**Waiting for Square to load:**

Since the Square SDK loads asynchronously (via `afterInteractive`), the component can't use it immediately. It retries every 500ms until Square is available, up to 20 times (~10 seconds):

```ts
const initializeSquare = async () => {
  if (!window.Square) {
    attempts++;
    if (attempts >= MAX_ATTEMPTS) {
      onError("Payment system failed to load");
      return;
    }
    retryTimeout = setTimeout(initializeSquare, 500); // try again in 500ms
    return;
  }

  // Square is ready — set up the card form
  const payments = window.Square.payments(
    process.env.NEXT_PUBLIC_SQUARE_APP_ID,
    process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
  );

  cardInstance = await payments.card();
  await cardInstance.attach("#card-container"); // renders Square's card input
  setCard(cardInstance);
};
```

**How Square keeps card data safe:**

When `cardInstance.attach("#card-container")` runs, Square renders a secure iframe (a mini webpage inside the page) where the customer types their card number, expiry, and CVV. This input lives entirely in Square's iframe — the card numbers never exist in our code, our page, or our server. This is what makes the app PCI compliant.

**What happens when the customer clicks "Pay":**

```ts
const handlePayment = async () => {
  if (!card) return; // Square isn't ready yet
  setLoading(true);

  // Step 1: Square converts the card info into a secure token
  const tokenResult = await card.tokenize();

  if (tokenResult.status !== "OK") {
    throw new Error(tokenResult.errors?.[0]?.message || "Card error");
  }

  // Step 2: Send the token + order details to our backend API
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceId: tokenResult.token, // the secure token, NOT the card number
      orderDetails: orderDetails, // items, total, customer info
    }),
  });

  const data = await response.json();

  // Step 3: Handle the result
  if (data.success) {
    onSuccess(data.orderId); // redirect to order confirmation
  } else {
    throw new Error(data.error); // show error to customer
  }
};
```

**The three steps in plain English:**

1. Square takes the card info from its secure iframe and converts it into a random token string (like `"cnon:card-nonce-ok"`). Our code never sees the real card number.
2. Our app sends that token plus the order details (items, total, customer name, etc.) to our own backend API at `/api/payments`.
3. The backend uses the token to tell Square "charge this card for this amount." Square either approves or declines. If approved, the customer is redirected to the order confirmation page.

**Cleanup:**

When the customer leaves the checkout page, the component cleans up after itself:

```ts
return () => {
  clearTimeout(retryTimeout); // stop any pending retries
  if (cardInstance) {
    cardInstance.destroy(); // remove Square's iframe
  }
};
```

---

## How Data Flows Through the Entire System

Here's the full journey of a menu item from database to payment:

```
Supabase Database
    │
    │  menu_items table → MenuItem objects (price in dollars: 18.00)
    │
    ▼
Menu Page (app/page.tsx)
    │  fetches all items, groups by category
    │
    ▼
MenuItemCard (components/MenuItemCard.tsx)
    │  displays item, has "Add to Cart" button
    │  calls addItem(item, 1)
    │
    ▼
Cart Context (context/cartContext.tsx)
    │  stores CartItem[] (MenuItem + quantity)
    │  saves to localStorage automatically
    │
    ▼
Cart Page (app/cart/page.tsx)
    │  reads items from context (guest) or Supabase (logged in)
    │  shows subtotal, tax, total in dollars
    │  "Proceed to Checkout" → navigates to /checkout
    │
    ▼
Checkout Page (app/checkout/page.tsx)
    │  reads items from cart context
    │  converts price from dollars to cents (18.00 → 1800)
    │  collects contact info, billing address
    │  passes everything to PaymentForm + OrderSummary
    │
    ├──────────────────────────────────┐
    │                                  │
    ▼                                  ▼
OrderSummary                     PaymentForm
(components/OrderSummary.tsx)    (components/PaymentForm.tsx)
    │                                  │
    │  displays items + totals         │  loads Square SDK
    │  handles promo codes             │  renders secure card input
    │  formats cents → "CA$18.00"      │  tokenizes card on submit
    │                                  │  sends token to /api/payments
    │                                  │
    │                                  ▼
    │                            /api/payments (backend)
    │                                  │
    │                                  │  charges card via Square
    │                                  │
    │                                  ▼
    │                          Order Confirmation Page
    │                          (app/order-confirmation/[orderId])
    │
    └──────────────────────────────────┘
```

---

## Summary of Every File

| File                             | Role             | Key Responsibility                                                                   |
| -------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `types/index.tsx`                | Type definitions | Defines `MenuItem` and `CartItem` shapes used everywhere                             |
| `app/page.tsx`                   | Menu page        | Fetches items from Supabase, renders category sections                               |
| `components/CategorySection.tsx` | Layout           | Groups items under a category heading, renders MenuItemCards                         |
| `components/MenuItemCard.tsx`    | UI + Cart        | Shows item card with "Add to Cart" button, calls `addItem(item, 1)`                  |
| `app/[item]/page.tsx`            | Item detail page | Shows full item info, quantity picker, calls `addItem(item, quantity)`               |
| `context/cartContext.tsx`        | State management | The shared cart — stores items, handles add/remove/update, saves to localStorage     |
| `app/cart/page.tsx`              | Cart review      | Shows cart contents, calculates tax, has "Proceed to Checkout" button                |
| `app/checkout/page.tsx`          | Checkout         | Reads cart, converts dollars to cents, collects customer info, passes to PaymentForm |
| `components/OrderSummary.tsx`    | Checkout sidebar | Displays items and totals on checkout page, handles promo codes                      |
| `helpers/checkoutHelpers.ts`     | Utilities        | `formatCurrency(cents)` and `generatePickupTime()`                                   |
| `app/checkout/layout.tsx`        | Script loader    | Loads the Square Web Payments SDK script                                             |
| `components/PaymentForm.tsx`     | Payment          | Renders Square's secure card form, tokenizes card, sends payment to API              |
