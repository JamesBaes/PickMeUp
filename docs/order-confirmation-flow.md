# Order Confirmation Flow - User Journey

**Date:** 2026-02-19
**Feature:** Complete order flow from menu to confirmation

---

## 📊 Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY FLOWCHART                             │
└─────────────────────────────────────────────────────────────────────────────┘

    START: Menu Page (/)
         │
         ├─> User browses menu items
         │   └─> Clicks "Add to Cart" on menu item
         │       └─> Item added to cart context
         │           (guest: localStorage, user: Supabase)
         │
         ▼
    Cart Page (/cart)
         │
         ├─> Review items in cart
         ├─> Adjust quantities
         ├─> Select pickup location
         ├─> View subtotal, tax, total
         │
         └─> Click "Proceed to Checkout"
         │
         ▼
    Checkout Page (/checkout)
         │
         ├─> FORM SECTION 1: Contact Details
         │   ├─> Enter email
         │   └─> Enter phone number
         │
         ├─> FORM SECTION 2: Payment Method
         │   └─> Square card input (iframe)
         │       └─> Enter card number, CVV, expiry
         │
         ├─> FORM SECTION 3: Cardholder
         │   └─> Enter name on card
         │
         ├─> FORM SECTION 4: Billing Address
         │   ├─> Select country
         │   └─> Enter address
         │
         ├─> FORM SECTION 5: Save Info (optional)
         │   └─> Checkbox to save info
         │
         └─> Click "Pay $XX.XX" button
         │
         ▼
    Payment Processing
         │
         ├─> Frontend: PaymentForm.processPayment()
         │   ├─> Square.card.tokenize()
         │   │   └─> Creates secure token (no card data stored)
         │   │
         │   └─> POST /api/payments
         │       └─> {sourceId, orderDetails}
         │
         ├─> Backend: /api/payments
         │   ├─> Square Payments API
         │   │   └─> Process payment with token
         │   │       └─> Returns payment ID
         │   │
         │   └─> Save to Supabase 'orders' table
         │       ├─> customer_name
         │       ├─> customer_email
         │       ├─> customer_phone
         │       ├─> billing_address
         │       ├─> billing_country
         │       ├─> items (JSON array)
         │       ├─> total_cents
         │       ├─> square_payment_id
         │       ├─> status: "paid"
         │       ├─> pickup_time (current time + 30 mins)
         │       └─> created_at (auto)
         │
         ├─> SUCCESS
         │   └─> Returns {success: true, orderId: "123"}
         │
         └─> ERROR
             └─> Returns {success: false, error: "message"}
         │
         ▼
    [SUCCESS PATH]
         │
         └─> Router redirects to:
             /order-confirmation/[orderId]
         │
         ▼
    Order Confirmation Page (/order-confirmation/123)
         │
         ├─> Component mounts
         │   └─> useEffect fetches order data
         │       └─> GET /api/orders/123
         │
         ├─> Backend: /api/orders/[orderId]
         │   ├─> Query Supabase
         │   │   └─> SELECT * FROM orders WHERE id = orderId
         │   │
         │   └─> Transform data
         │       ├─> Calculate subtotal & tax
         │       ├─> Format order number (ORD-00000123)
         │       ├─> Format date (March 21 2026)
         │       ├─> Convert cents to dollars
         │       └─> Return formatted order
         │
         ├─> Display Order Confirmation
         │   │
         │   ├─> LEFT COLUMN
         │   │   ├─> "Thank you for your order!" heading
         │   │   ├─> Pickup time: "6:20 PM"
         │   │   └─> Payment Summary card
         │   │       ├─> Billing Address
         │   │       │   ├─> Name
         │   │       │   ├─> Address
         │   │       │   ├─> Email
         │   │       │   └─> Phone
         │   │       │
         │   │       └─> "Email Receipt" button
         │   │
         │   └─> RIGHT COLUMN
         │       └─> Order Summary card
         │           ├─> Order Number
         │           ├─> Date
         │           ├─> Payment Method
         │           ├─> Items list (with images)
         │           ├─> Subtotal
         │           ├─> Tax
         │           └─> Order Total
         │
         └─> User clicks "Email Receipt"
         │
         ▼
    Email Receipt Sending
         │
         ├─> Frontend: handleEmailReceipt()
         │   └─> POST /api/send-receipt
         │       └─> {orderId, orderData}
         │
         ├─> Backend: /api/send-receipt
         │   ├─> Format HTML email template
         │   │   ├─> Header with Gladiator logo
         │   │   ├─> Pickup time (highlighted)
         │   │   ├─> Order summary section
         │   │   ├─> Items list section
         │   │   ├─> Pricing breakdown
         │   │   └─> Billing info section
         │   │
         │   └─> Resend.emails.send()
         │       └─> Send to customer email
         │
         ├─> SUCCESS
         │   └─> Show "Email Sent!" message
         │       └─> Display: "Receipt sent to customer@example.com"
         │
         └─> ERROR
             └─> Show error message
         │
         ▼
    END: User receives email & sees confirmation

