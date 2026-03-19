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
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={appliedPromo || inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        placeholder="Promo code"
        disabled={!!appliedPromo}
        className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-muted disabled:bg-neutral-100"
      />
      {!appliedPromo ? (
        <button
          onClick={handleApply}
          className="w-full sm:w-auto px-6 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
        >
          Apply
        </button>
      ) : (
        <button
          onClick={onRemove}
          className="w-full sm:w-auto px-6 py-2 bg-danger-subtle text-danger-text rounded-lg hover:bg-danger-border transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
