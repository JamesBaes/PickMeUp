# Email Receipt Setup Guide

**Date:** 2026-02-19
**Feature:** Order Confirmation Email Receipt

---

## 📧 Overview

The order confirmation page now includes an "Email Receipt" button that sends a beautifully formatted email receipt to the customer's email address.

---

## 🚀 Setup Instructions

### 1. Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (free for up to 3,000 emails/month)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "Gladiator Burger Production")
5. Copy the API key (starts with `re_`)

### 3. Add API Key to Environment Variables

1. Open `.env.local` file
2. Replace `your_resend_api_key_here` with your actual API key:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```
3. Save the file
4. Restart your development server

### 4. (Optional) Set Up Custom Domain

By default, emails are sent from `onboarding@resend.dev`. To use your own domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `gladiatorburgerca.com`)
4. Follow DNS setup instructions
5. Once verified, update the `from` field in `/app/api/send-receipt/route.ts`:
   ```typescript
   from: "Gladiator Burger <orders@gladiatorburgerca.com>"
   ```

---

## 📋 Features

### Email Receipt Includes:

✅ **Order Information**
- Order number
- Order date
- Payment method

✅ **Pickup Time** - Prominently displayed at the top

✅ **Items List**
- Product names
- Quantities
- Individual prices
- Item totals

✅ **Pricing Breakdown**
- Subtotal
- Tax (13%)
- Order total

✅ **Billing Information**
- Customer name
- Email address
- Phone number
- Billing address

✅ **Professional Design**
- Branded header with Gladiator logo
- Color-coded sections
- Mobile-responsive layout
- Clear typography

---

## 🎨 Order Confirmation Page Changes

### Added Features:

1. **Pickup Time Display**
   - Shows formatted pickup time (e.g., "6:20 PM")
   - Prominently displayed below the thank you message
   - Uses bold, large font matching Figma design

2. **Email Receipt Button**
   - Replaced "Track Your Order" button
   - Shows loading state while sending
   - Shows success message after sending
   - Displays recipient email address on success
   - Disabled state prevents duplicate sends

### UI States:

- **Default:** "Email Receipt"
- **Loading:** "Sending..." (button disabled)
- **Success:** "Email Sent!" + confirmation message
- **Error:** Shows error message if sending fails

---

## 🔧 Technical Details

### API Endpoint: `/api/send-receipt`

**Method:** POST

**Request Body:**
```json
{
  "orderId": "123",
  "orderData": {
    "orderNumber": "ORD-00000123",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerPhone": "(123) 456-7890",
    "billingAddress": "123 Main St, Brampton, ON",
    "items": [...],
    "subtotal": 53.97,
    "tax": 5.40,
    "total": 59.37,
    "pickupTime": "2026-03-21T18:20:00Z",
    "date": "March 21 2026",
    "paymentMethod": "VISA"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "messageId": "msg_abc123..."
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

---

## 📁 Files Modified/Created

### Created:
1. **`app/api/send-receipt/route.ts`** - Email sending API endpoint
2. **`docs/email-receipt-setup.md`** - This setup guide

### Modified:
1. **`app/order-confirmation/[orderId]/page.tsx`**
   - Added pickup time display
   - Replaced "Track Your Order" with "Email Receipt"
   - Added email sending functionality
   - Added loading and success states

2. **`.env.local`**
   - Added `RESEND_API_KEY` environment variable

3. **`package.json`**
   - Added `resend` dependency

---

## 🧪 Testing

### Test Email Receipt:

1. Complete a test order through checkout
2. On order confirmation page, verify:
   - ✅ Pickup time is displayed correctly
   - ✅ "Email Receipt" button is visible
3. Click "Email Receipt" button
4. Verify:
   - ✅ Button shows "Sending..."
   - ✅ After ~2 seconds, shows "Email Sent!"
   - ✅ Success message displays customer email
5. Check recipient's inbox for email
6. Verify email contains:
   - ✅ All order details
   - ✅ Pickup time
   - ✅ Items and pricing
   - ✅ Billing information
   - ✅ Professional formatting

### Error Testing:

- Test without RESEND_API_KEY → Should show error message
- Test with invalid email → Should handle gracefully
- Test with network error → Should display error to user

---

## 💡 Usage Notes

### Email Sending:
- Emails are sent asynchronously
- Average send time: 1-3 seconds
- Success message auto-hides after 5 seconds
- Button is disabled during sending to prevent duplicates

### Email Deliverability:
- Resend has excellent deliverability rates
- Emails should arrive within seconds
- Check spam folder if not received
- Using a custom verified domain improves deliverability

### Rate Limits:
- Free tier: 3,000 emails/month
- Pro tier: 50,000 emails/month
- Enterprise: Unlimited

---

## 🔒 Security Notes

- ✅ RESEND_API_KEY is server-side only (not exposed to client)
- ✅ API endpoint validates order data before sending
- ✅ Email addresses are validated by Resend
- ✅ No sensitive payment information is included in emails

---

## 📊 Future Enhancements

Potential improvements:
- [ ] Add order status tracking emails
- [ ] Send pickup reminder 15 minutes before pickup time
- [ ] Add promotional content to receipt emails
- [ ] Include QR code for easy order pickup
- [ ] Support for custom email templates per restaurant location

---

## 🆘 Troubleshooting

### Email not sending?
1. Check RESEND_API_KEY is set correctly in `.env.local`
2. Restart development server after adding API key
3. Check browser console for errors
4. Verify Resend API key is active in dashboard

### Email goes to spam?
1. Set up custom domain in Resend
2. Add SPF and DKIM records
3. Use verified sender address

### Wrong pickup time displayed?
1. Check timezone settings in formatPickupTime function
2. Verify pickup time is being saved correctly in database

---

## 📞 Support

For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Review code comments in `/app/api/send-receipt/route.ts`
- Contact team lead for API key access
