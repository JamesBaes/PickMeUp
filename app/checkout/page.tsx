"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentForm from "@/components/PaymentForm";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // In reality, you'd get this from your cart state/context. For now, it is hardcoded
  // change this to take in James' cart state
  // pickuptime is calculated as: current time + 30 mins(in milliseconds) => pickup in 30 mins
  const orderDetails = {
    customerName: "Test Customer",
    customerPhone: "555-123-4567",
    items: [
      { name: "Burger", quantity: 2, priceCents: 1299 },
      { name: "Fries", quantity: 1, priceCents: 499 },
    ],
    totalCents: 3097,
    pickupTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 mins from now
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
        {orderDetails.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>${(orderDetails.totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <PaymentForm
        orderDetails={orderDetails}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
