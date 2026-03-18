"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import PaymentForm, { PaymentFormHandle } from "@/components/PaymentForm";
import OrderSummary from "@/components/OrderSummary";
import ContactDetailsForm from "@/components/ContactDetailsForm";
import CardholderForm from "@/components/CardholderForm";
import BillingAddressForm from "@/components/BillingAddressForm";
import { generatePickupTime } from "@/helpers/checkoutHelpers";
import { useCart } from "@/context/cartContext";
import { useLocation } from "@/context/locationContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, clearCart } = useCart();
  const { currentLocation } = useLocation();
  const posthog = usePostHog();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const paymentFormRef = useRef<PaymentFormHandle>(null);

  // Checkout state is intentionally local to keep the page self-contained.
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [billingCountry, setBillingCountry] = useState("Canada");
  const [billingAddress, setBillingAddress] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [pickupTime, setPickupTime] = useState("");

  // Convert cart context items (dollars) into API payload format (cents).
  const cartItems = items.map((item) => ({
    itemId: item.item_id,
    name: item.name,
    quantity: item.quantity,
    priceCents: Math.round(item.price * 100),
    image: item.image_url,
  }));

  // Temp comment just not sure if this function was created from a branch ahead of behind main so uncomment if necessary.
  const handleQuantityChange = useCallback(
    (itemId: string, quantity: number) => {
      updateQuantity(itemId, quantity);
    },
    [updateQuantity],
  );

  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const discountCents = Math.round(subtotalCents * (promoDiscount / 100));
  const taxCents = 0; // Tax calculation pending address
  const totalCents = subtotalCents - discountCents + taxCents;

  // Promo handling is currently local/simple (single code flow).
  const handleApplyPromo = useCallback((code: string) => {
    setAppliedPromo(code);
    setPromoDiscount(5);
  }, []);

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo("");
    setPromoDiscount(0);
  }, []);

  const handlePromoError = useCallback((message: string) => {
    setError(message);
    if (message) {
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  // Pickup time defaults to 30 minutes from checkout start.
  const getPickupTime = () => {
    if (!pickupTime) {
      const time = generatePickupTime();
      setPickupTime(time);
      return time;
    }
    return pickupTime;
  };

  // One canonical object passed into PaymentForm and then to /api/payments.
  const orderDetails = {
    customerName,
    customerEmail,
    customerPhone,
    billingAddress,
    billingCountry,
    items: cartItems,
    totalCents,
    pickupTime: getPickupTime(),
    restaurantId: currentLocation?.id ?? "",
  };

  // Keep receipt token out of URL and hand it to confirmation page via sessionStorage.
  const handleSuccess = useCallback(
    (receiptToken: string) => {
      posthog.capture("payment_success", {
        total_cents: totalCents,
        items_count: cartItems.length,
      });
      clearCart();
      sessionStorage.setItem("pendingReceiptToken", receiptToken);
      router.push("/order-confirmation");
    },
    [router, posthog, totalCents, cartItems.length, clearCart],
  );

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  }, []);

  const handlePayButtonClick = async () => {
    // Parent triggers PaymentForm imperatively after validating visual readiness.
    if (!paymentFormRef.current) return;

    setError(null);
    setIsProcessing(true);

    try {
      await paymentFormRef.current.processPayment();
    } catch (err) {
      // Error handling is done in PaymentForm's handlePayment
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <OrderSummary
            cartItems={cartItems}
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            taxCents={taxCents}
            totalCents={totalCents}
            appliedPromo={appliedPromo}
            promoDiscount={promoDiscount}
            onPromoApply={handleApplyPromo}
            onPromoRemove={handleRemovePromo}
            onPromoError={handlePromoError}
            onQuantityChange={handleQuantityChange}
          />

          {/* Right Column - Payment Form */}
          <div className="bg-white rounded-lg p-8">
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Contact Details */}
            <ContactDetailsForm
              email={customerEmail}
              phone={customerPhone}
              onEmailChange={setCustomerEmail}
              onPhoneChange={setCustomerPhone}
              errors={{}}
            />

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="text-gray-900 font-medium mb-4">Payment method</h3>
              <p className="text-sm text-gray-600 mb-3">Card information</p>

              {/* Square Payment Form will be inserted here */}
              <div className="mb-4">
                <PaymentForm
                  ref={paymentFormRef}
                  orderDetails={orderDetails}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onReadyChange={setIsPaymentReady}
                />
              </div>
            </div>

            {/* Cardholder */}
            <CardholderForm
              name={customerName}
              onNameChange={setCustomerName}
            />

            {/* Billing Address */}
            <BillingAddressForm
              country={billingCountry}
              address={billingAddress}
              onCountryChange={setBillingCountry}
              onAddressChange={setBillingAddress}
              errors={{}}
            />

            {/* Save Info Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-900">
                    Save my information for faster checkout
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Pay securely at Gladiator Burger and everywhere Square is
                    accepted.
                  </p>
                </div>
              </label>
            </div>

            {/* Pay Button - Moved to bottom */}
            <button
              onClick={handlePayButtonClick}
              disabled={isProcessing || !isPaymentReady}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg
                         hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                         transition-colors mb-6"
            >
              {isProcessing
                ? "Processing..."
                : `Pay $${(totalCents / 100).toFixed(2)}`}
            </button>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <span>
                  Power by <span className="font-semibold">stripe</span>
                </span>
                <span>|</span>
                <a href="#" className="hover:text-gray-700">
                  Legal
                </a>
                <span>|</span>
                <a href="#" className="hover:text-gray-700">
                  Returns
                </a>
                <span>|</span>
                <a href="#" className="hover:text-gray-700">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
