import { Fragment } from 'react';
import { Order, STEP_ORDER, formatDate, formatCurrency, getStepIndex, getStatusHeading } from '@/helpers/orderHelpers';
import { formatItemName } from '@/helpers/menuHelpers';

interface ActiveOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export default function ActiveOrderCard({ order, onViewDetails }: ActiveOrderCardProps) {
  const currentIndex = getStepIndex(order.status);

  return (
    <div className="relative bg-background rounded-[22px] border border-stone-200 shadow-[0_10px_28px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="h-1.5 bg-accent"></div>

      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="font-heading font-semibold text-neutral-900">{formatDate(order.created_at)}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{order.location ?? 'Pick Up Location'}</p>
            <p className="text-xs text-neutral-400 mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-3xl font-heading font-bold text-neutral-900 shrink-0">
            {formatCurrency(order.total_cents)}
          </p>
        </div>

        {/* Progress stepper */}
        <div className="mb-6">
          <div className="w-full overflow-x-auto pb-2 flex justify-center">
            <div className="flex items-start px-1">
              {STEP_ORDER.map((step, index) => {
                const done = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                  <Fragment key={step.key}>
                    {index > 0 && (
                      <div className={`w-8 sm:w-12 md:w-14 h-1 rounded-full mt-4 mx-1 ${index <= currentIndex ? 'bg-success' : 'bg-stone-200'}`} />
                    )}
                    <div className="w-[62px] sm:w-[78px] md:w-20 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? 'bg-success border-success text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-500'}`}>
                        {step.key === 'in_progress' && isCurrent ? '👨‍🍳' : index + 1}
                      </div>
                      <p className={`text-[11px] leading-tight text-center mt-2 px-1 ${done ? 'text-neutral-800' : 'text-neutral-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-heading font-semibold text-neutral-900">
            {getStatusHeading(order.status)}
          </h3>
        </div>

        <div className="flex flex-wrap gap-8 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">Date</p>
            <p className="text-sm font-medium text-neutral-900">{formatDate(order.created_at)}</p>
            <p className="text-sm text-neutral-500">{order.location ?? 'Pick Up Location'}</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">Items</p>
            <ul className="flex flex-col gap-1.5 text-sm max-h-40 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                  <span className="font-medium text-neutral-800">{formatItemName(item.name)}</span>
                  <span className="text-neutral-400 text-xs">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onViewDetails(order)}
            className="btn bg-accent hover:bg-secondary border-0 text-white font-heading px-6"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