```

---

## 🔄 State Management Flow

### Cart Context (Guest Users)
```
Menu → Add Item → Cart Context → localStorage
                        ↓
                   useCart hook
                        ↓
                  Cart Page reads
                        ↓
              Checkout Page reads
```

### Cart Database (Authenticated Users)
```
Menu → Add Item → POST /api/cart → Supabase
                                        ↓
                                   useCart hook
                                        ↓
                              Cart Page fetches
                                        ↓
                            Checkout Page reads
```

### Order Creation Flow
```
Checkout Form Data
        ↓
    Pay Button Click
        ↓
Square Card Tokenization
        ↓
    Payment API
        ↓
  Square Payment
        ↓
 Supabase Insert
        ↓
    Return Order ID
        ↓
Redirect to Confirmation
```

---

## 📍 Critical Decision Points

### Decision 1: Guest vs Authenticated User
**Location:** Cart & Checkout
**Logic:**
- If `user` exists → Use Supabase cart
- If no `user` → Use localStorage cart

**Impact:**
- Affects where cart data is stored/retrieved
- Orders are saved to database regardless

### Decision 2: Payment Success vs Failure
**Location:** Checkout Page
**Logic:**
- If payment succeeds → Redirect to `/order-confirmation/[orderId]`
- If payment fails → Show error message, stay on checkout

**Impact:**
- Success: User sees confirmation page
- Failure: User can retry payment

### Decision 3: Order Found vs Not Found
**Location:** Order Confirmation Page
**Logic:**
- If order exists in DB → Display order details
- If order not found → Show error, return to menu

**Impact:**
- Found: Full confirmation page
- Not found: Error message

---

## 🗄️ Data Flow

### From Cart to Checkout
```javascript
Cart Items Format:
{
  item_id: "123",
  name: "Warrior",
  price: 17.99,        // dollars
  quantity: 1,
  image_url: "/path/to/image.jpg"
}
        ↓
Checkout Format:
{
  name: "Warrior",
  quantity: 1,
  priceCents: 1799,    // cents!
  image: "/path/to/image.jpg"
}
```

### From Checkout to Payment API
```javascript
Order Details:
{
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "(123) 456-7890",
  billingAddress: "123 Main St, Brampton, ON",
  billingCountry: "Canada",
  items: [...],
  totalCents: 5937,
  pickupTime: "2026-03-21T18:20:00Z"
}
```

### From Database to Order Confirmation
```javascript
Database Row:
{
  id: 123,
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "(123) 456-7890",
  billing_address: "123 Main St, Brampton, ON",
  billing_country: "Canada",
  items: [{name: "Warrior", quantity: 1, priceCents: 1799}],
  total_cents: 5937,
  status: "paid",
  pickup_time: "2026-03-21T18:20:00Z",
  created_at: "2026-03-21T17:50:00Z"
}
        ↓
