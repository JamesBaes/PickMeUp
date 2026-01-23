"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Square: any;
  }
}

interface PaymentFormProps {
  amount: number; // in cents
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
}: PaymentFormProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeSquare = async () => {
      if (!window.Square) {
        console.error("Square SDK not loaded");
        return;
      }

      const payments = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APP_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      );

      const card = await payments.card();
      await card.attach("#card-container");
      setCard(card);
    };

    initializeSquare();
  }, []);

  const handlePayment = async () => {
    if (!card) return;

    setLoading(true);
    try {
      // Tokenize the card (converts card info to a secure token)
      const result = await card.tokenize();

      if (result.status === "OK") {
        // Send token to your backend
        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: result.token,
            amount: amount,
          }),
        });

        const data = await response.json();

        if (data.success) {
          onPaymentSuccess(data.paymentId);
        } else {
          onPaymentError(data.error);
        }
      } else {
        onPaymentError(
          result.errors?.[0]?.message || "Card tokenization failed",
        );
      }
    } catch (error) {
      onPaymentError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="card-container"
        ref={cardContainerRef}
        className="border rounded-lg p-4 min-h-[50px]"
      />
      <button
        onClick={handlePayment}
        disabled={loading || !card}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
