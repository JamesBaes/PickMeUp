"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/cartContext";
import type { MenuItem } from "@/types";

type OrderStatus =
  | "ordered"
  | "accepted"
  | "complete"
  | "in_progress"
  | "ready"
  | "picked_up"
  | "cancelled";

interface OrderItem {
  name: string;
  quantity: number;
  priceCents: number;
  image: string | undefined;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  location?: string;
  items: OrderItem[];
  total_cents: number;
  status: OrderStatus;
  pickup_time: string | null;
}

// ===========================
// MOCK DATA MODE (temporary)
// ===========================
// Keep this `true` while designing/testing UI.
// When your database is populated, switch this to `false`
// and the real Supabase fetch below will run automatically.
const USE_MOCK_DATA = true;
const ORDER_DETAILS_SNAPSHOT_PREFIX = "order-details:";

const MOCK_ORDERS: Order[] = [
  {
    id: "c5cf6b22-31f4-4f60-a8f6-a2e4fd8d1011",
    created_at: "2025-10-02T12:30:00.000Z",
    customer_name: "Manraj",
    customer_email: "mock@gladiator.com",
    customer_phone: "555-123-4567",
    location: "Brampton, ON (Pick Up Location)",
    items: [
      { name: "Combo Plate", quantity: 1, priceCents: 1499, image: undefined },
      {
        name: "Strawberry Milkshake",
        quantity: 2,
        priceCents: 799,
        image: undefined,
      },
      {
        name: "Chicken Burger",
        quantity: 1,
        priceCents: 1099,
        image: undefined,
      },
      { name: "Fries", quantity: 3, priceCents: 399, image: undefined },
    ],
    total_cents: 17770,
    status: "in_progress",
    pickup_time: "2025-10-02T13:00:00.000Z",
  },
  {
    id: "18ff66aa-402f-45c2-9ab7-c9839ad90001",
    created_at: "2025-10-01T18:30:00.000Z",
    customer_name: "Manraj",
    customer_email: "mock@gladiator.com",
    customer_phone: "555-123-4567",
    location: "Brampton, ON",
    items: [
      { name: "Combo Plate", quantity: 1, priceCents: 1499, image: undefined },
      {
        name: "Strawberry Milkshake",
        quantity: 1,
        priceCents: 799,
        image: undefined,
      },
    ],
    total_cents: 5172,
    status: "picked_up",
    pickup_time: "2025-10-01T19:00:00.000Z",
  },
  {
    id: "82ddf2ec-7ab1-4dc6-9129-5f29fd3a1110",
    created_at: "2025-09-28T16:00:00.000Z",
    customer_name: "Manraj",
    customer_email: "mock@gladiator.com",
    customer_phone: "555-123-4567",
    location: "Brampton, ON",
    items: [
      {
        name: "Chicken Burger",
        quantity: 2,
        priceCents: 1099,
        image: undefined,
      },
      { name: "Fries", quantity: 1, priceCents: 399, image: undefined },
    ],
    total_cents: 5172,
    status: "picked_up",
    pickup_time: "2025-09-28T16:30:00.000Z",
  },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "ordered",
  "accepted",
  "complete",
  "in_progress",
  "ready",
];
const PAST_STATUSES: OrderStatus[] = ["picked_up", "cancelled"];

const STEP_ORDER: Array<{ key: OrderStatus; label: string }> = [
  { key: "ordered", label: "Ordered" },
  { key: "accepted", label: "Accepted" },
  { key: "complete", label: "Complete" },
  { key: "in_progress", label: "In Progress" },
  { key: "ready", label: "Ready" },
  { key: "picked_up", label: "Picked" },
];

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatShortDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const toMenuItemFromOrderItem = (
  orderItem: OrderItem,
  index: number,
  orderId: string,
): MenuItem => ({
  item_id: `${orderId}-${index}-${orderItem.name}`,
  restaurant_id: "",
  name: orderItem.name,
  description: "",
  price: Number((orderItem.priceCents / 100).toFixed(2)),
  category: "reorder",
  calories: 0,
  allergy_information: "",
  image_url: orderItem.image ?? "",
  list_of_ingredients: [],
});

const buildOrderDetailsSnapshot = (order: Order) => {
  const total = Number((order.total_cents / 100).toFixed(2));
  const subtotal = Number((total / 1.13).toFixed(2));
  const tax = Number((total - subtotal).toFixed(2));

  return {
    id: order.id,
    orderNumber: `ORD-${order.id.slice(-8).toUpperCase()}`,
    date: formatDate(order.created_at),
    paymentMethod: "Card",
    customerName: order.customer_name,
    customerEmail: order.customer_email ?? "N/A",
    customerPhone: order.customer_phone,
    billingAddress: order.location ?? "N/A",
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Number((item.priceCents / 100).toFixed(2)),
      image_url: item.image ?? "",
    })),
    subtotal,
    tax,
    total,
    status: order.status,
    pickupTime: order.pickup_time,
  };
};

