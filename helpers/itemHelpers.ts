export interface ItemComment {
  id: string;
  authorName: string;
  comment: string;
  createdAt: string | null;
  stars: number | null;
  userId: string | null;
}

export interface NewCommentPayload {
  comment: string;
  stars: number;
  user_id: string;
  item_name: string;
  restaurant_id: number | null;
  display_email: boolean;
  email?: string;
}

export const getFirstString = (
  row: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

export const getCommentsItemId = (row: Record<string, unknown>): string | null => {
  const value = row.item_id;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
};

export const getCommentsItemName = (row: Record<string, unknown>): string | null => {
  return getFirstString(row, ['item_name', 'menu_item_name', 'item']);
};

export const normalizeItemName = (value: string): string =>
  value.replace(/_/g, ' ').trim().replace(/\s+/g, ' ').toLowerCase();

export const getBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

export const toItemComment = (row: Record<string, unknown>): ItemComment | null => {
  const commentText = getFirstString(row, ['comment', 'content', 'message', 'text', 'body']);
  if (!commentText) return null;

  const idValue = row.id;
  const createdAt = getFirstString(row, ['created_at', 'updated_at']);
  const id =
    typeof idValue === 'string' && idValue.trim().length > 0
      ? idValue
      : `comment-${commentText.slice(0, 24)}-${createdAt ?? 'unknown-date'}`;

  const shouldDisplayEmail = getBoolean(row.display_email);
  const authorName = shouldDisplayEmail
    ? (getFirstString(row, ['user_email', 'email', 'user_name', 'author_name', 'name', 'display_name', 'username']) ?? 'Anonymous')
    : 'Anonymous';

  const starsValue = row.stars;
  const stars =
    typeof starsValue === 'number'
      ? Math.max(1, Math.min(5, Math.round(starsValue)))
      : typeof starsValue === 'string' && starsValue.trim().length > 0
        ? Math.max(1, Math.min(5, Math.round(Number(starsValue))))
        : null;

  const userIdValue = row.user_id;
  const userId =
    typeof userIdValue === 'string' && userIdValue.trim().length > 0
      ? userIdValue
      : null;

  return {
    id,
    authorName,
    comment: commentText,
    createdAt,
    stars: Number.isNaN(stars ?? Number.NaN) ? null : stars,
    userId,
  };
};

export const formatCommentDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatItemPageName = (name: string): string =>
  name
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
