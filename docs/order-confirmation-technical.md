# Order Confirmation - Technical Deep Dive

**Date:** 2026-02-19
**Audience:** Developers
**Purpose:** Detailed code explanation and architecture

---

## 📁 File Structure

```
app/
├── checkout/
│   └── page.tsx                    # Checkout form & payment
├── order-confirmation/
│   └── [orderId]/
│       └── page.tsx                # Order confirmation display
└── api/
    ├── payments/
    │   └── route.ts                # Payment processing & order creation
    ├── orders/
    │   └── [orderId]/
    │       └── route.ts            # Order data retrieval
    └── send-receipt/
        └── route.ts                # Email receipt sending

components/
├── PaymentForm.tsx                 # Square payment integration
├── OrderSummary.tsx                # Order summary card
├── ContactDetailsForm.tsx          # Email & phone inputs
├── CardholderForm.tsx              # Cardholder name input
└── BillingAddressForm.tsx          # Billing address inputs
```

---

## 🏗️ Architecture Overview

### Component Hierarchy

```
CheckoutPage
├── OrderSummary
│   └── PromoCodeInput
├── ContactDetailsForm
├── PaymentForm (forwardRef)
└── CardholderForm
└── BillingAddressForm

OrderConfirmationPage
├── (Thank you section)
├── (Pickup time display)
├── (Payment Summary card)
└── (Order Summary card)
```

### Data Flow Architecture

```
┌─────────────────┐
│  Checkout Page  │
│   (Client)      │
└────────┬────────┘
         │ orderDetails
         ↓
┌─────────────────┐
│  PaymentForm    │
│   (Client)      │
└────────┬────────┘
         │ Square.tokenize()
         ↓
┌─────────────────┐
│  Payment API    │
│   (Server)      │
├─────────────────┤
│ 1. Square API   │
│ 2. Supabase     │
└────────┬────────┘
         │ orderId
         ↓
┌─────────────────┐
│ Confirmation    │
│     Page        │
│   (Client)      │
└────────┬────────┘
         │ GET request
         ↓
┌─────────────────┐
│   Orders API    │
│   (Server)      │
└────────┬────────┘
         │ order data
         ↓
┌─────────────────┐
│    Display      │
└─────────────────┘
```

---

## 💻 Code Deep Dive

### 1. Checkout Page (`app/checkout/page.tsx`)

#### State Management

```typescript
// Form state - tracks all customer input
const [customerEmail, setCustomerEmail] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [customerName, setCustomerName] = useState("");
const [billingCountry, setBillingCountry] = useState("Canada");
const [billingAddress, setBillingAddress] = useState("");

// Payment state - tracks payment process
const [isProcessing, setIsProcessing] = useState(false);
const [isPaymentReady, setIsPaymentReady] = useState(false);
const [error, setError] = useState<string | null>(null);

// Refs - stable references for child components
const paymentFormRef = useRef<PaymentFormHandle>(null);
```

**Why this structure?**

- Individual state for each field allows granular control
- Payment state prevents duplicate submissions
- Refs avoid re-rendering PaymentForm unnecessarily

#### useCallback Optimization

```typescript
const handleSuccess = useCallback(
  (orderId: string) => {
    router.push(`/order-confirmation/${orderId}`);
  },
  [router],
);

const handleError = useCallback((errorMessage: string) => {
  setError(errorMessage);
  setIsProcessing(false);
}, []);
```

**Purpose:**

- `useCallback` creates stable function references
- Prevents PaymentForm from re-initializing Square card
- Dependencies array `[router]` ensures updates if router changes
- Empty `[]` means function never changes

**Without useCallback:**

- Every state change creates new function
- PaymentForm sees new `onError` prop
- Square card instance destroyed & recreated
- User's card input gets cleared ❌

#### Order Details Construction

```typescript
const orderDetails = {
  customerName,
  customerEmail,
  customerPhone,
  billingAddress,
  billingCountry,
  items: cartItems, // Already converted to cents format
  totalCents,
  pickupTime: getPickupTime(),
};
```

