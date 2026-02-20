"use client";

import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

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
  onReadyChange?: (isReady: boolean) => void;
}

export interface PaymentFormHandle {
  processPayment: () => Promise<void>;
  isReady: boolean;
}

const PaymentForm = forwardRef<PaymentFormHandle, PaymentFormProps>(
  ({ orderDetails, onSuccess, onError, onReadyChange }, ref) => {
    // starts as null until Square is ready. It holds the card after initialization
    const [card, setCard] = useState<any>(null);
    // tracking if the payment is being processed or not
    const [loading, setLoading] = useState(false);

    // Use ref to store callbacks to prevent unnecessary re-initialization
    const onErrorRef = useRef(onError);
    const onSuccessRef = useRef(onSuccess);
    const onReadyChangeRef = useRef(onReadyChange);

    // Use ref to store card instance for proper cleanup
    const cardInstanceRef = useRef<any>(null);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
      onReadyChangeRef.current = onReadyChange;
    }, [onReadyChange]);

    // Notify parent when ready state changes
    useEffect(() => {
      const isReady = card !== null && !loading;
      onReadyChangeRef.current?.(isReady);
    }, [card, loading]);

    // Expose payment handler to parent component
    useImperativeHandle(ref, () => ({
      processPayment: handlePayment,
      isReady: card !== null && !loading,
    }));

    // Initialize Square (retries while the SDK script loads via afterInteractive)
    useEffect(() => {
      let retryTimeout: ReturnType<typeof setTimeout>;
      let attempts = 0;
      const MAX_ATTEMPTS = 20; // ~10 seconds max wait
      let isMounted = true;

      const initializeSquare = async () => {
        // check if square has been loaded or not
        if (!window.Square) {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            if (isMounted) {
              onErrorRef.current("Payment system failed to load");
            }
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
          const newCardInstance = await payments.card();

          // Only attach if component is still mounted
          if (!isMounted) {
            newCardInstance.destroy();
            return;
          }

          // Attach to the DOM. Tells square to render the card.
          // The card info DOES NOT GO INTO THE PAGE/CODE. Only into Square's iframe
          await newCardInstance.attach("#card-container");

          // Store in ref and state
          cardInstanceRef.current = newCardInstance;
          setCard(newCardInstance);
        } catch (e) {
          console.error("Square initialization error:", e);
          if (isMounted) {
            onErrorRef.current("Failed to initialize payment form");
          }
        }
      };

      initializeSquare();

      // Cleanup function to destroy the card instance when component unmounts
      return () => {
        isMounted = false;
        clearTimeout(retryTimeout);

        // Destroy card instance if it exists
        if (cardInstanceRef.current) {
          try {
            cardInstanceRef.current.destroy();
            cardInstanceRef.current = null;
          } catch (e) {
            console.error("Error destroying card instance:", e);
          }
        }

        setCard(null);
      };
    }, []); // Empty dependency array - only initialize once on mount

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

    return (
      <div
        id="card-container"
        className="border border-gray-300 rounded-lg p-4 min-h-[50px] bg-white"
      />
    );
  },
);

PaymentForm.displayName = "PaymentForm";

export default PaymentForm;