const normalizeItems = (value: unknown): OrderItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const name = typeof raw.name === "string" ? raw.name : "Item";
      const quantity = typeof raw.quantity === "number" ? raw.quantity : 1;
      const priceCents =
        typeof raw.priceCents === "number"
          ? raw.priceCents
          : typeof raw.price === "number"
            ? Math.round(raw.price * 100)
            : 0;
      const image = typeof raw.image === "string" ? raw.image : undefined;
      return { name, quantity, priceCents, image };
    })
    .filter((item): item is OrderItem => item !== null);
};

const normalizeStatus = (value: unknown): OrderStatus => {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
      "declined",
      "expired",
      "timed_out",
      "timed out",
      "timeout",
      "auto_rejected",
      "auto_reject",
      "auto-rejected",
      "auto-cancelled",
      "auto_cancelled",
      "auto_canceled",
    ].includes(raw)
  ) {
    return "cancelled";
  }
  if (
    ["picked_up", "picked up", "pickedup", "collected", "completed"].includes(
      raw,
    )
  )
    return "picked_up";
  if (["ready", "awaiting_pickup", "awaiting pickup"].includes(raw))
    return "ready";
  if (["in_progress", "in progress", "preparing", "processing"].includes(raw))
    return "in_progress";
  if (["complete", "complete_order", "complete order"].includes(raw))
    return "complete";
  if (["accepted", "accept", "confirmed"].includes(raw)) return "accepted";
  if (["ordered", "pending", "paid", "incoming", "new"].includes(raw))
    return "ordered";

  return "ordered";
};

const getStepIndex = (status: OrderStatus) => {
  const index = STEP_ORDER.findIndex((step) => step.key === status);
  return index === -1 ? 0 : index;
};

