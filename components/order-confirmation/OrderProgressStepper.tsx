import { ConfirmationOrderStatus, CONFIRMATION_STEPS, STATUS_INDEX } from './types';

interface OrderProgressStepperProps {
  status: ConfirmationOrderStatus;
}

export default function OrderProgressStepper({ status }: OrderProgressStepperProps) {
  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between">
        {CONFIRMATION_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isCompleted || isActive
                      ? 'bg-success text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {step.icon}
                </div>
                <span
                  className={`text-xs font-body text-center whitespace-nowrap ${
                    isCompleted || isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < CONFIRMATION_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 ${
                    i < currentIndex ? 'bg-success' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
