export type OrderStatus =
  | 'paid'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  image: string | undefined;
}

export interface Order {
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

export const TAX_RATE = 0.13;
export const ORDER_DETAILS_SNAPSHOT_PREFIX = 'order-details:';
export const ACTIVE_STATUSES: OrderStatus[] = ['paid', 'in_progress', 'ready'];
export const PAST_STATUSES: OrderStatus[] = ['completed', 'refunded'];

export const STEP_ORDER: Array<{ key: OrderStatus; label: string }> = [
  { key: 'paid', label: 'Order Placed' },
  { key: 'in_progress', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

export const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

export const normalizeItems = (value: unknown): OrderItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const itemId = raw.itemId != null ? String(raw.itemId) : '';
      const name = typeof raw.name === 'string' ? raw.name : 'Item';
      const quantity = typeof raw.quantity === 'number' ? raw.quantity : 1;
      const priceCents =
        typeof raw.priceCents === 'number'
          ? raw.priceCents
          : typeof raw.price === 'number'
            ? Math.round(raw.price * 100)
            : 0;
      const image = typeof raw.image === 'string' ? raw.image : undefined;
      return { itemId, name, quantity, priceCents, image };
    })
    .filter((item): item is OrderItem => item !== null);
};

export const normalizeStatus = (value: unknown): OrderStatus => {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['refunded'].includes(raw)) return 'refunded';
  if (['completed', 'picked_up', 'picked up', 'pickedup', 'collected'].includes(raw)) return 'completed';
  if (['ready', 'awaiting_pickup', 'awaiting pickup'].includes(raw)) return 'ready';
  if (['in_progress', 'in progress', 'preparing', 'processing'].includes(raw)) return 'in_progress';
  return 'paid';
};

export const getStepIndex = (status: OrderStatus) => {
  const index = STEP_ORDER.findIndex((step) => step.key === status);
  return index === -1 ? 0 : index;
};

export const getStatusHeading = (status: OrderStatus) => {
  switch (status) {
    case 'paid': return 'Order Received';
    case 'in_progress': return 'Order Being Prepared';
    case 'ready': return 'Ready for Pick-Up';
    case 'completed': return 'Order Completed';
    default: return 'Order Status';
  }
};

export const buildOrderDetailsSnapshot = (order: Order) => {
  const total = Number((order.total_cents / 100).toFixed(2));
  const subtotal = Number((total / (1 + TAX_RATE)).toFixed(2));
  const tax = Number((total - subtotal).toFixed(2));
  return {
    id: order.id,
    orderNumber: `ORD-${order.id.slice(-8).toUpperCase()}`,
    date: formatDate(order.created_at),
    paymentMethod: 'Card',
    customerName: order.customer_name,
    customerEmail: order.customer_email ?? 'N/A',
    customerPhone: order.customer_phone,
    billingAddress: order.location ?? 'N/A',
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Number((item.priceCents / 100).toFixed(2)),
      image_url: item.image ?? '',
    })),
    subtotal,
    tax,
    total,
    status: order.status,
    pickupTime: order.pickup_time,
  };
};
