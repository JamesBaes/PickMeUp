"use client";

import Image from "next/image";
import PromoCodeInput from "./PromoCodeInput";
import { formatCurrency } from "@/helpers/checkoutHelpers";

interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  image: string;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  appliedPromo: string;
  promoDiscount: number;
  onPromoApply: (code: string) => void;
  onPromoRemove: () => void;
  onPromoError: (message: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export default function OrderSummary({
  cartItems,
  subtotalCents,
  discountCents,
  taxCents,
  totalCents,
  appliedPromo,
  promoDiscount,
  onPromoApply,
  onPromoRemove,
  onPromoError,
  onQuantityChange,
}: OrderSummaryProps) {
  // Presentation component only: receives fully calculated values from checkout page.
  return (
    <div className="bg-background rounded-lg p-4 sm:p-8 h-fit">
      {/* Logo */}
      <div className="mb-6 sm:mb-8">
        <Image
          src="/gladiator-logo.png"
          alt="Gladiator Logo"
          width={64}
          height={64}
          className="rounded-lg"
        />
      </div>

      {/* Cart Items */}
      <div className="space-y-6 mb-6">
        {cartItems.map((item) => (
          <div key={item.itemId} className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg shrink-0 relative overflow-hidden bg-neutral-100">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-neutral-900 font-medium">
                {item.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(item.itemId, item.quantity - 1)
                  }
                  className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="min-w-6 text-center text-sm text-neutral-700">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(item.itemId, item.quantity + 1)
                  }
                  className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-neutral-900 font-medium text-sm sm:text-base shrink-0">
              {formatCurrency(item.priceCents * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-neutral-700">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalCents)}</span>
        </div>

        {/* Promo Code Section */}
        {/* <PromoCodeInput
          appliedPromo={appliedPromo}
          onApply={onPromoApply}
          onRemove={onPromoRemove}
          onError={onPromoError}
        /> */}

        {appliedPromo && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-success">
            <span className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-sm font-medium">
                {appliedPromo}
              </span>
              <span className="text-sm text-neutral-500">
                {promoDiscount}% off
              </span>
            </span>
            <span className="sm:text-right">
              -{formatCurrency(discountCents)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-neutral-500 text-sm">
          <span>Tax</span>
          <span>{formatCurrency(taxCents)}</span>
        </div>

        <div className="flex justify-between text-lg font-semibold text-neutral-900 pt-3 border-t">
          <span>Total due</span>
          <span>{formatCurrency(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
