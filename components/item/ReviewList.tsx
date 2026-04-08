import type { User } from '@supabase/supabase-js';
import { ItemComment, formatCommentDate } from '@/helpers/itemHelpers';

interface ReviewListProps {
  comments: ItemComment[];
  loading: boolean;
  user: User | null;
  editingCommentId: string | null;
  editingCommentText: string;
  onEditingTextChange: (value: string) => void;
  editingCommentRating: number;
  onEditingRatingChange: (value: number) => void;
  updatingComment: boolean;
  editCommentError: string | null;
  onStartEditing: (comment: ItemComment) => void;
  onCancelEditing: () => void;
  onUpdateComment: (commentId: string) => void;
}

function StarRating({ stars }: { stars: number | null }) {
  if (!stars) return null;
  return (
    <div className="flex items-center gap-1" aria-label={`${stars} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? 'text-rating' : 'text-base-content/25'} aria-hidden="true">★</span>
      ))}
    </div>
  );
}

function EditableStarRating({
  rating,
  onSelect,
  disabled,
}: {
  rating: number;
  onSelect: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1" aria-label="Edit rating">
      {Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            disabled={disabled}
            className="text-lg"
            aria-label={`Set rating to ${value} star${value > 1 ? 's' : ''}`}
          >
            <span className={value <= rating ? 'text-rating' : 'text-base-content/25'}>★</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewList({
  comments,
  loading,
  user,
  editingCommentId,
  editingCommentText,
  onEditingTextChange,
  editingCommentRating,
  onEditingRatingChange,
  updatingComment,
  editCommentError,
  onStartEditing,
  onCancelEditing,
  onUpdateComment,
}: ReviewListProps) {
  return (
    <div className="max-h-[580px] overflow-y-auto rounded-lg bg-base-200">
      <div className="sticky top-0 z-10 bg-base-200 px-4 py-3 border-b border-base-300">
        <h3 className="text-xl font-heading font-bold">Community Reviews</h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 bg-base-100 rounded-lg">
            <p className="text-sm text-base-content/70">No comments yet for this item.</p>
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {comments.map((comment) => {
              const formattedDate = formatCommentDate(comment.createdAt);
              const canEdit = Boolean(user && comment.userId === user.id && !comment.id.startsWith('comment-'));
              const isEditing = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <div>
                      <p className="font-semibold text-sm">{comment.authorName}</p>
                      {isEditing ? (
                        <EditableStarRating
                          rating={editingCommentRating}
                          onSelect={onEditingRatingChange}
                          disabled={updatingComment}
                        />
                      ) : (
                        <StarRating stars={comment.stars} />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {formattedDate && (
                        <p className="text-xs text-base-content/60 whitespace-nowrap">{formattedDate}</p>
                      )}
                      {canEdit && !isEditing && (
                        <button type="button" className="btn btn-xs" onClick={() => onStartEditing(comment)}>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => onEditingTextChange(e.target.value)}
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        maxLength={400}
                        disabled={updatingComment}
                      />
                      {editCommentError && <p className="text-sm text-error">{editCommentError}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-xs bg-accent hover:bg-secondary border-0 text-white"
                          onClick={() => onUpdateComment(comment.id)}
                          disabled={updatingComment}
                        >
                          {updatingComment ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={onCancelEditing}
                          disabled={updatingComment}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{comment.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
