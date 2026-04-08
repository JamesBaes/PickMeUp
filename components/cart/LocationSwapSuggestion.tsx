import { MenuItem } from '@/types';
import { formatItemName } from '@/helpers/menuHelpers';

interface Suggestion {
  targetLocation: { id: string; name: string };
  swaps: Array<{ oldItemId: string; newItem: MenuItem }>;
  unavailableNames: string[];
}

interface LocationSwapSuggestionProps {
  isChecking: boolean;
  suggestion: Suggestion | null;
  onSwap: () => void;
  onDismiss: () => void;
}

export default function LocationSwapSuggestion({
  isChecking,
  suggestion,
  onSwap,
  onDismiss,
}: LocationSwapSuggestionProps) {
  if (isChecking) {
    return <p className="mt-2 font-body text-xs text-neutral-400">Checking availability at this location…</p>;
  }

  if (!suggestion) return null;

  const { targetLocation, swaps, unavailableNames } = suggestion;

  return (
    <div className="mt-3 rounded-lg border border-info-border bg-info-bg p-3">
      <p className="font-heading text-sm font-semibold text-info-dark">
        Switch to {targetLocation.name}?
      </p>
      <p className="mt-1 font-body text-xs text-info-hover">
        {swaps.length} of your item{swaps.length === 1 ? '' : 's'} {swaps.length === 1 ? 'is' : 'are'} available at this location.
      </p>
      {unavailableNames.length > 0 && (
        <p className="mt-1 font-body text-xs text-warning-text">
          Not available here: {unavailableNames.map(formatItemName).join(', ')}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          className="rounded-md bg-info px-3 py-1.5 font-body text-xs text-white hover:bg-info-hover transition-colors"
          onClick={onSwap}
        >
          Switch {swaps.length} item{swaps.length === 1 ? '' : 's'}
        </button>
        <button
          className="rounded-md border border-info-border px-3 py-1.5 font-body text-xs text-info-hover hover:bg-info-border transition-colors"
          onClick={onDismiss}
        >
          Keep as-is
        </button>
      </div>
    </div>
  );
}
