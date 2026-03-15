# Changelog — Add to Cart Quantity Controls & Feedback

## Session: March 2026

---

### Files Modified

| File | Change Summary |
|------|---------------|
| `components/MenuItemCard.tsx` | Added quantity controls, wired up quantity to cart, replaced add-to-cart button with green feedback on success |
| `app/[item]/page.tsx` | Removed top banner notification, replaced add-to-cart button with green feedback on success |

---

### 1. `components/MenuItemCard.tsx`

#### Quantity State (already existed, now wired up)

`quantity` and `showSuccess` were already declared as state variables but were unused. They are now fully wired up:

```ts
const [quantity, setQuantity] = useState(1);
const [showSuccess, setShowSuccess] = useState(false);
```

#### `handleAddToCart` — updated to use quantity and trigger feedback

```ts
const handleAddToCart = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsAdding(true);
  addItem(item, quantity);           // now uses selected quantity instead of hardcoded 1
  posthog.capture("add_to_cart", { ..., quantity });

  setShowSuccess(true);
  setTimeout(() => {
    setIsAdding(false);
    setShowSuccess(false);
    setQuantity(1);                  // resets quantity back to 1 after 1.5s
  }, 1500);
};
```

#### Two new handler functions added

These are separate from the main click handler so that `e.preventDefault()` and `e.stopPropagation()` can be called without navigating away via the parent `<Link>`:

```ts
const handleDecrement = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setQuantity((q) => Math.max(1, q - 1));   // floors at 1
};

const handleIncrement = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setQuantity((q) => q + 1);
};
```

#### JSX — Quantity controls added

A row of `-`, quantity number, and `+` buttons added to the left side of the card footer:

```tsx
<div className="flex items-center gap-1">
  <button onClick={handleDecrement} disabled={quantity === 1 || isAdding} ...>-</button>
  <span>{quantity}</span>
  <button onClick={handleIncrement} disabled={isAdding} ...>+</button>
</div>
```

- The `-` button is disabled when `quantity === 1` (can't go below 1) or while `isAdding` is true
- Both buttons are sized `btn-xs` to stay compact on the card

#### JSX — Add to Cart button replaced with conditional feedback

Instead of always showing the "Add to Cart" button, the button is swapped out for a green "Added!" display while `showSuccess` is true:

```tsx
{showSuccess ? (
  <div className="btn ... bg-green-600 pointer-events-none">
    <p className="font-heading text-white">Added!</p>
  </div>
) : (
  <button onClick={handleAddToCart} ...>
    <p className="font-heading text-white">Add to Cart</p>
  </button>
)}
```

- `pointer-events-none` on the feedback div prevents any clicks during the success state
- After 1.5 seconds the button returns to normal and quantity resets to 1

---

### 2. `app/[item]/page.tsx`

#### Removed top banner notification

The green banner that appeared above the back button was removed:

```tsx
// REMOVED:
{showNotification && (
  <div className="w-full rounded-lg bg-green-600/75 ...">
    Added to cart!
  </div>
)}
```

#### Add to Cart button replaced with conditional feedback

Same pattern applied as in `MenuItemCard` — the button swaps to a green "Added to cart!" state for 2 seconds when clicked:

```tsx
{showNotification ? (
  <div className="btn btn-lg flex-1 bg-green-600 border-0 pointer-events-none">
    <p className="font-heading text-white">Added to cart!</p>
  </div>
) : (
  <button onClick={handleAddToCart} className="btn btn-lg flex-1 bg-accent ...">
    <p className="font-heading text-white">
      Add to Cart - ${(item.price * quantity).toFixed(2)}
    </p>
  </button>
)}
```

- The existing `showNotification` state and `setTimeout` in `handleAddToCart` were kept as-is — only the JSX presentation changed
- The price total in the button label is preserved and still updates with quantity
