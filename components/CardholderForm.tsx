"use client";

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
  return (
    <div className="mb-6">
      <h3 className="text-gray-900 font-medium mb-3">Cardholder</h3>
      <div>
        <input
          type="text"
          placeholder="Full name on card"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
