export interface ConfirmationOrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url: string;
}

export type ConfirmationOrderStatus = 'paid' | 'in_progress' | 'ready' | 'completed';

export interface OrderConfirmationData {
  id: string;
  orderNumber: string;
  date: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  items: ConfirmationOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  pickupTime?: string | null;
  status: ConfirmationOrderStatus;
  locationName?: string | null;
}

export const CONFIRMATION_STEPS: { key: ConfirmationOrderStatus; label: string; icon: string }[] = [
  { key: 'paid',        label: 'Order Placed', icon: '1' },
  { key: 'in_progress', label: 'Preparing',    icon: '2' },
  { key: 'ready',       label: 'Ready',        icon: '3' },
  { key: 'completed',   label: 'Completed',    icon: '4' },
];

export const STATUS_INDEX: Record<ConfirmationOrderStatus, number> = {
  paid: 0,
  in_progress: 1,
  ready: 2,
  completed: 3,
};
