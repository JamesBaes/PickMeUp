"use client";

import { formatPhoneNumber } from "@/helpers/checkoutValidation";

interface ContactDetailsFormProps {
  email: string;
  phone: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  errors: {
    email?: string;
    phone?: string;
  };
}

export default function ContactDetailsForm({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
  errors,
}: ContactDetailsFormProps) {
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    onPhoneChange(formatted);
  };

  return (
    <div className="mb-6">
      <h3 className="text-gray-900 font-medium mb-4">Contact details</h3>
      <div className="space-y-3">
        <div>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        <div>
          <input
            type="tel"
            placeholder="(123) 456-7890"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
