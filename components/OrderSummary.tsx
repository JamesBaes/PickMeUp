"use client";

import Image from "next/image";
import PromoCodeInput from "@/components/PromoCodeInput";
import { formatCurrency } from "@/helpers/checkoutHelpers";

interface CartItem {
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
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg p-8 h-fit">
      {/* Logo */}
      <div className="mb-8">
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
        {cartItems.map((item, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg flex-shrink-0 relative overflow-hidden bg-gray-100">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 font-medium">{item.name}</h3>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-gray-900 font-medium">
              {formatCurrency(item.priceCents * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalCents)}</span>
        </div>

        {/* Promo Code Section */}
        <PromoCodeInput
          appliedPromo={appliedPromo}
          onApply={onPromoApply}
          onRemove={onPromoRemove}
          onError={onPromoError}
        />

        {appliedPromo && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium">
                {appliedPromo}
              </span>
              <span className="text-sm text-gray-500">
                {promoDiscount}% off
              </span>
            </span>
            <span>-{formatCurrency(discountCents)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-500 text-sm">
          <span>Tax</span>
          <span>Enter address to calculate</span>
        </div>

        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
          <span>Total due</span>
          <span>{formatCurrency(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
