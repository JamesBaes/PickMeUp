# Cart & Checkout System Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                  │
│                                                                         │
│   Menu Page ───────> Item Detail Page                                   │
│   (app/page.tsx)     (app/[item]/page.tsx)                              │
│       │                     │                                           │
│       │ "Add to Cart"       │ "Add to Cart"                             │
│       │ (qty: 1)            │ (qty: user picks)                         │
│       │                     │                                           │
│       └─────────┬───────────┘                                           │
│                 │                                                       │
│                 ▼                                                       │
│          Cart Context                                                   │
│    (context/cartContext.tsx)                                             │
│                 │                                                       │
│                 ▼                                                       │
│           Cart Page ──────────> Checkout Page ──────> Order Confirmation │
│        (app/cart/page.tsx)   (app/checkout/page.tsx)                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cart Context — The Shared Shopping Bag

```
┌──────────────────────────────────────────────────────────┐
│                    CartContext                            │
│               (context/cartContext.tsx)                   │
│                                                          │
│   State: items[] ─────────────────────────────────┐      │
│                                                   │      │
│   Functions:                                      │      │
│   ├── addItem(item, qty)    Add or increase qty   │      │
│   ├── removeItem(id)        Remove from cart      │      │
│   ├── updateQuantity(id, qty)                     │      │
│   ├── clearCart()            Empty everything      │      │
│   ├── getItemCount()         Total items          │      │
│   └── getTotal()             Total price ($)      │      │
│                                                   │      │
│   Persistence:                                    ▼      │
│   ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│   │ localStorage │◄──►│  items[]     │◄──►│  Supabase  │  │
│   │  (guests)    │    │  (in memory) │    │  (users)   │  │
│   └─────────────┘    └──────────────┘    └────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘

        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐      ┌──────────────┐      ┌───────────┐
   │  Menu    │      │  Item Detail │      │   Cart    │
   │  Page    │      │    Page      │      │   Page    │
   └─────────┘      └──────────────┘      └───────────┘
   All pages can read from and write to the cart context
```

## Adding an Item to Cart

```
  User clicks "Add to Cart"
           │
           ▼
  ┌──────────────────────────────┐
  │  Is item already in cart?    │
  └──────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
    YES          NO
     │           │
     ▼           ▼
  ┌────────┐  ┌──────────────┐
  │ Update │  │ Add new item │
  │ qty +1 │  │ with qty = 1 │
  └────────┘  └──────────────┘
     │           │
     └─────┬─────┘
           │
           ▼
  ┌──────────────────────────────┐
  │  Save to localStorage       │
  │  (auto via useEffect)       │
  └──────────────────────────────┘
```

## Cart Page to Checkout

```
  ┌─────────────────────────────────────────────────────────┐
  │                    Cart Page                             │
  │                                                         │
  │  ┌─────────────────────┐  ┌──────────────────────────┐  │
  │  │    Item List         │  │    Order Summary          │  │
  │  │                      │  │                           │  │
  │  │  Item 1  qty [+-]  X │  │  Subtotal:    $XX.XX      │  │
  │  │  Item 2  qty [+-]  X │  │  Tax (13%):   $XX.XX      │  │
  │  │  Item 3  qty [+-]  X │  │  ─────────────────────    │  │
  │  │                      │  │  Total:       $XX.XX      │  │
  │  │                      │  │                           │  │
  │  │                      │  │  [Proceed to Checkout] ───┼──┼──> /checkout
  │  └─────────────────────┘  └──────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
```

## Checkout & Payment Flow

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                      Checkout Page                               │
  │                                                                  │
  │  Cart Context ──> items[] ──> convert price to cents             │
  │                   price: 18.00  ──>  priceCents: 1800            │
  │                                                                  │
  │  ┌────────────────────┐    ┌──────────────────────────────────┐  │
  │  │   Order Summary    │    │   Payment Form                   │  │
  │  │                    │    │                                   │  │
  │  │  Item 1   $18.00   │    │  Contact: email, phone            │  │
  │  │  Item 2   $18.00   │    │                                   │  │
  │  │  ──────────────    │    │  Card Info (Square iframe)        │  │
  │  │  Subtotal  $36.00  │    │  ┌─────────────────────────────┐  │  │
  │  │  Promo     -$1.80  │    │  │  Card Number: ****          │  │  │
  │  │  Total     $34.20  │    │  │  Exp: MM/YY    CVV: ***     │  │  │
  │  │                    │    │  └─────────────────────────────┘  │  │
  │  └────────────────────┘    │         (secure — never           │  │
  │                            │          touches our code)        │  │
  │                            │                                   │  │
  │                            │  Cardholder name                  │  │
  │                            │  Billing address                  │  │
  │                            │                                   │  │
  │                            │  [Pay $34.20]                     │  │
  │                            └──────────────┬───────────────────┘  │
  └───────────────────────────────────────────┼──────────────────────┘
                                              │
                                              ▼
```

## Square Payment Processing

```
  User clicks "Pay"
         │
         ▼
  ┌─────────────────────┐
  │  Square tokenizes    │   Card info stays in Square's iframe.
  │  the card info       │   We only get a random token string.
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐         ┌─────────────────────┐
  │  Our API             │ ──────> │  Square's servers    │
  │  /api/payments       │         │  (charges the card)  │
  │                      │ <────── │                      │
  │  Sends:              │         │  Returns:            │
  │  - token             │         │  - success/fail      │
  │  - order details     │         │  - order ID          │
  └──────────┬──────────┘         └─────────────────────┘
             │
       ┌─────┴─────┐
       │           │
    SUCCESS      FAIL
       │           │
       ▼           ▼
  ┌──────────┐  ┌──────────────┐
  │ Redirect │  │ Show error   │
  │ to order │  │ message      │
  │ confirm  │  │              │
  └──────────┘  └──────────────┘
```

## Square SDK Loading

```
  Checkout page loads
         │
         ▼
  ┌──────────────────────────────────┐
  │  checkout/layout.tsx loads       │
  │  Square SDK script               │
  │  (strategy: afterInteractive)    │
  └──────────────┬───────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────┐
  │  PaymentForm useEffect runs      │
  │                                  │
  │  window.Square ready? ───> NO ───┼──> wait 500ms, retry
  │         │                        │    (up to 20 attempts)
  │        YES                       │
  │         │                        │
  │         ▼                        │
  │  Initialize card form            │
  │  Attach to #card-container       │
  └──────────────────────────────────┘
```

## Data Flow Summary

```
  MenuItem (from Supabase DB)
    │
    │  price: 18.00 (dollars)
    │  image_url: "https://..."
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
  CartContext                         Checkout Page
  (stores as-is)                      (converts to cents)
    │                                      │
    │  item.price = 18.00                  │  priceCents = 1800
    │  item.image_url = "..."              │  image = "..."
    │                                      │
    ▼                                      ▼
  Cart Page                           OrderSummary
  (displays in $)                     (displays via formatCurrency)
  $18.00                              CA$18.00
```