**Data transformation:**

```typescript
// Cart context items are in dollars
items: [{ price: 17.99, quantity: 1 }];

// Converted to cents for checkout
cartItems: [{ priceCents: 1799, quantity: 1 }];

// Why? Payment APIs use smallest currency unit (cents)
// Avoids floating point precision errors
```

#### Payment Trigger

```typescript
const handlePayButtonClick = async () => {
  if (!paymentFormRef.current) return;

  setError(null);
  setIsProcessing(true);

  try {
    await paymentFormRef.current.processPayment();
    // Success handled by handleSuccess callback
  } catch (err) {
    // Error handled by handleError callback
    setIsProcessing(false);
  }
};
```

**Flow:**

1. Check if PaymentForm is ready (ref exists)
2. Clear any previous errors
3. Set processing state (disables button)
4. Call PaymentForm's exposed method via ref
5. Callbacks handle success/error

---

### 2. PaymentForm Component (`components/PaymentForm.tsx`)

#### forwardRef & useImperativeHandle Pattern

```typescript
export interface PaymentFormHandle {
  processPayment: () => Promise<void>;
  isReady: boolean;
}

const PaymentForm = forwardRef<PaymentFormHandle, PaymentFormProps>(
  ({ orderDetails, onSuccess, onError, onReadyChange }, ref) => {
    useImperativeHandle(ref, () => ({
      processPayment: handlePayment,
      isReady: card !== null && !loading,
    }));

    // ... rest of component
  },
);
```

**Why this pattern?**

- Parent can call `processPayment()` via ref
- Avoids passing payment logic as props
- Keeps payment form self-contained
- Parent controls when payment happens

**Without this:**

```typescript
// ❌ Bad: Payment logic in parent
<PaymentForm onPaymentSubmit={handlePayment} />

// ✅ Good: Payment logic in PaymentForm
paymentFormRef.current.processPayment()
```

#### Square Card Initialization

```typescript
const cardInstanceRef = useRef<any>(null);

useEffect(() => {
  let isMounted = true;

  const initializeSquare = async () => {
    if (!window.Square) {
      // Retry logic for script loading
      retryTimeout = setTimeout(initializeSquare, 500);
      return;
    }

    const payments = window.Square.payments(
      process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    );

    const newCardInstance = await payments.card();

    if (!isMounted) {
      newCardInstance.destroy();
      return;
    }

    await newCardInstance.attach("#card-container");
    cardInstanceRef.current = newCardInstance;
    setCard(newCardInstance);
  };

  initializeSquare();

  return () => {
    isMounted = false;
    if (cardInstanceRef.current) {
      cardInstanceRef.current.destroy();
      cardInstanceRef.current = null;
    }
  };
}, []);
```

**Key mechanisms:**

1. **isMounted Flag**
   - Prevents state updates after unmount
   - Destroys card if component unmounted during init
   - Avoids memory leaks

2. **cardInstanceRef**
   - Persists card instance across renders
   - Cleanup function can access it reliably
   - Prevents duplicate card inputs

3. **Empty dependency array []**
   - Initialize only once on mount
   - Never reinitialize unless component unmounts
   - Critical for preventing duplicate card fields

4. **Cleanup function**
   - Runs when component unmounts
   - Destroys Square card instance
   - Clears ref to prevent memory leaks

#### Payment Processing

```typescript
const handlePayment = async () => {
  if (!card) return;

  setLoading(true);

  try {
    // 1. Tokenize card (PCI compliant)
    const tokenResult = await card.tokenize();

    if (tokenResult.status !== "OK") {
      throw new Error(tokenResult.errors?.[0]?.message || "Card error");
    }

    // 2. Send token to backend
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: tokenResult.token, // Secure token, not card number
        orderDetails: orderDetails,
      }),
    });

    const data = await response.json();

    // 3. Handle response
    if (data.success) {
      onSuccessRef.current(data.orderId);
    } else {
      throw new Error(data.error);
    }
  } catch (error: any) {
    onErrorRef.current(error.message || "Payment failed");
  } finally {
    setLoading(false);
  }
};
```

