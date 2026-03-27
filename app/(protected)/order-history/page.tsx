"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/cartContext";
import type { MenuItem } from "@/types";
import { stripInjectionChars } from "@/helpers/checkoutValidation";

type OrderStatus =
  | "paid"
  | "in_progress"
  | "ready"
  | "completed"
  | "refunded"
  | "cancelled";

interface OrderItem {
  itemId: string;
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
  restaurant_id: string;
  items: OrderItem[];
  total_cents: number;
  status: OrderStatus;
  pickup_time: string | null;
}

const ORDER_DETAILS_SNAPSHOT_PREFIX = "order-details:";

const ACTIVE_STATUSES: OrderStatus[] = ["paid", "in_progress", "ready"];
const PAST_STATUSES: OrderStatus[] = ["completed", "refunded"];

const STEP_ORDER: Array<{ key: OrderStatus; label: string }> = [
  { key: "paid", label: "Order Placed" },
  { key: "in_progress", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
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


const toMenuItemFromOrderItem = (
  orderItem: OrderItem,
  restaurantId: string,
): MenuItem => ({
  item_id: orderItem.itemId,
  restaurant_id: restaurantId,
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
      const itemId = raw.itemId != null ? String(raw.itemId) : "";
      const name = typeof raw.name === "string" ? raw.name : "Item";
      const quantity = typeof raw.quantity === "number" ? raw.quantity : 1;
      const priceCents =
        typeof raw.priceCents === "number"
          ? raw.priceCents
          : typeof raw.price === "number"
            ? Math.round(raw.price * 100)
            : 0;
      const image = typeof raw.image === "string" ? raw.image : undefined;
      return { itemId, name, quantity, priceCents, image };
    })
    .filter((item): item is OrderItem => item !== null);
};

const normalizeStatus = (value: unknown): OrderStatus => {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (["refunded"].includes(raw)) return "refunded";
  if (["completed", "picked_up", "picked up", "pickedup", "collected"].includes(raw)) return "completed";
  if (["ready", "awaiting_pickup", "awaiting pickup"].includes(raw)) return "ready";
  if (["in_progress", "in progress", "preparing", "processing"].includes(raw)) return "in_progress";
  if (["paid", "ordered", "pending", "accepted", "confirmed", "incoming", "new"].includes(raw)) return "paid";

  return "paid";
};

const getStepIndex = (status: OrderStatus) => {
  const index = STEP_ORDER.findIndex((step) => step.key === status);
  return index === -1 ? 0 : index;
};

const getStatusHeading = (status: OrderStatus) => {
  switch (status) {
    case "paid":
      return "Order Received";
    case "in_progress":
      return "Order Being Prepared";
    case "ready":
      return "Ready for Pick-Up";
    case "completed":
      return "Order Completed";
    default:
      return "Order Status";
  }
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [amountSort, setAmountSort] = useState<"none" | "high" | "low">("none");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const openOrderDetails = (order: Order) => {
    try {
      sessionStorage.setItem(
        `${ORDER_DETAILS_SNAPSHOT_PREFIX}${order.id}`,
        JSON.stringify(buildOrderDetailsSnapshot(order)),
      );
    } catch {}

    router.push(`/order-confirmation/${order.id}`);
  };

  const handleOrderAgain = async (order: Order) => {
    await clearCart();

    const merged = new Map<string, { item: OrderItem; quantity: number }>();
    for (const item of order.items) {
      const key = item.itemId || item.name;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.set(key, { item, quantity: item.quantity });
      }
    }

    merged.forEach(({ item, quantity }) => {
      addItem(toMenuItemFromOrderItem(item, order.restaurant_id), quantity);
    });

    router.push("/cart");
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (!user?.id) {
          setOrders([]);
          return;
        }

        const orConditions: string[] = [];
        if (user.id) {
          orConditions.push(`customer_id.eq.${user.id}`);
        }
        if (user.email) {
          // Wrap email in quotes so PostgREST correctly parses the @ character
          orConditions.push(`customer_email.eq."${user.email}"`);
        }

        if (orConditions.length === 0) {
          setOrders([]);
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*, restaurant_locations(location_name)")
          .or(orConditions.join(","))
          .order("created_at", { ascending: false });

        if (error) throw error;

        const normalized: Order[] = (data ?? []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          restaurant_id: row.restaurant_id ?? "",
          location: row.restaurant_locations?.location_name
            ? row.restaurant_locations.location_name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
            : (row.location ?? "Pick Up Location"),
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

  const activeOrders = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)),
    [orders],
  );

  // Real-time listener: one channel per user (not per order) to track all active
  // order status changes. Client-side filtering keeps only the relevant orders.
  useEffect(() => {
    if (!user?.id || activeOrders.length === 0) return;

    const channel = supabase
      .channel(`order-status-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedId = payload.new.id as string;
          const newStatus = normalizeStatus(payload.new.status);
          setOrders((prev) =>
            prev.map((order) =>
              order.id === updatedId ? { ...order, status: newStatus } : order,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeOrders.length === 0]);

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
        <p className="text-danger-dark mb-6">{error}</p>
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
      <div className="mb-8 md:mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-neutral-900">
          Order History
        </h1>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-semibold text-neutral-900 mb-4">
          {activeOrders.length > 1 ? `Active Orders (${activeOrders.length})` : "Active Order"}
        </h2>

        <div className="min-h-[120px]">
          {activeOrders.length > 0 ? (
            activeOrders.length === 1 ? (
              // Full card for a single active order
              <div className="relative bg-background rounded-[22px] border border-stone-200 shadow-[0_10px_28px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="h-1.5 bg-accent"></div>

                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-neutral-900">
                        {formatDate(activeOrders[0].created_at)}
                      </p>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {activeOrders[0].location ?? "Pick Up Location"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Order #{activeOrders[0].id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <p className="text-3xl font-heading font-bold text-neutral-900 shrink-0">
                      {formatCurrency(activeOrders[0].total_cents)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="w-full overflow-x-auto pb-2 flex justify-center">
                      <div className="flex items-start px-1">
                        {STEP_ORDER.map((step, index) => {
                          const currentIndex = getStepIndex(activeOrders[0].status);
                          const done = index <= currentIndex;
                          const isCurrent = index === currentIndex;

                          return (
                            <Fragment key={step.key}>
                              {index > 0 && (
                                <div
                                  className={`w-8 sm:w-12 md:w-14 h-1 rounded-full mt-4 mx-1 ${index <= currentIndex ? "bg-success" : "bg-stone-200"}`}
                                ></div>
                              )}

                              <div className="w-[62px] sm:w-[78px] md:w-20 flex flex-col items-center">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? "bg-success border-success text-white" : "bg-neutral-100 border-neutral-200 text-neutral-500"}`}
                                >
                                  {step.key === "in_progress" && isCurrent
                                    ? "👨‍🍳"
                                    : index + 1}
                                </div>
                                <p
                                  className={`text-[11px] leading-tight text-center mt-2 px-1 ${done ? "text-neutral-800" : "text-neutral-400"}`}
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
                    <h3 className="text-2xl font-heading font-semibold text-neutral-900">
                      {getStatusHeading(activeOrders[0].status)}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-8 mb-6">
                    <div>
                      <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">
                        Date
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatDate(activeOrders[0].created_at)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {activeOrders[0].location ?? "Pick Up Location"}
                      </p>
                    </div>

                    <div className="flex-1 min-w-[180px]">
                      <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">
                        Items
                      </p>
                      <ul className="flex flex-col gap-1.5 text-sm max-h-40 overflow-y-auto pr-1">
                        {activeOrders[0].items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                            <span className="font-medium text-neutral-800 capitalize">{item.name.replace(/_/g, ' ')}</span>
                            <span className="text-neutral-400 text-xs">×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openOrderDetails(activeOrders[0])}
                      className="btn bg-accent hover:bg-secondary border-0 text-white font-heading px-6"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Compact cards grid for multiple active orders
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map((order) => {
                  const currentIndex = getStepIndex(order.status);
                  return (
                    <div
                      key={order.id}
                      className="relative bg-background rounded-[18px] border border-stone-200 shadow-[0_6px_18px_rgba(0,0,0,0.07)] overflow-hidden"
                    >
                      <div className="h-1 bg-accent"></div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <p className="text-xs text-neutral-400">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                              {formatDate(order.created_at)}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {order.location ?? "Pick Up Location"}
                            </p>
                          </div>
                          <p className="text-lg font-heading font-bold text-neutral-900 shrink-0">
                            {formatCurrency(order.total_cents)}
                          </p>
                        </div>

                        {/* Compact stepper */}
                        <div className="flex items-center gap-1 mb-3">
                          {STEP_ORDER.map((step, index) => {
                            const done = index <= currentIndex;
                            const isCurrent = index === currentIndex;
                            return (
                              <Fragment key={step.key}>
                                {index > 0 && (
                                  <div className={`flex-1 h-0.5 rounded-full ${index <= currentIndex ? "bg-success" : "bg-stone-200"}`}></div>
                                )}
                                <div
                                  title={step.label}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${done ? "bg-success border-success text-white" : "bg-neutral-100 border-neutral-200 text-neutral-500"}`}
                                >
                                  {step.key === "in_progress" && isCurrent ? "🍳" : index + 1}
                                </div>
                              </Fragment>
                            );
                          })}
                        </div>

                        <p className="text-xs font-semibold text-neutral-600 mb-3">
                          {getStatusHeading(order.status)}
                        </p>

                        {/* Items preview */}
                        <ul className="flex flex-col gap-1 text-xs mb-4">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                              <span className="font-medium text-neutral-700 capitalize truncate">{item.name.replace(/_/g, ' ')}</span>
                              <span className="text-neutral-400 shrink-0">×{item.quantity}</span>
                            </li>
                          ))}
                          {order.items.length > 3 && (
                            <li className="text-neutral-400 pl-2.5">+{order.items.length - 3} more</li>
                          )}
                        </ul>

                        <button
                          onClick={() => openOrderDetails(order)}
                          className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading w-full"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-background rounded-2xl border border-stone-200 shadow-sm p-6 text-neutral-500">
              No active order right now.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <h2 className="text-2xl font-heading font-semibold text-neutral-900">
            Past Orders ({filteredPastOrders.length})
          </h2>

          <div className="w-full xl:w-auto flex flex-col sm:flex-row sm:items-center gap-2 xl:min-w-[520px] xl:justify-end">
            <span className="text-sm text-neutral-500 font-medium">
              Filters & Sorting
            </span>

            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-background px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={dateSort}
              onChange={(e) =>
                setDateSort(e.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Date - Newest</option>
              <option value="oldest">Date - Oldest</option>
            </select>

            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-background px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                className="h-10 w-full sm:w-40 md:w-44 rounded-lg border border-stone-300 bg-background px-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20"
                maxLength={100}
                value={searchQuery}
                onChange={(e) => setSearchQuery(stripInjectionChars(e.target.value))}
              />
              <button
                className="w-10 h-10 rounded-lg bg-background border border-stone-300 text-neutral-700 hover:bg-stone-50 flex items-center justify-center shadow-sm"
                aria-label="Search orders"
              >
                🔎
              </button>
            </div>
          </div>
        </div>

        {filteredPastOrders.length === 0 ? (
          <div className="bg-background rounded-2xl border border-stone-200 shadow-sm p-6 text-neutral-500">
            {orders.some((order) => PAST_STATUSES.includes(order.status))
              ? "No orders match your filters."
              : "You do not have past orders yet."}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredPastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-background rounded-2xl border border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-start px-5 pt-5 pb-4">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-neutral-900 text-base leading-tight">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-accent mt-0.5 wrap-break-word">
                      {order.location ?? "Brampton, ON"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${order.status === "completed" ? "bg-success-subtle text-success-dark" : "bg-danger-subtle text-danger-text"}`}
                    >
                      {order.status === "completed" ? "Completed" : "Refunded"}
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-1.5 break-all">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-heading font-bold text-neutral-900 text-lg mt-0.5">
                      {formatCurrency(order.total_cents)}
                    </p>
                  </div>
                </div>

                {/* Divider + Items */}
                <div className="border-t border-stone-100 px-5 py-3">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">
                    Items
                  </p>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {(expandedItems.has(order.id) ? order.items : order.items.slice(0, 3)).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 wrap-break-word">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                        <span className="font-semibold capitalize">{item.name.replace(/_/g, ' ')}</span>
                        <span className="text-neutral-400 text-xs">×{item.quantity}</span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li>
                        <button
                          onClick={() => setExpandedItems((prev) => {
                            const next = new Set(prev);
                            next.has(order.id) ? next.delete(order.id) : next.add(order.id);
                            return next;
                          })}
                          className="text-xs text-accent hover:underline pl-3.5"
                        >
                          {expandedItems.has(order.id)
                            ? "Show less"
                            : `+${order.items.length - 3} more item${order.items.length - 3 > 1 ? "s" : ""}`}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="border-t border-stone-100 px-5 py-3 flex gap-2">
                  <button
                    onClick={() => handleOrderAgain(order)}
                    className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading px-5 rounded-lg"
                  >
                    Order Again
                  </button>
                  <button
                    onClick={() => openOrderDetails(order)}
                    className="btn btn-sm bg-transparent hover:bg-stone-50 border border-stone-300 text-neutral-700 font-heading px-5 rounded-lg"
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
