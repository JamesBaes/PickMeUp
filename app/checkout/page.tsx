"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentForm from "@/components/PaymentForm";

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
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    phone?: string;
    name?: string;
    address?: string;
  }>({});
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

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email address";
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (digitsOnly.length > 15) {
      return "Phone number is too long";
    }
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Cardholder name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return undefined;
  };

  const validateAddress = (address: string): string | undefined => {
    if (!address.trim()) {
      return "Address is required";
    }
    return undefined;
  };

  // Format phone number as user types (e.g., (555) 123-4567)
  const formatPhoneNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    }
    if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    }
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  };

  // Handle promo code application
  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SAVE5") {
      setAppliedPromo(promoCode.toUpperCase());
      setPromoDiscount(5);
    } else {
      setError("Invalid promo code");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Calculate pickup time (30 mins from now)
  const getPickupTime = () => {
    if (!pickupTime) {
      const time = new Date(Date.now() + 30 * 60000).toISOString();
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
          <div className="bg-white rounded-lg p-8 h-fit">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-6 mb-6">
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium">{item.name}</h3>
                  </div>
                  <div className="text-gray-900 font-medium">
                    CA${(item.priceCents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>CA${(subtotalCents / 100).toFixed(2)}</span>
              </div>

              {/* Promo Code Section */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  disabled={!!appliedPromo}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {!appliedPromo ? (
                  <button
                    onClick={handleApplyPromo}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAppliedPromo("");
                      setPromoCode("");
                      setPromoDiscount(0);
                    }}
                    className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium">
                      {appliedPromo}
                    </span>
                    <span className="text-sm text-gray-500">
                      {promoDiscount}% off
                    </span>
                  </span>
                  <span>-CA${(discountCents / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tax</span>
                <span>Enter address to calculate</span>
              </div>

              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
                <span>Total due</span>
                <span>CA${(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

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
            <div className="mb-6">
              <h3 className="text-gray-900 font-medium mb-4">
                Contact details
              </h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(formatPhoneNumber(e.target.value))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

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
            <div className="mb-6">
              <h3 className="text-gray-900 font-medium mb-3">Cardholder</h3>
              <input
                type="text"
                placeholder="Full name on card"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Billing Address */}
            <div className="mb-6">
              <h3 className="text-gray-900 font-medium mb-3">
                Billing address
              </h3>
              <div className="space-y-3">
                <select
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                  <option value="Mexico">Mexico</option>
                </select>
                <input
                  type="text"
                  placeholder="Address"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

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
