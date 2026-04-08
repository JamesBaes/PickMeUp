import { CartItem } from '@/types';
import { formatItemName } from '@/helpers/menuHelpers';

interface ConflictingItemsListProps {
  items: CartItem[];
  getDisplayName: (restaurantId: string) => string;
  onRemove: (itemId: string) => void;
  maxHeight?: string;
  padding?: string;
}

export default function ConflictingItemsList({
  items,
  getDisplayName,
  onRemove,
  maxHeight = 'max-h-40',
  padding = 'p-3',
}: ConflictingItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className={`mt-3 rounded-lg border border-danger-border bg-danger-subtle ${padding}`}>
      <p className="font-body text-sm font-semibold text-danger-text">Conflicting items:</p>
      <ul className={`mt-2 ${maxHeight} space-y-2 overflow-y-auto pr-1 font-body text-sm text-danger-text`}>
        {items.map((item) => (
          <li key={`conflict-${item.item_id}`} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-danger-text">{formatItemName(item.name)}</span>
              <span className="text-xs text-danger">
                Qty {item.quantity} &middot; {getDisplayName(item.restaurant_id)}
              </span>
            </div>
            <button
              className="shrink-0 rounded-md border border-danger-border px-2 py-1 text-xs text-danger-dark transition-colors hover:bg-danger-subtle"
              onClick={() => onRemove(item.item_id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
