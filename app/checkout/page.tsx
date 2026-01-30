"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentForm from "@/components/PaymentForm";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Customer information state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [pickupTime, setPickupTime] = useState("");

  // In reality, you'd get this from your cart state/context. For now, it is hardcoded
  // change this to take in James' cart state
  const cartItems = [
    { name: "Burger", quantity: 2, priceCents: 1299 },
    { name: "Fries", quantity: 1, priceCents: 499 },
  ];
  const totalCents = 3097;

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
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

  // Handle input changes with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    const nameError = validateName(value);
    const phoneError = formErrors.phone || validatePhone(customerPhone);

    setFormErrors({
      name: nameError,
      phone: phoneError,
    });

    setIsFormValid(!nameError && !phoneError && customerPhone.trim() !== "");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setCustomerPhone(formatted);

    const phoneError = validatePhone(formatted);
    const nameError = formErrors.name || validateName(customerName);

    setFormErrors({
      name: nameError,
      phone: phoneError,
    });

    setIsFormValid(!nameError && !phoneError && customerName.trim() !== "");
  };

  // Handle form submission
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateName(customerName);
    const phoneError = validatePhone(customerPhone);

    if (nameError || phoneError) {
      setFormErrors({
        name: nameError,
        phone: phoneError,
      });
      return;
    }

    // Calculate pickup time once when form is submitted (30 mins from now)
    setPickupTime(new Date(Date.now() + 30 * 60000).toISOString());
    setIsFormValid(true);
  };

  // Order details with customer info
  const orderDetails = {
    customerName,
    customerPhone,
    items: cartItems,
    totalCents,
    pickupTime,
  };

  // if the payment is successful => bring to confirmation page: /app/order-confirmation/[orderId]/page.tsx
  const handleSuccess = (orderId: string) => {
    router.push(`/order-confirmation/${orderId}`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        {cartItems.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>${(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Customer Information Form */}
      {!isFormValid && (
        <form onSubmit={handleContinueToPayment} className="mb-6">
          <h2 className="font-semibold mb-4">Customer Information</h2>

          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={customerName}
              onChange={handleNameChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-600"
              }`}
              placeholder="John Doe"
            />
            {formErrors.name && (
              <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={customerPhone}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-600"
              }`}
              placeholder="(555) 123-4567"
            />
            {formErrors.phone && (
              <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold
                       hover:bg-green-700 transition-colors"
          >
            Continue to Payment
          </button>
        </form>
      )}

      {/* Payment Section - Only shown after customer info is validated */}
      {isFormValid && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Customer:</span> {customerName}
            </p>
            <p className="text-sm text-green-800">
              <span className="font-semibold">Phone:</span> {customerPhone}
            </p>
            <button
              onClick={() => setIsFormValid(false)}
              className="text-sm text-green-700 underline mt-2"
            >
              Edit information
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <h2 className="font-semibold mb-4">Payment Information</h2>
          <PaymentForm
            orderDetails={orderDetails}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
}
