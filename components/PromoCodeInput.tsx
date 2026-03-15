"use client";

import { useState } from "react";
import { validatePromoCode } from "@/helpers/checkoutValidation";

interface PromoCodeInputProps {
  appliedPromo: string;
  onApply: (code: string) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}

export default function PromoCodeInput({
  appliedPromo,
  onApply,
  onRemove,
  onError,
}: PromoCodeInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleApply = () => {
    if (validatePromoCode(inputValue)) {
      onApply(inputValue.toUpperCase());
    } else {
      onError("Invalid promo code");
      setTimeout(() => onError(""), 3000);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={appliedPromo || inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        placeholder="Promo code"
        disabled={!!appliedPromo}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      {!appliedPromo ? (
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Apply
        </button>
      ) : (
        <button
          onClick={onRemove}
          className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
