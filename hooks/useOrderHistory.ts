'use client';

import { useEffect, useMemo, useState } from 'react';
import supabase from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  Order,
  ACTIVE_STATUSES,
  PAST_STATUSES,
  normalizeItems,
  normalizeStatus,
} from '@/helpers/orderHelpers';
import { formatItemName } from '@/helpers/menuHelpers';

interface RawOrderRow {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  restaurant_id: number | null;
  location: string | null;
  items: unknown;
  total_cents: number | null;
  status: string | null;
  pickup_time: string | null;
  restaurant_locations: { location_name: string } | null;
}

export function useOrderHistory() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user?.id) { setOrders([]); return; }

        const orConditions: string[] = [];
        if (user.id) orConditions.push(`customer_id.eq.${user.id}`);
        if (user.email) orConditions.push(`customer_email.eq."${user.email}"`);
        if (orConditions.length === 0) { setOrders([]); return; }

        const { data, error } = await supabase
          .from('orders')
          .select('*, restaurant_locations(location_name)')
          .or(orConditions.join(','))
          .order('created_at', { ascending: false });

        if (error) throw error;

        const normalized: Order[] = (data ?? []).map((row: RawOrderRow) => ({
          id: row.id,
          created_at: row.created_at,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          restaurant_id: row.restaurant_id ?? '',
          location: row.restaurant_locations?.location_name
            ? formatItemName(row.restaurant_locations.location_name)
            : (row.location ?? 'Pick Up Location'),
          items: normalizeItems(row.items),
          total_cents: typeof row.total_cents === 'number' ? row.total_cents : 0,
          status: normalizeStatus(row.status),
          pickup_time: row.pickup_time,
        }));

        setOrders(normalized);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load order history.');
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

  // Subscribe to real-time status updates for active orders.
  useEffect(() => {
    if (activeOrders.length === 0) return;

    const channels = activeOrders.map((activeOrder) =>
      supabase
        .channel(`order-status-${activeOrder.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrder.id}` }, (payload) => {
          const newStatus = normalizeStatus(payload.new.status);
          setOrders((prev) =>
            prev.map((order) => order.id === activeOrder.id ? { ...order, status: newStatus } : order),
          );
        })
        .subscribe(),
    );

    return () => { channels.forEach((channel) => supabase.removeChannel(channel)); };
  }, [activeOrders.map((o) => o.id).join(',')]);

  const pastOrders = useMemo(
    () => orders.filter((order) => PAST_STATUSES.includes(order.status)),
    [orders],
  );

  return { user, orders, activeOrders, pastOrders, loading, error };
}
