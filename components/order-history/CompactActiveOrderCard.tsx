import { Fragment } from 'react';
import { Order, STEP_ORDER, formatDate, formatCurrency, getStepIndex, getStatusHeading } from '@/helpers/orderHelpers';
import { formatItemName } from '@/helpers/menuHelpers';

interface CompactActiveOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export default function CompactActiveOrderCard({ order, onViewDetails }: CompactActiveOrderCardProps) {
  const currentIndex = getStepIndex(order.status);

  return (
    <div className="relative bg-background rounded-[18px] border border-stone-200 shadow-[0_6px_18px_rgba(0,0,0,0.07)] overflow-hidden">
      <div className="h-1 bg-accent"></div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatDate(order.created_at)}</p>
            <p className="text-xs text-neutral-500 truncate">{order.location ?? 'Pick Up Location'}</p>
          </div>
          <p className="text-lg font-heading font-bold text-neutral-900 shrink-0">
            {formatCurrency(order.total_cents)}
          </p>
        </div>

        {/* Compact stepper */}
        <div className="flex items-center gap-1 mb-3">
          {STEP_ORDER.map((step, index) => {
            const done = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <Fragment key={step.key}>
                {index > 0 && (
                  <div className={`flex-1 h-0.5 rounded-full ${index <= currentIndex ? 'bg-success' : 'bg-stone-200'}`} />
                )}
                <div
                  title={step.label}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${done ? 'bg-success border-success text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-500'}`}
                >
                  {step.key === 'in_progress' && isCurrent ? '🍳' : index + 1}
                </div>
              </Fragment>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-neutral-600 mb-3">{getStatusHeading(order.status)}</p>

        <ul className="flex flex-col gap-1 text-xs mb-4">
          {order.items.slice(0, 3).map((item, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
              <span className="font-medium text-neutral-700 truncate">{formatItemName(item.name)}</span>
              <span className="text-neutral-400 shrink-0">×{item.quantity}</span>
            </li>
          ))}
          {order.items.length > 3 && (
            <li className="text-neutral-400 pl-2.5">+{order.items.length - 3} more</li>
          )}
        </ul>

        <button
          onClick={() => onViewDetails(order)}
          className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading w-full"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
