"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  date: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  pickupTime: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const receiptToken = sessionStorage.getItem("pendingReceiptToken");

    if (!receiptToken) {
      // No active checkout session — redirect home instead of showing a broken page
      router.replace("/");
      return;
    }

    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/orders/receipt/${receiptToken}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await response.json();
        setOrderData(data);
        // Clear the token after a successful fetch so the page cannot be replayed on refresh
        sessionStorage.removeItem("pendingReceiptToken");
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [router]);

  const handleEmailReceipt = async () => {
    setSendingEmail(true);
    setError(null);

    try {
      const response = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send receipt");
      }

      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send receipt";
      console.error("Error sending receipt:", err);
      setError(message);
    } finally {
      setSendingEmail(false);
    }
  };

  const formatPickupTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-body text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-red-600 mb-4">{error || "Order not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="text-accent hover:underline font-body"
          >
            Return to menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Thank You Message & Payment Summary */}
          <div className="space-y-8">
            {/* Thank You Message */}
            <div>
              <h1 className="font-heading font-bold text-5xl text-gray-900 mb-6">
                Thank you for your order!
              </h1>
              <p className="font-body text-gray-600 text-lg mb-8">
                We will notify you once your order has begun being processed.
                <br />
                You can view the status of your order below.
              </p>

              {/* Pickup Time */}
              <div className="font-heading text-3xl text-gray-900">
                <span className="font-semibold">Pick Up Time:</span>{" "}
                <span className="font-bold">{formatPickupTime(orderData.pickupTime)}</span>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h2 className="font-heading font-bold text-3xl text-gray-900 mb-6">
                Payment Summary
              </h2>

              {/* Billing Address */}
              <div className="mb-8">
                <h3 className="font-heading font-semibold text-xl text-gray-800 mb-4">
                  Billing Address
                </h3>
                <div className="space-y-2 font-body text-gray-700">
                  <div className="flex">
                    <span className="w-20 text-gray-600">Name:</span>
                    <span>{orderData.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-gray-600">Address:</span>
                    <span>{orderData.billingAddress}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-gray-600">Email:</span>
                    <span>{orderData.customerEmail}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-gray-600">Phone:</span>
                    <span>{orderData.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Email Receipt Button */}
              <div>
                <button
                  onClick={handleEmailReceipt}
                  disabled={sendingEmail || emailSent}
                  className="bg-accent text-white font-heading font-semibold py-3 px-8 rounded-lg hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? "Sending..." : emailSent ? "Email Sent!" : "Email Receipt"}
                </button>
                {emailSent && (
                  <p className="mt-2 text-sm text-green-600 font-body">
                    Receipt sent to {orderData.customerEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="font-heading font-bold text-3xl text-gray-900 mb-6">
              Order Summary
            </h2>

            {/* Order Details */}
            <div className="space-y-3 mb-6 font-body">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="text-gray-900">{orderData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">{orderData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900">{orderData.paymentMethod}</span>
              </div>
            </div>

            <hr className="border-gray-300 mb-6" />

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      {item.name}
                    </h3>
                    <p className="font-body text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="font-body text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-gray-300 mb-6" />

            {/* Pricing */}
            <div className="space-y-3 font-body mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${orderData.tax.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Total */}
            <div className="pt-4 border-t border-gray-300">
              <div className="flex justify-between font-heading text-2xl">
                <span className="font-bold text-gray-900">Order Total</span>
                <span className="font-bold text-gray-900">
                  ${orderData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
