import type { User } from '@supabase/supabase-js';

interface ReviewFormProps {
  newComment: string;
  onCommentChange: (value: string) => void;
  newRating: number;
  onRatingChange: (value: number) => void;
  displayEmail: boolean;
  onDisplayEmailChange: (value: boolean) => void;
  submitting: boolean;
  error: string | null;
  success: string | null;
  editSuccess: string | null;
  user: User | null;
  userHasCommented: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ReviewForm({
  newComment,
  onCommentChange,
  newRating,
  onRatingChange,
  displayEmail,
  onDisplayEmailChange,
  submitting,
  error,
  success,
  editSuccess,
  user,
  userHasCommented,
  onSubmit,
}: ReviewFormProps) {
  return (
    <div className="p-4 rounded-lg bg-base-200 space-y-3">
      <h3 className="text-xl font-heading font-bold">Leave a review</h3>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Share your thoughts about this item..."
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={400}
          disabled={!user || submitting}
        />

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm">Rating:</p>
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            return (
              <button
                type="button"
                key={value}
                onClick={() => onRatingChange(value)}
                className="text-xl"
                aria-label={`Set rating to ${value} star${value > 1 ? 's' : ''}`}
                disabled={!user || submitting}
              >
                <span className={value <= newRating ? 'text-rating' : 'text-base-content/25'}>★</span>
              </button>
            );
          })}

          <label className="label cursor-pointer gap-2 p-0 ml-auto">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={displayEmail}
              onChange={(e) => onDisplayEmailChange(e.target.checked)}
              disabled={!user || submitting}
            />
            <span className="label-text text-xs">Show my email</span>
          </label>
        </div>

        {!user && <p className="text-sm text-base-content/70">Sign in to submit a comment.</p>}
        {userHasCommented && <p className="text-sm text-base-content/70">Editing your existing review for this item.</p>}
        {error && <p className="text-sm text-error">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}
        {editSuccess && <p className="text-sm text-success">{editSuccess}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white"
            disabled={!user || submitting}
          >
            {submitting ? 'Saving...' : userHasCommented ? 'Update Comment' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
