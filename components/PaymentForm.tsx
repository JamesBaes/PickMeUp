"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Square: any;
  }
}

// Defining the data of the payment component
// All the information that is needed to create an order
interface OrderDetails {
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  pickupTime: string;
}

interface PaymentFormProps {
  orderDetails: OrderDetails;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

export default function PaymentForm({
  orderDetails,
  onSuccess,
  onError,
}: PaymentFormProps) {
  // starts as null until Square is ready. It holds the card after initialization
  const [card, setCard] = useState<any>(null);
  // tracking if the payment is being processed or not
  const [loading, setLoading] = useState(false);

  // Initialize Square (retries while the SDK script loads via afterInteractive)
  useEffect(() => {
    let cardInstance: any = null;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // ~10 seconds max wait

    const initializeSquare = async () => {
      // check if square has been loaded or not
      if (!window.Square) {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          onError("Payment system failed to load");
          return;
        }
        // Script may still be loading, retry shortly
        retryTimeout = setTimeout(initializeSquare, 500);
        return;
      }

      // Create the payments instance to return the object afterwards
      try {
        const payments = window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        );

        // Create the card instance -> Square's prebuilt UI for entering card info
        cardInstance = await payments.card();
        // Attach to the DOM. Tells square to render the card.
        // The card info DOES NOT GO INTO THE PAGE/CODE. Only into Square's iframe
        await cardInstance.attach("#card-container");
        // Save to state to handle the payment
        setCard(cardInstance);
      } catch (e) {
        console.error("Square initialization error:", e);
        onError("Failed to initialize payment form");
      }
    };

    initializeSquare();

    // Cleanup function to destroy the card instance when component unmounts
    return () => {
      clearTimeout(retryTimeout);
      if (cardInstance) {
        cardInstance.destroy();
      }
    };
  }, [onError]);

  // Payment Handler
  const handlePayment = async () => {
    // the 'guard' clause. if Square is not initialized, then don't do anything
    if (!card) return;

    setLoading(true);

    try {
      // Tokenize card info (converts to secure token from Square's iframe).
      // card is tokenized, does not receive actual card number whatsoever
      const tokenResult = await card.tokenize();

      if (tokenResult.status !== "OK") {
        throw new Error(tokenResult.errors?.[0]?.message || "Card error");
      }

      // Send to your API
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          orderDetails: orderDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.orderId);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      onError(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="card-container"
        className="border border-gray-300 rounded-lg p-4 min-h-[50px] bg-white"
      />
      <button
        onClick={handlePayment}
        disabled={loading || !card}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold
                   hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors"
      >
        {loading
          ? "Processing..."
          : `Pay $${(orderDetails.totalCents / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
