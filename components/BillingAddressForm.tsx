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
  return (
    <div className="mb-6">
      <h3 className="text-gray-900 font-medium mb-3">Billing address</h3>
      <div className="space-y-3">
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Canada">Canada</option>
          <option value="United States">United States</option>
          <option value="Mexico">Mexico</option>
        </select>
        <div>
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
}