**Security note:**

- Actual card data NEVER leaves Square's iframe
- Only secure token is sent to backend
- PCI compliance maintained

---

### 3. Payment API (`app/api/payments/route.ts`)

#### Request Handler

```typescript
export async function POST(request: NextRequest) {
  const { sourceId, orderDetails } = await request.json();

  // Validation
  if (!sourceId) {
    return NextResponse.json(
      { success: false, error: "Missing payment token" },
      { status: 400 }
    );
  }
```

**Why validate here?**

- Frontend validation can be bypassed
- Backend is the security boundary
- Prevents malformed requests reaching Square/Supabase

#### Square Payment Processing

```typescript
const { payments } = getSquareClient();

const response = await payments.create({
  sourceId: sourceId,
  idempotencyKey: randomUUID(),
  amountMoney: {
    amount: BigInt(orderDetails.totalCents),
    currency: "CAD",
  },
});

const payment = response.payment || response;
```

**Key points:**

1. **Idempotency Key**
   - Prevents duplicate charges
   - Same key = same transaction
   - Critical for retry scenarios

2. **BigInt for amount**
   - Square requires BigInt for amounts
   - Handles large numbers safely
   - Type-safe in Square SDK

3. **Currency: CAD**
   - Canadian dollars
   - Must match Square account currency

#### Database Insert

```typescript
const { data: order, error: dbError } = await supabase
  .from("orders")
  .insert({
    customer_name: orderDetails.customerName,
    customer_email: orderDetails.customerEmail,
    customer_phone: orderDetails.customerPhone,
    billing_address: orderDetails.billingAddress,
    billing_country: orderDetails.billingCountry,
    items: orderDetails.items,
    total_cents: orderDetails.totalCents,
    square_payment_id: payment.id,
    status: "paid",
    pickup_time: orderDetails.pickupTime,
  })
  .select()
  .single();
```

**Why .select().single()?**

- `.insert()` alone doesn't return the row
- `.select()` returns inserted row
- `.single()` expects exactly one row
- We need the auto-generated `id` field

#### Success Response

```typescript
return NextResponse.json({
  success: true,
  orderId: order.id,
  paymentId: payment.id,
});
```

**orderId is critical:**

- Frontend redirects to `/order-confirmation/${orderId}`
- Used to fetch order later
- Links payment to order record

---

### 4. Order Confirmation Page (`app/order-confirmation/[orderId]/page.tsx`)

#### Dynamic Route Parameter

```typescript
export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  // orderId comes from URL: /order-confirmation/123
  // params.orderId = "123"
}
```

**Next.js 15 note:**

- `params` is now a Promise in server components
- Client components get it synchronously
- Type assertion needed for TypeScript

#### Data Fetching

```typescript
useEffect(() => {
  const fetchOrderData = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }

      const data = await response.json();
      setOrderData(data);
    } catch (err) {
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    fetchOrderData();
  }
}, [orderId]);
```

**Why useEffect?**

- Runs after component mounts
- Fetches data from API
- Updates state when data arrives
- Re-fetches if orderId changes

**Dependency array:**

- `[orderId]` means re-fetch if orderId changes
- Guards against stale data
- Handles browser back/forward

#### Email Receipt Handler

```typescript
const handleEmailReceipt = async () => {
  setSendingEmail(true);

  try {
    const response = await fetch("/api/send-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, orderData }),
    });

    if (!response.ok) {
      throw new Error("Failed to send receipt");
    }

    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 5000);
  } catch (err) {
    setError(err.message);
  } finally {
    setSendingEmail(false);
  }
};
```

**State machine:**

1. Idle: `sendingEmail=false, emailSent=false`
2. Sending: `sendingEmail=true, emailSent=false`
3. Success: `sendingEmail=false, emailSent=true`
4. Back to Idle: After 5 seconds

**Button states:**

```typescript
disabled={sendingEmail || emailSent}
```