const getStatusHeading = (status: OrderStatus) => {
  switch (status) {
    case "ordered":
      return "Order Received";
    case "accepted":
      return "Order Accepted";
    case "complete":
      return "Order Complete";
    case "in_progress":
      return "Order Being Prepared";
    case "ready":
      return "Ready for Pick-Up";
    case "picked_up":
      return "Order Picked Up";
    case "cancelled":
      return "Order Cancelled";
    default:
      return "Order Status";
  }
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(
    USE_MOCK_DATA ? ({} as User) : null,
  );
  const [orders, setOrders] = useState<Order[]>(
    USE_MOCK_DATA ? MOCK_ORDERS : [],
  );
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [amountSort, setAmountSort] = useState<"none" | "high" | "low">("none");

  const openOrderDetails = (order: Order) => {
    try {
      sessionStorage.setItem(
        `${ORDER_DETAILS_SNAPSHOT_PREFIX}${order.id}`,
        JSON.stringify(buildOrderDetailsSnapshot(order)),
      );
    } catch {}

    router.push(`/order-confirmation/${order.id}`);
  };

  const handleOrderAgain = (order: Order) => {
    clearCart();

    order.items.forEach((item, index) => {
      const menuItem = toMenuItemFromOrderItem(item, index, order.id);
      addItem(menuItem, item.quantity);
    });

    router.push("/cart");
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // ======================
        // REAL DATABASE FETCHING
        // ======================
        // This runs when USE_MOCK_DATA = false

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (!user?.email) {
          setOrders([]);
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_email", user.email)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const normalized: Order[] = (data ?? []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          location: row.location,
          items: normalizeItems(row.items),
          total_cents:
            typeof row.total_cents === "number" ? row.total_cents : 0,
          status: normalizeStatus(row.status),
          pickup_time: row.pickup_time,
        }));

        setOrders(normalized);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load order history.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeOrder = useMemo(
    () => orders.find((order) => ACTIVE_STATUSES.includes(order.status)),
    [orders],
  );

  const filteredPastOrders = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();

    const base = orders.filter((order) => PAST_STATUSES.includes(order.status));

    const searched = lowered
      ? base.filter((order) => {
          const idMatch = order.id.toLowerCase().includes(lowered);
          const itemMatch = order.items.some((item) =>
            item.name.toLowerCase().includes(lowered),
          );
          return idMatch || itemMatch;
        })
      : base;

    const sorted = [...searched].sort((a, b) => {
      const dateDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      const dateValue = dateSort === "newest" ? dateDiff : -dateDiff;

      if (amountSort === "none") return dateValue;
      const amountDiff = b.total_cents - a.total_cents;
      return amountSort === "high" ? amountDiff : -amountDiff;
    });

    return sorted;
  }, [orders, searchQuery, dateSort, amountSort]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20">
        <h1 className="text-4xl font-heading font-bold mb-3">Order History</h1>
        <p className="text-base-content/60 mb-6">
          Please log in to view your order history.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="btn bg-accent hover:bg-secondary border-0 text-white font-heading"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-heading font-bold mb-3">Order History</h1>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="btn bg-accent hover:bg-secondary border-0 text-white font-heading"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-6 md:py-10">
      {USE_MOCK_DATA && (
        <div className="alert alert-warning mb-6 text-sm shadow-sm border border-amber-300">
          Mock data mode is ON. Set{" "}
          <span className="font-semibold">USE_MOCK_DATA</span> to false in this
          file to fetch real orders.
        </div>
      )}

      <div className="mb-8 md:mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900">
          Order History
        </h1>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Active Order
        </h2>

        {activeOrder ? (
          <div className="relative bg-white rounded-[22px] border border-stone-200 shadow-[0_10px_28px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="h-1.5 bg-accent"></div>

            <div className="pt-6 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
                <div className="min-w-0 md:max-w-[70%]">
                  <p className="font-heading font-semibold text-slate-900">
                    {formatDate(activeOrder.created_at)}
                  </p>
                  <p className="text-sm text-slate-500 wrap-break-word">
                    {activeOrder.location ?? "Pick Up Location"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 break-all">
                    Order #{activeOrder.id.slice(-10)}
                  </p>
                </div>
                <p className="text-3xl font-heading font-bold text-slate-900">
                  {formatCurrency(activeOrder.total_cents)}
                </p>
              </div>

              <div className="mb-6">
                <div className="w-full overflow-x-auto pb-2">
                  <div className="min-w-max mx-auto flex items-start px-1">
                    {STEP_ORDER.map((step, index) => {
                      const currentIndex = getStepIndex(activeOrder.status);
                      const done = index <= currentIndex;
                      const isCurrent = index === currentIndex;

                      return (
                        <Fragment key={step.key}>
                          {index > 0 && (
                            <div
                              className={`w-8 sm:w-12 md:w-14 h-1 rounded-full mt-4 mx-1 ${index <= currentIndex ? "bg-green-500" : "bg-stone-200"}`}
                            ></div>
                          )}

                          <div className="w-[62px] sm:w-[78px] md:w-20 flex flex-col items-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? "bg-green-500 border-green-500 text-white" : "bg-gray-100 border-gray-200 text-gray-500"}`}
                            >
                              {step.key === "in_progress" && isCurrent
                                ? "👨‍🍳"
                                : index + 1}
                            </div>
                            <p
                              className={`text-[11px] leading-tight text-center mt-2 px-1 wrap-break-word ${done ? "text-slate-800" : "text-slate-400"}`}
                            >
                              {step.label}
                            </p>
                          </div>
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-heading font-semibold text-slate-900">
                  {getStatusHeading(activeOrder.status)}
                </h3>
              </div>

              <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-2">
                    Date
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(activeOrder.created_at)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {activeOrder.location ?? "Pick Up Location"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-2">
                    Items
                  </p>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700 max-h-40 overflow-y-auto pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <p key={idx} className="wrap-break-word">
                        • {item.name} ×{item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openOrderDetails(activeOrder)}
                  className="btn bg-accent hover:bg-secondary border-0 text-white font-heading px-6"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-slate-500">
            No active order right now.
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <h2 className="text-2xl font-heading font-semibold text-slate-900">
            Past Orders ({filteredPastOrders.length})
          </h2>

          <div className="w-full xl:w-auto flex flex-col sm:flex-row sm:items-center gap-2 xl:min-w-[520px] xl:justify-end">
            <span className="text-sm text-slate-500 font-medium">
              Filters & Sorting
            </span>

            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={dateSort}
              onChange={(e) =>
                setDateSort(e.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Date - Newest</option>
              <option value="oldest">Date - Oldest</option>
            </select>

            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={amountSort}
              onChange={(e) =>
                setAmountSort(e.target.value as "none" | "high" | "low")
              }
            >
              <option value="none">Order Total</option>
              <option value="high">High to Low</option>
              <option value="low">Low to High</option>
            </select>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search"
                className="h-10 w-full sm:w-40 md:w-44 rounded-lg border border-stone-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="w-10 h-10 rounded-lg bg-white border border-stone-300 text-slate-700 hover:bg-stone-50 flex items-center justify-center shadow-sm"
                aria-label="Search orders"
              >
                🔎
              </button>
            </div>
          </div>
        </div>

        {filteredPastOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-slate-500">
            {orders.some((order) => PAST_STATUSES.includes(order.status))
              ? "No orders match your filters."
              : "You do not have past orders yet."}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {filteredPastOrders.map((order) => (
              <div
                key={order.id}
                className="relative bg-white rounded-2xl border border-stone-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-4 overflow-hidden"
              >
                <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                  <div className="min-w-0 sm:max-w-[55%]">
                    <p className="font-heading font-semibold text-slate-900">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-slate-500 wrap-break-word">
                      {order.location ?? "Brampton, ON"}
                    </p>
                  </div>
                  <div className="sm:text-right min-w-0 sm:max-w-[45%]">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${order.status === "picked_up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {order.status === "picked_up" ? "Picked" : "Cancelled"}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 break-all">
                      Order #{order.id.slice(-10)}
                    </p>
                    <p className="font-heading font-bold text-slate-900 mt-1">
                      {formatCurrency(order.total_cents)}
                    </p>
                  </div>
                </div>

                <div className="relative mb-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-2">
                      Items
                    </p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="wrap-break-word">
                          • {item.name} ×{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="relative flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOrderAgain(order)}
                    className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading px-4"
                  >
                    Order Again
                  </button>
                  <button
                    onClick={() => openOrderDetails(order)}
                    className="btn btn-sm bg-white hover:bg-stone-50 border-stone-300 text-slate-700 font-heading px-4"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
