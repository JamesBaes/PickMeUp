interface ClearCartModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ClearCartModal({ onConfirm, onCancel }: ClearCartModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <h3 className="font-heading text-xl font-bold text-neutral-900">Empty your cart?</h3>
        <p className="mt-2 font-body text-sm text-neutral-600">Are you sure you want to remove all items from your cart?</p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-lg bg-accent py-2.5 font-heading text-sm font-semibold text-white hover:bg-secondary transition-colors"
            onClick={onConfirm}
          >
            Yes, clear it
          </button>
          <button
            className="flex-1 rounded-lg border border-neutral-300 py-2.5 font-heading text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
            onClick={onCancel}
          >
            No, keep it
          </button>
        </div>
      </div>
    </div>
  );
}
