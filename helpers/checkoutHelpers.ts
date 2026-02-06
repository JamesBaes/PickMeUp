/**
 * Utility functions for checkout calculations and formatting
 */

interface CartItem {
  priceCents: number;
  quantity: number;
}

export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
};

export const calculateDiscount = (
  subtotalCents: number,
  discountPercentage: number,
): number => {
  return Math.round(subtotalCents * (discountPercentage / 100));
};

export const calculateTotal = (
  subtotalCents: number,
  discountCents: number,
  taxCents: number,
): number => {
  return subtotalCents - discountCents + taxCents;
};

export const formatCurrency = (cents: number): string => {
  return `CA$${(cents / 100).toFixed(2)}`;
};

export const generatePickupTime = (): string => {
  return new Date(Date.now() + 30 * 60000).toISOString();
};
