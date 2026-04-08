import { Order, formatDate, formatCurrency } from '@/helpers/orderHelpers';
import { formatItemName } from '@/helpers/menuHelpers';

interface PastOrderCardProps {
  order: Order;
  expanded: boolean;
  onToggleExpand: (orderId: string) => void;
  onOrderAgain: (order: Order) => void;
  onViewDetails: (order: Order) => void;
}

export default function PastOrderCard({
  order,
  expanded,
  onToggleExpand,
  onOrderAgain,
  onViewDetails,
}: PastOrderCardProps) {
  const visibleItems = expanded ? order.items : order.items.slice(0, 3);

  return (
    <div className="bg-background rounded-2xl border border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start px-5 pt-5 pb-4">
        <div className="min-w-0">
          <p className="font-heading font-semibold text-neutral-900 text-base leading-tight">
            {formatDate(order.created_at)}
          </p>
          <p className="text-sm text-accent mt-0.5 wrap-break-word">{order.location ?? 'Brampton, ON'}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${order.status === 'completed' ? 'bg-success-subtle text-success-dark' : 'bg-danger-subtle text-danger-text'}`}>
            {order.status === 'completed' ? 'Completed' : 'Refunded'}
          </span>
          <p className="text-[11px] text-neutral-400 mt-1.5 break-all">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="font-heading font-bold text-neutral-900 text-lg mt-0.5">
            {formatCurrency(order.total_cents)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-stone-100 px-5 py-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">Items</p>
        <ul className="text-sm text-neutral-600 space-y-1">
          {visibleItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 wrap-break-word">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
              <span className="font-semibold">{formatItemName(item.name)}</span>
              <span className="text-neutral-400 text-xs">×{item.quantity}</span>
            </li>
          ))}
          {order.items.length > 3 && (
            <li>
              <button
                onClick={() => onToggleExpand(order.id)}
                className="text-xs text-accent hover:underline pl-3.5"
              >
                {expanded
                  ? 'Show less'
                  : `+${order.items.length - 3} more item${order.items.length - 3 > 1 ? 's' : ''}`}
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Actions */}
      <div className="border-t border-stone-100 px-5 py-3 flex gap-2">
        <button
          onClick={() => onOrderAgain(order)}
          className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading px-5 rounded-lg"
        >
          Order Again
        </button>
        <button
          onClick={() => onViewDetails(order)}
          className="btn btn-sm bg-transparent hover:bg-stone-50 border border-stone-300 text-neutral-700 font-heading px-5 rounded-lg"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