- Disabled while sending
- Disabled for 5 seconds after success
- Prevents spam clicking

#### Pickup Time Formatting

```typescript
const formatPickupTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Input:  "2026-03-21T18:20:00Z"
// Output: "6:20 PM"
```

**Why toLocaleTimeString?**

- Handles timezone conversion
- Formats according to locale
- 12-hour format with AM/PM

---

### 5. Orders API (`app/api/orders/[orderId]/route.ts`)

#### Dynamic Route Handler

```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;

  // In Next.js 15, params is Promise in route handlers
  // Must await before accessing
}
```

**Type safety:**

- `params: Promise<{ orderId: string }>` enforces type
- Prevents accessing non-existent params
- TypeScript catches errors at compile time

#### Database Query

```typescript
const { data: order, error } = await supabase
  .from("orders")
  .select("*")
  .eq("id", orderId)
  .single();
```

**Query breakdown:**

- `.from("orders")` - table name
- `.select("*")` - all columns
- `.eq("id", orderId)` - WHERE id = orderId
- `.single()` - expect exactly one row

**Error handling:**

```typescript
if (error || !order) {
  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
```

#### Data Transformation

```typescript
const totalDollars = order.total_cents / 100;
const TAX_RATE = 0.13;
const subtotal = totalDollars / (1 + TAX_RATE);
const tax = totalDollars - subtotal;
```

**Math explained:**

```
Given: total = $59.37 (includes 13% tax)

Calculation:
total = subtotal + tax
total = subtotal + (subtotal * 0.13)
total = subtotal * (1 + 0.13)
total = subtotal * 1.13

Therefore:
subtotal = total / 1.13
subtotal = 59.37 / 1.13 = 52.54

tax = total - subtotal
tax = 59.37 - 52.54 = 6.83
```

#### Order Number Formatting

```typescript
orderNumber: `ORD-${order.id.toString().padStart(8, "0")}`;

// Examples:
// id: 1     → "ORD-00000001"
// id: 123   → "ORD-00000123"
// id: 99999 → "ORD-00099999"
```

**padStart(8, "0"):**

- Ensures 8 characters
- Pads with zeros on left
- Consistent number format

---

### 6. Email Receipt API (`app/api/send-receipt/route.ts`)

#### Email Template Generation

```typescript
const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* Inline styles for email compatibility */
        body { font-family: Arial, sans-serif; }
        .header { background-color: #f8f9fa; }
        .pickup-time { background-color: #e63946; color: white; }
      </style>
    </head>
    <body>
      ${/* Content */}
    </body>
  </html>
`;
```

**Why inline styles?**

- Email clients strip `<style>` tags
- Inline styles have better compatibility
- Gmail, Outlook require inline CSS

**Template generation:**

```typescript
${orderData.items
  .map(item => `
    <div class="item-row">
      <strong>${item.name}</strong>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `)
  .join("")}
```

**How it works:**

1. `.map()` transforms each item to HTML string
2. Template literal creates HTML for each item
3. `.join("")` combines array into single string

#### Resend Integration

```typescript
const { data, error: emailError } = await resend.emails.send({
  from: "Gladiator Burger <onboarding@resend.dev>",
  to: orderData.customerEmail,
  subject: `Order Confirmation - ${orderData.orderNumber}`,
  html: emailHtml,
});

if (emailError) {
  throw new Error(emailError.message);
}
```

**Response destructuring:**

- Resend returns `{ data, error }`
- Check `error` first
- `data.id` contains message ID for tracking

---

## 🔐 Security Considerations

### 1. Payment Security

```typescript
// ✅ GOOD: Card data never touches our servers
const tokenResult = await card.tokenize();
// Token is sent, not card number

