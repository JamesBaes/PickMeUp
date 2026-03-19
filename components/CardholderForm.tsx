"use client";

import { sanitizeNameInput } from "@/helpers/checkoutValidation";

interface CardholderFormProps {
  name: string;
  onNameChange: (name: string) => void;
  error?: string;
}

export default function CardholderForm({
  name,
  onNameChange,
  error,
}: CardholderFormProps) {
  const nameErrorId = error ? "cardholder-name-error" : undefined;

  return (
    <div className="mb-6">
      <h3 className="text-neutral-900 font-medium mb-3">Cardholder</h3>
      <div>
        <label htmlFor="cardholder-name" className="block text-sm text-neutral-700 mb-1">
          Full name on card
        </label>
        <input
          id="cardholder-name"
          type="text"
          placeholder="Full name on card"
          value={name}
          onChange={(e) => onNameChange(sanitizeNameInput(e.target.value))}
          autoComplete="cc-name"
          maxLength={50}
          aria-invalid={Boolean(error)}
          aria-describedby={nameErrorId}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-muted"
        />
        {error && <p id="cardholder-name-error" className="mt-1 text-sm text-danger-dark">{error}</p>}
      </div>
    </div>
  );
}
