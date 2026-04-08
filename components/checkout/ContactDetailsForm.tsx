"use client";

import { formatPhoneNumber, stripInjectionChars } from "@/helpers/checkoutValidation";

interface ContactDetailsFormProps {
  email: string;
  phone: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  errors: {
    email?: string;
    phone?: string;
  };
  isGuest?: boolean;
}

export default function ContactDetailsForm({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
  errors,
  isGuest,
}: ContactDetailsFormProps) {
  const emailErrorId = errors.email ? "contact-email-error" : undefined;
  const phoneErrorId = errors.phone ? "contact-phone-error" : undefined;

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    onPhoneChange(formatted);
  };

  return (
    <div className="mb-6">
      <h3 className="text-neutral-900 font-medium mb-4">Contact details</h3>
      <div className="space-y-3">
        <div>
          <label htmlFor="contact-email" className="block text-sm text-neutral-700 mb-1">
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => onEmailChange(stripInjectionChars(e.target.value))}
            autoComplete="email"
            maxLength={50}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={emailErrorId}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-muted"
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-1 text-sm text-danger-dark">{errors.email}</p>
          )}
          {isGuest && !errors.email && (
            <p className="mt-1 text-sm text-red-500">Enter a valid email — your receipt will be sent here.</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-phone" className="block text-sm text-neutral-700 mb-1">
            Phone number
          </label>
          <input
            id="contact-phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={phoneErrorId}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-muted"
          />
          {errors.phone && (
            <p id="contact-phone-error" className="mt-1 text-sm text-danger-dark">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