// ❌ BAD: Would be PCI non-compliant
const cardNumber = form.cardNumber.value;
fetch("/api/payment", { body: { cardNumber } });
```

### 2. API Validation

```typescript
// Backend validation is mandatory
if (!sourceId || !orderDetails?.totalCents) {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
```

**Never trust frontend:**

- Users can manipulate client-side code
- Always validate on server
- Check data types, ranges, required fields

### 3. Database Access

```typescript
// Service role key used in API routes only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
);
```

**Why service role?**

- Full database access needed
- Only available server-side
- Not exposed to client

### 4. Environment Variables

```typescript
process.env.NEXT_PUBLIC_SQUARE_APP_ID; // Public: Can be in client
process.env.SQUARE_ACCESS_TOKEN; // Private: Server only
process.env.SUPABASE_SERVICE_ROLE_KEY; // Private: Server only
process.env.RESEND_API_KEY; // Private: Server only
```

**Naming convention:**

- `NEXT_PUBLIC_*` → Exposed to browser
- No prefix → Server-side only

---

## ⚡ Performance Optimizations

### 1. useCallback for Stable References

```typescript
const handleSuccess = useCallback(
  (orderId: string) => {
    router.push(`/order-confirmation/${orderId}`);
  },
  [router],
);
```

**Impact:**

- Prevents unnecessary re-renders
- Keeps Square card instance alive
- User doesn't lose card input

### 2. Refs for Square Instance

```typescript
const cardInstanceRef = useRef<any>(null);
```

**Benefit:**

- Instance persists across renders
- No re-initialization
- Faster, smoother UX

### 3. Lazy State Updates

```typescript
// Only update when necessary
useEffect(() => {
  const isReady = card !== null && !loading;
  onReadyChangeRef.current?.(isReady);
}, [card, loading]); // Only when card or loading changes
```

### 4. Single Database Query

```typescript
// Fetch all data in one query
.from("orders")
.select("*")
.eq("id", orderId)
.single();

// Not multiple queries:
// ❌ select customer info
// ❌ then select items
// ❌ then select payment info
```

---

## 🧪 Testing Considerations

### Unit Test Scenarios

1. **PaymentForm**
   - Card initialization
   - Tokenization success/failure
   - Cleanup on unmount

2. **Order Confirmation**
   - Loading state
   - Error state
   - Success state
   - Email button states

3. **APIs**
   - Valid requests
   - Invalid requests
   - Database errors
   - External service failures

### Integration Test Scenarios

1. Complete checkout flow
2. Payment success → order creation
3. Order retrieval → display
4. Email sending → delivery

### E2E Test Scenarios

1. Add to cart → checkout → pay → confirm
2. Invalid payment → error handling
3. Email receipt → inbox verification

---

## 📊 Database Schema

### orders Table

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  billing_address TEXT,
  billing_country TEXT,
  items JSONB NOT NULL,
  total_cents INTEGER NOT NULL,
  square_payment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  pickup_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Field explanations:**

- `id`: Auto-increment primary key
- `items`: JSONB stores array of items
- `total_cents`: Integer avoids decimal precision issues
- `square_payment_id`: Links to Square transaction
- `pickup_time`: TIMESTAMPTZ includes timezone
- `created_at`: Automatic timestamp

---

## 🔄 State Management Patterns

### Component State vs Context

**When to use useState:**

- Form inputs (local to component)
- UI state (loading, errors)
- Temporary data

**When to use Context:**

- Cart data (shared across pages)
- User authentication
- Theme/settings

**Current implementation:**

```typescript
// Cart: Context (shared)
const { items } = useCart();

// Form: Local state
const [customerEmail, setCustomerEmail] = useState("");
```

---

## 🚀 Deployment Checklist

### Environment Variables Required

Production `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SQUARE_ACCESS_TOKEN=
NEXT_PUBLIC_SQUARE_APP_ID=
NEXT_PUBLIC_SQUARE_LOCATION_ID=
RESEND_API_KEY=
```

### Database Migrations

Ensure `orders` table has:

- `customer_email` column
- `billing_address` column
- `billing_country` column

### Third-party Setup

1. Square: Production credentials
2. Supabase: Row-level security policies
3. Resend: Verified sender domain

---

This technical documentation provides a complete code-level understanding of the order confirmation system.
