"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentForm from "@/components/PaymentForm";
import OrderSummary from "@/components/OrderSummary";
import ContactDetailsForm from "@/components/ContactDetailsForm";
import CardholderForm from "@/components/CardholderForm";
import BillingAddressForm from "@/components/BillingAddressForm";
import { generatePickupTime } from "@/helpers/checkoutHelpers";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Customer information state
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [billingCountry, setBillingCountry] = useState("Canada");
  const [billingAddress, setBillingAddress] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [pickupTime, setPickupTime] = useState("");

  // In reality, you'd get this from your cart state/context. For now, it is hardcoded
  // change this to take in James' cart state
  const cartItems = [
    {
      name: "Spanish Rice",
      quantity: 1,
      priceCents: 1800,
      image: "/spanish-rice.jpg",
    },
    {
      name: "Italy Pizza",
      quantity: 1,
      priceCents: 1800,
      image: "/italy-pizza.jpg",
    },
    {
      name: "Combo Plate",
      quantity: 1,
      priceCents: 1800,
      image: "/combo-plate.jpg",
    },
  ];

  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const discountCents = Math.round(subtotalCents * (promoDiscount / 100));
  const taxCents = 0; // Tax calculation pending address
  const totalCents = subtotalCents - discountCents + taxCents;

  // Handle promo code application
  const handleApplyPromo = (code: string) => {
    setAppliedPromo(code);
    setPromoDiscount(5);
  };

  const handleRemovePromo = () => {
    setAppliedPromo("");
    setPromoDiscount(0);
  };

  const handlePromoError = (message: string) => {
    setError(message);
    if (message) {
      setTimeout(() => setError(null), 3000);
    }
  };

  // Calculate pickup time (30 mins from now)
  const getPickupTime = () => {
    if (!pickupTime) {
      const time = generatePickupTime();
      setPickupTime(time);
      return time;
    }
    return pickupTime;
  };

  // Order details with customer info
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

  // if the payment is successful => bring to confirmation page: /app/order-confirmation/[orderId]/page.tsx
  const handleSuccess = (orderId: string) => {
    router.push(`/order-confirmation/${orderId}`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
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
          />

          {/* Right Column - Payment Form */}
          <div className="bg-white rounded-lg p-8">
            {/* Apple Pay Button */}
            <button className="w-full bg-black text-white py-4 rounded-lg font-medium mb-4 flex items-center justify-center hover:bg-gray-900 transition-colors">
              <span className="text-xl"> Pay</span>
            </button>

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
                  orderDetails={orderDetails}
                  onSuccess={handleSuccess}
                  onError={handleError}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Pay securely at Gladiator Burger and everywhere Stripe is
                    accepted.
                  </p>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
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
