'use client';

import { useEffect, useState } from 'react';
import supabase from '@/utils/supabase/client';
import { useAuth } from '@/context/authContext';
import { stripInjectionChars } from '@/helpers/checkoutValidation';
import {
  ItemComment,
  NewCommentPayload,
  toItemComment,
  getCommentsItemId,
  getCommentsItemName,
  normalizeItemName,
} from '@/helpers/itemHelpers';
import { MenuItem } from '@/types';

export function useItemComments(itemId: string, item: MenuItem | null) {
  const { user } = useAuth();

  const [comments, setComments] = useState<ItemComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [displayEmail, setDisplayEmail] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentRating, setEditingCommentRating] = useState(5);
  const [updatingComment, setUpdatingComment] = useState(false);
  const [editCommentError, setEditCommentError] = useState<string | null>(null);
  const [editCommentSuccess, setEditCommentSuccess] = useState<string | null>(null);

  const userHasCommented = Boolean(user && comments.some((c) => c.userId === user.id));
  const currentUserComment = user ? (comments.find((c) => c.userId === user.id) ?? null) : null;

  useEffect(() => {
    if (!user) return;
    if (currentUserComment) {
      setNewComment(currentUserComment.comment);
      setNewRating(currentUserComment.stars ?? 5);
      return;
    }
    setNewComment('');
    setNewRating(5);
    setDisplayEmail(false);
  }, [user, currentUserComment?.id]);

  const fetchComments = async (itemName: string | null) => {
    setCommentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('itemId', itemId);
      if (itemName) params.set('itemName', itemName);

      const response = await fetch(`/api/comments?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to fetch comments');

      const payload = (await response.json()) as { comments?: Record<string, unknown>[] };
      const rows = payload.comments ?? [];
      const normalizedCurrentItemName = itemName ? normalizeItemName(itemName) : null;

      const filtered = rows
        .filter((row) => {
          const rowItemId = getCommentsItemId(row);
          const rowItemName = getCommentsItemName(row);
          const idMatches = rowItemId === itemId;
          const nameMatches =
            Boolean(normalizedCurrentItemName) &&
            typeof rowItemName === 'string' &&
            normalizeItemName(rowItemName) === normalizedCurrentItemName;
          return idMatches || nameMatches;
        })
        .map(toItemComment)
        .filter((c): c is ItemComment => c !== null);

      setComments(filtered);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { setCommentError('Please sign in to leave a comment.'); return; }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) { setCommentError('Please write a comment before submitting.'); return; }
    if (!item) { setCommentError('Item details are not available. Please refresh and try again.'); return; }

    setSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(null);

    try {
      const modRes = await fetch('/api/moderate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedComment }),
      });
      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.flagged) {
          setCommentError(modData.reason ?? 'Your comment was flagged for inappropriate content.');
          return;
        }
      }

      if (userHasCommented) {
        if (!currentUserComment || currentUserComment.id.startsWith('comment-')) {
          setCommentError('Unable to edit this review right now. Please refresh and try again.');
          return;
        }

        const updatePayload: { comment: string; stars: number; display_email: boolean; email?: string } = {
          comment: trimmedComment,
          stars: newRating,
          display_email: displayEmail,
        };
        if (displayEmail && user.email) updatePayload.email = user.email;

        const { error } = await supabase
          .from('comments')
          .update(updatePayload)
          .eq('id', currentUserComment.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setCommentSuccess('Your comment has been updated.');
        await fetchComments(item.name);
        return;
      }

      const { data: existingRows, error: existingError } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_name', item.name)
        .limit(1);

      if (existingError) throw existingError;
      if ((existingRows ?? []).length > 0) { setCommentError('You can only post one review per item.'); return; }

      const parsedRestaurantId = Number(item.restaurant_id);
      const payload: NewCommentPayload = {
        comment: trimmedComment,
        stars: newRating,
        user_id: user.id,
        item_name: item.name,
        restaurant_id: Number.isNaN(parsedRestaurantId) ? null : parsedRestaurantId,
        display_email: displayEmail,
      };
      if (displayEmail && user.email) payload.email = user.email;

      const { error } = await supabase.from('comments').insert(payload);
      if (error) throw error;

      setNewComment('');
      setNewRating(5);
      setDisplayEmail(false);
      setCommentSuccess('Your comment has been posted.');
      await fetchComments(item.name);
    } catch (error: unknown) {
      console.error('Error submitting comment:', error);
      setCommentError(error instanceof Error ? error.message : 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEditingComment = (comment: ItemComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
    setEditingCommentRating(comment.stars ?? 5);
    setEditCommentError(null);
    setEditCommentSuccess(null);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
    setEditingCommentRating(5);
    setEditCommentError(null);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!user) { setEditCommentError('Please sign in to edit your comment.'); return; }

    const trimmedComment = editingCommentText.trim();
    if (!trimmedComment) { setEditCommentError('Comment cannot be empty.'); return; }

    setUpdatingComment(true);
    setEditCommentError(null);
    setEditCommentSuccess(null);

    try {
      const modRes = await fetch('/api/moderate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedComment }),
      });
      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.flagged) {
          setEditCommentError(modData.reason ?? 'Your comment was flagged for inappropriate content.');
          return;
        }
      }

      const { error } = await supabase
        .from('comments')
        .update({ comment: trimmedComment, stars: editingCommentRating })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditCommentSuccess('Your comment has been updated.');
      setEditingCommentId(null);
      setEditingCommentText('');
      setEditingCommentRating(5);
      await fetchComments(item?.name ?? null);
    } catch (error: unknown) {
      console.error('Error updating comment:', error);
      setEditCommentError(error instanceof Error ? error.message : 'Failed to update comment.');
    } finally {
      setUpdatingComment(false);
    }
  };

  return {
    comments,
    commentsLoading,
    fetchComments,
    newComment,
    setNewComment: (v: string) => setNewComment(stripInjectionChars(v)),
    newRating,
    setNewRating,
    displayEmail,
    setDisplayEmail,
    submittingComment,
    commentError,
    commentSuccess,
    userHasCommented,
    editingCommentId,
    editingCommentText,
    setEditingCommentText: (v: string) => setEditingCommentText(stripInjectionChars(v)),
    editingCommentRating,
    setEditingCommentRating,
    updatingComment,
    editCommentError,
    editCommentSuccess,
    handleSubmitComment,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
  };
}
