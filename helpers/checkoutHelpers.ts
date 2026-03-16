/**
 * Utility functions for checkout calculations and formatting
 */

interface CartItem {
  // All helper math is in cents to avoid floating-point currency drift.
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
  // Keep display format consistent across checkout and confirmation UIs.
  return `CA$${(cents / 100).toFixed(2)}`;
};

export const generatePickupTime = (): string => {
  return new Date(Date.now() + 30 * 60000).toISOString();
};