Formatted for Frontend:
{
  id: "123",
  orderNumber: "ORD-00000123",
  date: "March 21 2026",
  paymentMethod: "VISA",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "(123) 456-7890",
  billingAddress: "123 Main St, Brampton, ON",
  items: [{name: "Warrior", quantity: 1, price: 17.99, image_url: "..."}],
  subtotal: 53.97,
  tax: 5.40,
  total: 59.37,
  pickupTime: "2026-03-21T18:20:00Z"
}
```

---

## ⏱️ Timeline & Performance

### Typical User Journey Time

```
Menu browsing                    → 2-5 minutes
Cart review                      → 30 seconds
Checkout form filling            → 1-2 minutes
Payment processing               → 2-3 seconds
Redirect to confirmation         → < 1 second
Order data fetch                 → 0.5-1 second
Email sending (if clicked)       → 1-3 seconds
─────────────────────────────────────────────
Total: ~4-9 minutes
```

### API Response Times (Expected)

- `POST /api/payments` → 2-3 seconds (Square processing)
- `GET /api/orders/[id]` → 0.5-1 second (Supabase query)
- `POST /api/send-receipt` → 1-3 seconds (email sending)

---

## 🔒 Security & Validation Flow

### Data Validation Points

1. **Menu → Cart**
   - ✅ Item exists
   - ✅ Price matches database
   - ✅ Quantity > 0

2. **Cart → Checkout**
   - ✅ Cart not empty
   - ✅ Items still available
   - ✅ Prices still valid

3. **Checkout → Payment**
   - ✅ All required fields filled
   - ✅ Email format valid
   - ✅ Phone format valid
   - ✅ Card data valid (Square)

4. **Payment → Database**
   - ✅ Payment succeeded
   - ✅ Amount matches cart total
   - ✅ No duplicate orders

5. **Confirmation → Display**
   - ✅ Order ID exists
   - ✅ Order belongs to user
   - ✅ Order status is valid

---

## 🚨 Error Handling Flow

### Checkout Page Errors
```
Error Occurs
    ↓
Check Error Type
    ├─> Card Validation Error
    │   └─> Display near card input
    │       └─> User fixes, retries
    │
    ├─> Payment Declined
    │   └─> Display error banner
    │       └─> User tries different card
    │
    └─> Network Error
        └─> Display error message
            └─> User refreshes or retries
```

### Order Confirmation Errors
```
Error Occurs
    ↓
Check Error Type
    ├─> Order Not Found
    │   └─> Show "Order not found"
    │       └─> Button: "Return to menu"
    │
    ├─> Network Error
    │   └─> Show loading error
    │       └─> User can refresh
    │
    └─> Email Send Failed
        └─> Show error message
            └─> User can retry
```

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Two-column layout
- Left: Thank you + Payment Summary
- Right: Order Summary

### Tablet (768px - 1023px)
- Single column, stacked
- Payment Summary → Order Summary

### Mobile (<768px)
- Single column, stacked
- Condensed spacing
- Larger touch targets

---

## 🔄 Edge Cases Handled

1. **User navigates back from confirmation**
   - Order data persists, can view again

2. **User refreshes confirmation page**
   - Data refetched from database

3. **User clicks "Email Receipt" multiple times**
   - Button disabled during sending
   - Success state prevents immediate retry

4. **Order not found in database**
   - Error message shown
   - Option to return to menu

5. **Email sending fails**
   - Error displayed
   - User can retry

6. **Network drops during checkout**
   - Error message shown
   - Form data preserved
   - User can retry when reconnected

---

## 🎯 Key Integration Points

### Square Integration
- **Entry Point:** Checkout page → PaymentForm component
- **Action:** Card tokenization
- **Exit Point:** Secure token → Payment API

### Supabase Integration
- **Entry Point 1:** Payment API → Insert order
- **Entry Point 2:** Order API → Fetch order
- **Action:** Store/retrieve order data
- **Exit Point:** Order data → Frontend

### Resend Integration
- **Entry Point:** Email Receipt button → Send Receipt API
- **Action:** Send formatted HTML email
- **Exit Point:** Email delivered to customer

---

## 📊 Success Metrics

### What constitutes a successful flow:

✅ User adds items to cart
✅ User completes checkout form
✅ Payment processes successfully
✅ Order saved to database
✅ User redirected to confirmation
✅ Order details display correctly
✅ Pickup time shown accurately
✅ Email receipt sends (if requested)

### Failure points to monitor:

❌ Cart empty at checkout
❌ Payment declined/failed
❌ Database insert fails
❌ Order not found
❌ Email sending fails

---

## 🔍 Debugging Guide

### If order doesn't appear on confirmation page:

1. Check browser network tab for API errors
2. Verify order ID in URL is correct
3. Check Supabase orders table for the order
4. Verify API endpoint is responding
5. Check for console errors

### If payment fails:

1. Check Square sandbox credentials
2. Verify test card numbers
3. Check network tab for payment API errors
4. Review payment API logs
5. Verify Supabase connection

### If email doesn't send:

1. Check RESEND_API_KEY is set
2. Verify email address is valid
3. Check Resend dashboard for logs
4. Review send-receipt API errors
5. Check network tab for request details

---

This flowchart provides a complete overview of the user journey from browsing the menu to receiving an order confirmation email.
