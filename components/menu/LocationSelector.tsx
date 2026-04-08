import { ChangeEvent } from 'react';

interface Location {
  id: string;
  name: string;
}

interface LocationSelectorProps {
  value: string;
  locations: Location[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function LocationSelector({
  value,
  locations,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select Location',
}: LocationSelectorProps) {
  return (
    <div className={className}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-background px-3 py-2 font-body text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-neutral-100"
      >
        <option value="" disabled>
          {disabled ? 'Loading locations...' : placeholder}
        </option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </div>
  );
}
