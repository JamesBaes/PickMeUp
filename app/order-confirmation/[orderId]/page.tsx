"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { ORDER_DETAILS_SNAPSHOT_PREFIX } from "@/helpers/orderHelpers";
import { OrderConfirmationData, ConfirmationOrderStatus } from "@/components/order-confirmation/types";
import OrderProgressStepper from "@/components/order-confirmation/OrderProgressStepper";
import PaymentSummaryCard from "@/components/order-confirmation/PaymentSummaryCard";
import OrderSummaryCard from "@/components/order-confirmation/OrderSummaryCard";

const formatPickupTime = (isoString?: string | null): string => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getSnapshotOrder = (orderId: string): OrderConfirmationData | null => {
  try {
    const raw = sessionStorage.getItem(`${ORDER_DETAILS_SNAPSHOT_PREFIX}${orderId}`);
    if (!raw) return null;
    return JSON.parse(raw) as OrderConfirmationData;
  } catch {
    return null;
  }
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          const snapshot = getSnapshotOrder(orderId);
          if (snapshot) { setOrderData(snapshot); return; }
          throw new Error("Failed to fetch order");
        }
        setOrderData(await response.json());
      } catch (err) {
        const snapshot = getSnapshotOrder(orderId);
        if (snapshot) { setOrderData(snapshot); return; }
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !orderData) return;

    const channel = supabase
      .channel(`order-confirmation-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrderData((prev) => prev ? {
          ...prev,
          status: (payload.new.status as ConfirmationOrderStatus) ?? prev.status,
          pickupTime: payload.new.pickup_time ?? prev.pickupTime,
        } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, orderData?.id]);

  const handleEmailReceipt = async () => {
    setSendingEmail(true);
    setError(null);
    try {
      const response = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send receipt");
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err: unknown) {
      console.error("Error sending receipt:", err);
      setError(err instanceof Error ? err.message : "Failed to send receipt");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="font-body text-neutral-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-danger-dark mb-4">{error || "Order not found"}</p>
          <button onClick={() => router.push("/")} className="text-accent hover:underline font-body">
            Return to menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div>
              <h1 className="font-heading font-bold text-5xl text-neutral-900 mb-6">
                Thank you for your order!
              </h1>
              <p className="font-body text-neutral-600 text-lg mb-8">
                We will notify you once your order has begun being processed.
                <br />
                You can view the status of your order below.
              </p>
              <div className="font-heading text-3xl text-neutral-900">
                <span className="font-semibold">Pick Up Time:</span>{" "}
                <span className="font-bold">{formatPickupTime(orderData.pickupTime)}</span>
              </div>
            </div>

            <OrderProgressStepper status={orderData.status} />

            <PaymentSummaryCard
              orderData={orderData}
              sendingEmail={sendingEmail}
              emailSent={emailSent}
              onEmailReceipt={handleEmailReceipt}
            />
          </div>

          <OrderSummaryCard orderData={orderData} />
        </div>
      </div>
    </div>
  );
}
