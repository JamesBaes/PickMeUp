"use client";

interface DeleteAccountModalProps {
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAccountModal = ({ isDeleting, error, onConfirm, onCancel }: DeleteAccountModalProps) => (
  <dialog open className="modal">
    <div className="modal-box rounded-2xl border border-stone-200 shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
      <h3 className="font-heading font-bold text-xl text-neutral-900 mb-2">Delete Account</h3>
      <p className="text-sm text-neutral-500 py-3">
        This action is permanent and cannot be undone. Your favourites and cart will be deleted.
      </p>
      {error && (
        <div role="alert" className="alert alert-error mb-4">
          <span className="text-sm">{error}</span>
        </div>
      )}
      <div className="modal-action">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="btn bg-white hover:bg-stone-50 border-stone-300 text-neutral-700 font-heading disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="btn bg-error hover:bg-danger-text border-0 text-white font-heading disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
        </button>
      </div>
    </div>
    <div className="modal-backdrop" onClick={!isDeleting ? onCancel : undefined} />
  </dialog>
);
