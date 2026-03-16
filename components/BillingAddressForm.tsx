"use client";

interface BillingAddressFormProps {
  country: string;
  address: string;
  onCountryChange: (country: string) => void;
  onAddressChange: (address: string) => void;
  errors: {
    address?: string;
  };
}

export default function BillingAddressForm({
  country,
  address,
  onCountryChange,
  onAddressChange,
  errors,
}: BillingAddressFormProps) {
  const addressErrorId = errors.address ? "billing-address-error" : undefined;

  return (
    <div className="mb-6">
      <h3 className="text-gray-900 font-medium mb-3">Billing address</h3>
      <div className="space-y-3">
        <label htmlFor="billing-country" className="block text-sm text-gray-700 mb-1">
          Country
        </label>
        <select
          id="billing-country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          autoComplete="country-name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Canada">Canada</option>
          <option value="United States">United States</option>
          <option value="Mexico">Mexico</option>
        </select>
        <div>
          <label htmlFor="billing-address" className="block text-sm text-gray-700 mb-1">
            Address
          </label>
          <input
            id="billing-address"
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={addressErrorId}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.address && (
            <p id="billing-address-error" className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
}
