'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cartContext';
import type { MenuItem } from '@/types';
import { stripInjectionChars } from '@/helpers/checkoutValidation';
import {
  Order,
  OrderItem,
  PAST_STATUSES,
  ORDER_DETAILS_SNAPSHOT_PREFIX,
  buildOrderDetailsSnapshot,
} from '@/helpers/orderHelpers';
import ActiveOrderCard from '@/components/order-history/ActiveOrderCard';
import CompactActiveOrderCard from '@/components/order-history/CompactActiveOrderCard';
import PastOrderCard from '@/components/order-history/PastOrderCard';
import { useOrderHistory } from '@/hooks/useOrderHistory';

const toMenuItemFromOrderItem = (orderItem: OrderItem, restaurantId: string): MenuItem => ({
  item_id: orderItem.itemId,
  restaurant_id: restaurantId,
  name: orderItem.name,
  description: '',
  price: Number((orderItem.priceCents / 100).toFixed(2)),
  category: 'reorder',
  calories: 0,
  allergy_information: '',
  image_url: orderItem.image ?? '',
  list_of_ingredients: [],
});

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const { user, orders, activeOrders, pastOrders, loading, error } = useOrderHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [amountSort, setAmountSort] = useState<'none' | 'high' | 'low'>('none');
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
    router.push('/cart');
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const filteredPastOrders = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    const searched = lowered
      ? pastOrders.filter((order) => {
          const idMatch = order.id.toLowerCase().includes(lowered);
          const itemMatch = order.items.some((item) => item.name.toLowerCase().includes(lowered));
          return idMatch || itemMatch;
        })
      : pastOrders;
    return [...searched].sort((a, b) => {
      const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      const dateValue = dateSort === 'newest' ? dateDiff : -dateDiff;
      if (amountSort === 'none') return dateValue;
      const amountDiff = b.total_cents - a.total_cents;
      return amountSort === 'high' ? amountDiff : -amountDiff;
    });
  }, [pastOrders, searchQuery, dateSort, amountSort]);

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
        <p className="text-base-content/60 mb-6">Please log in to view your order history.</p>
        <button onClick={() => router.push('/login')} className="btn bg-accent hover:bg-secondary border-0 text-white font-heading">
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
        <button onClick={() => router.refresh()} className="btn bg-accent hover:bg-secondary border-0 text-white font-heading">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-6 md:py-10">
      <div className="mb-8 md:mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-neutral-900">Order History</h1>
      </div>

      {/* Active Orders */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-semibold text-neutral-900 mb-4">
          {activeOrders.length > 1 ? `Active Orders (${activeOrders.length})` : 'Active Order'}
        </h2>
        <div className="min-h-[120px]">
          {activeOrders.length > 0 ? (
            activeOrders.length === 1 ? (
              <ActiveOrderCard order={activeOrders[0]} onViewDetails={openOrderDetails} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map((order) => (
                  <CompactActiveOrderCard key={order.id} order={order} onViewDetails={openOrderDetails} />
                ))}
              </div>
            )
          ) : (
            <div className="bg-background rounded-2xl border border-stone-200 shadow-sm p-6 text-neutral-500">
              No active order right now.
            </div>
          )}
        </div>
      </section>

      {/* Past Orders */}
      <section>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <h2 className="text-2xl font-heading font-semibold text-neutral-900">
            Past Orders ({filteredPastOrders.length})
          </h2>
          <div className="w-full xl:w-auto flex flex-col sm:flex-row sm:items-center gap-2 xl:min-w-[520px] xl:justify-end">
            <span className="text-sm text-neutral-500 font-medium">Filters & Sorting</span>
            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-background px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
            >
              <option value="newest">Date - Newest</option>
              <option value="oldest">Date - Oldest</option>
            </select>
            <select
              className="h-10 w-full sm:w-auto rounded-lg border border-stone-300 bg-background px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={amountSort}
              onChange={(e) => setAmountSort(e.target.value as 'none' | 'high' | 'low')}
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
              <button className="w-10 h-10 rounded-lg bg-background border border-stone-300 text-neutral-700 hover:bg-stone-50 flex items-center justify-center shadow-sm" aria-label="Search orders">
                🔎
              </button>
            </div>
          </div>
        </div>

        {filteredPastOrders.length === 0 ? (
          <div className="bg-background rounded-2xl border border-stone-200 shadow-sm p-6 text-neutral-500">
            {orders.some((order) => PAST_STATUSES.includes(order.status))
              ? 'No orders match your filters.'
              : 'You do not have past orders yet.'}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredPastOrders.map((order) => (
              <PastOrderCard
                key={order.id}
                order={order}
                expanded={expandedItems.has(order.id)}
                onToggleExpand={toggleExpanded}
                onOrderAgain={handleOrderAgain}
                onViewDetails={openOrderDetails}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
