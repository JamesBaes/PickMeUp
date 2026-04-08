import { CartItem, MenuItem } from '@/types';
import ConflictingItemsList from './ConflictingItemsList';

interface Location {
  id: string;
  name: string;
}

interface Suggestion {
  targetLocation: { id: string; name: string };
  swaps: Array<{ oldItemId: string; newItem: MenuItem }>;
  unavailableNames: string[];
}

interface CheckoutGuardModalProps {
  currentLocation: Location | null;
  mismatchedItems: CartItem[];
  activeSwaps: Array<{ oldItemId: string; newItem: MenuItem }>;
  unavailableMismatchedItems: CartItem[];
  unavailableDisplayNames: string[];
  isCheckingSwap: boolean;
  locationSwapSuggestion: Suggestion | null;
  locations: Location[];
  getDisplayName: (restaurantId: string) => string;
  onRemove: (itemId: string) => void;
  onSwap: () => void;
  onRemoveUnavailable: () => void;
  onLocationChange: (locationId: string) => void;
  onClose: () => void;
}

export default function CheckoutGuardModal({
  currentLocation,
  mismatchedItems,
  activeSwaps,
  unavailableMismatchedItems,
  unavailableDisplayNames,
  isCheckingSwap,
  locationSwapSuggestion,
  locations,
  getDisplayName,
  onRemove,
  onSwap,
  onRemoveUnavailable,
  onLocationChange,
  onClose,
}: CheckoutGuardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-heading text-2xl font-bold text-neutral-900">Checkout Location Mismatch</h3>

        {!currentLocation ? (
          <p className="mt-3 font-body text-neutral-700">
            Please choose a pickup location before checking out.
          </p>
        ) : (
          <>
            <p className="mt-3 font-body text-neutral-700">
              Your selected location is <span className="font-semibold">{currentLocation.name}</span>, but your cart has items from other locations.
            </p>
            <p className="mt-2 font-body text-sm text-neutral-600">
              You can switch items that exist in {currentLocation.name}, remove unavailable ones, or remove all conflicting items.
            </p>

            <ConflictingItemsList
              items={mismatchedItems}
              getDisplayName={getDisplayName}
              onRemove={onRemove}
              maxHeight="max-h-52"
              padding="p-4 mt-4"
            />

            {isCheckingSwap && (
              <p className="mt-3 font-body text-xs text-neutral-400">Checking availability at {currentLocation.name}...</p>
            )}

            {!isCheckingSwap && locationSwapSuggestion && locationSwapSuggestion.targetLocation.id === currentLocation.id && (
              <div className="mt-4 rounded-lg border border-info-border bg-info-bg p-4">
                <p className="font-heading text-sm font-semibold text-info-dark">
                  {activeSwaps.length} of {mismatchedItems.length} conflicting item{mismatchedItems.length === 1 ? '' : 's'} can be switched to {currentLocation.name}
                </p>
                {unavailableDisplayNames.length > 0 && (
                  <p className="mt-1 font-body text-xs text-warning-text">
                    Not available here: {unavailableDisplayNames.join(', ')}
                  </p>
                )}
                <div className="mt-3 grid gap-2">
                  {activeSwaps.length > 0 && (
                    <button
                      className="w-full rounded-lg bg-info py-2 font-body text-sm text-white transition-colors hover:bg-info-hover"
                      onClick={onSwap}
                    >
                      Switch Available Items ({activeSwaps.length})
                    </button>
                  )}
                  {unavailableMismatchedItems.length > 0 && (
                    <button
                      className="w-full rounded-lg border border-warning-highlight bg-warning-bg py-2 font-body text-sm text-warning-text transition-colors hover:bg-warning-bg-hover"
                      onClick={onRemoveUnavailable}
                    >
                      Remove Unavailable Items ({unavailableMismatchedItems.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-2 block font-body text-sm text-neutral-700">Change pickup location</label>
              <select
                value={currentLocation.id}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="" disabled>Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border border-neutral-300 px-4 py-2 font-body text-sm text-neutral-700 hover:bg-neutral-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
