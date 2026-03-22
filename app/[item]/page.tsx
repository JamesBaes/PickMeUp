"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types";
import Image from "next/image";
import { useCart } from "@/context/cartContext";
import { useLocation } from "@/context/locationContext";
import { useFavorites } from "@/context/favoritesContext";
import { useAuth } from "@/context/authContext";
import { usePostHog } from "posthog-js/react";
import { stripInjectionChars } from "@/helpers/checkoutValidation";

interface ItemPageProps {
  params: Promise<{
    item: string;
  }>;
}

interface ItemComment {
  id: string;
  authorName: string;
  comment: string;
  createdAt: string | null;
  stars: number | null;
  userId: string | null;
}

interface NewCommentPayload {
  comment: string;
  stars: number;
  user_id: string;
  item_name: string;
  restaurant_id: number | null;
  display_email: boolean;
  email?: string;
}

const getFirstString = (row: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const getCommentsItemId = (row: Record<string, unknown>): string | null => {
  const value = row.item_id;

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return null;
};

const getCommentsItemName = (row: Record<string, unknown>): string | null => {
  return getFirstString(row, ["item_name", "menu_item_name", "item"]);
};

const normalizeItemName = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const getBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
};

const toItemComment = (row: Record<string, unknown>): ItemComment | null => {
  const commentText = getFirstString(row, ["comment", "content", "message", "text", "body"]);

  if (!commentText) {
    return null;
  }

  const idValue = row.id;
  const createdAt = getFirstString(row, ["created_at", "updated_at"]);
  const id =
    typeof idValue === "string" && idValue.trim().length > 0
      ? idValue
      : `comment-${commentText.slice(0, 24)}-${createdAt ?? "unknown-date"}`;

  const shouldDisplayEmail = getBoolean(row.display_email);
  const authorName = shouldDisplayEmail
    ? getFirstString(row, [
        "user_email",
        "email",
        "user_name",
        "author_name",
        "name",
        "display_name",
        "username",
      ]) ?? "Anonymous"
    : "Anonymous";

  const starsValue = row.stars;
  const stars =
    typeof starsValue === "number"
      ? Math.max(1, Math.min(5, Math.round(starsValue)))
      : typeof starsValue === "string" && starsValue.trim().length > 0
      ? Math.max(1, Math.min(5, Math.round(Number(starsValue))))
      : null;

  const userIdValue = row.user_id;
  const userId =
    typeof userIdValue === "string" && userIdValue.trim().length > 0 ? userIdValue : null;

  return {
    id,
    authorName,
    comment: commentText,
    createdAt,
    stars: Number.isNaN(stars ?? Number.NaN) ? null : stars,
    userId,
  };
};

export default function ItemPage({ params }: ItemPageProps) {
  const { item: itemId } = use(params);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [comments, setComments] = useState<ItemComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [displayEmail, setDisplayEmail] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingCommentRating, setEditingCommentRating] = useState(5);
  const [updatingComment, setUpdatingComment] = useState(false);
  const [editCommentError, setEditCommentError] = useState<string | null>(null);
  const [editCommentSuccess, setEditCommentSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { addItem } = useCart();
  const [showNotification, setShowNotification] = useState(false)
  const { currentLocation, isHydrated } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const posthog = usePostHog();

useEffect(() => {
  if (!isHydrated) return;
    fetchItem();
}, [itemId, isHydrated, currentLocation?.id]);

  const fetchItem = async () => {
  setLoading(true);
  try {
    
    let query = supabase
      .from("menu_items_restaurant_locations")
      .select("*")
      .eq("item_id", itemId);

    // Only filter by restaurant_id if a location is selected
    if (currentLocation?.id) {
      const numericId = parseInt(currentLocation.id, 10);
      query = query.eq("restaurant_id", numericId);
    } else {
      console.log("No location selected, fetching any available item");
    }

    const { data, error } = await query.single();


    if (error) throw error;

    const fetchedItem = data as MenuItem;
    setItem(fetchedItem);
    fetchComments(fetchedItem.name);
  } catch (error) {
    console.error("Error fetching item:", error);
    setItem(null);
    setComments([]);
    setCommentsLoading(false);
  } finally {
    setLoading(false);
  }
};

  const fetchComments = async (itemName: string | null) => {
    setCommentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("itemId", itemId);
      if (itemName) {
        params.set("itemName", itemName);
      }

      const response = await fetch(`/api/comments?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const payload = (await response.json()) as { comments?: Record<string, unknown>[] };
      const rows = payload.comments ?? [];
      const normalizedCurrentItemName = itemName ? normalizeItemName(itemName) : null;

      const filteredComments = rows
        .filter((row) => {
          const rowItemId = getCommentsItemId(row);
          const rowItemName = getCommentsItemName(row);

          const idMatches = rowItemId === itemId;
          const nameMatches =
            Boolean(normalizedCurrentItemName) &&
            typeof rowItemName === "string" &&
            normalizeItemName(rowItemName) === normalizedCurrentItemName;

          return idMatches || nameMatches;
        })
        .map(toItemComment)
        .filter((comment): comment is ItemComment => comment !== null);

      setComments(filteredComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const formatCommentDate = (dateString: string | null): string => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (stars: number | null) => {
    if (!stars) {
      return null;
    }

    return (
      <div className="flex items-center gap-1" aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={index < stars ? "text-rating" : "text-base-content/25"}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderEditableStars = (
    selectedRating: number,
    onSelect: (value: number) => void,
    disabled: boolean
  ) => {
    return (
      <div className="flex items-center gap-1" aria-label="Edit rating">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              disabled={disabled}
              className="text-lg"
              aria-label={`Set rating to ${value} star${value > 1 ? "s" : ""}`}
            >
              <span className={value <= selectedRating ? "text-rating" : "text-base-content/25"}>★</span>
            </button>
          );
        })}
      </div>
    );
  };

  const formatName = (name: string): string => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const userHasCommented = Boolean(
    user && comments.some((comment) => comment.userId === user.id)
  );
  const currentUserComment =
    user ? comments.find((comment) => comment.userId === user.id) ?? null : null;

  useEffect(() => {
    if (!user) {
      return;
    }

    if (currentUserComment) {
      setNewComment(currentUserComment.comment);
      setNewRating(currentUserComment.stars ?? 5);
      return;
    }

    setNewComment("");
    setNewRating(5);
    setDisplayEmail(false);
  }, [user, currentUserComment?.id]);

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
    posthog.capture("add_to_cart", {
      item_id: item.item_id,
      item_name: item.name,
      item_price: item.price,
      item_category: item.category,
      quantity,
      source: "item_page",
    });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000)
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setCommentError("Please sign in to leave a comment.");
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      setCommentError("Please write a comment before submitting.");
      return;
    }

    if (!item) {
      setCommentError("Item details are not available. Please refresh and try again.");
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(null);

    try {
      if (userHasCommented) {
        if (!currentUserComment || currentUserComment.id.startsWith("comment-")) {
          setCommentError("Unable to edit this review right now. Please refresh and try again.");
          return;
        }

        const updatePayload: {
          comment: string;
          stars: number;
          display_email: boolean;
          email?: string;
        } = {
          comment: trimmedComment,
          stars: newRating,
          display_email: displayEmail,
        };

        if (displayEmail && user.email) {
          updatePayload.email = user.email;
        }

        const { error } = await supabase
          .from("comments")
          .update(updatePayload)
          .eq("id", currentUserComment.id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setCommentSuccess("Your comment has been updated.");
        await fetchComments(item.name);
        return;
      }

      const { data: existingCommentRows, error: existingCommentError } = await supabase
        .from("comments")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_name", item.name)
        .limit(1);

      if (existingCommentError) {
        throw existingCommentError;
      }

      if ((existingCommentRows ?? []).length > 0) {
        setCommentError("You can only post one review per item.");
        return;
      }

      const parsedRestaurantId = Number(item.restaurant_id);
      const payload: NewCommentPayload = {
        comment: trimmedComment,
        stars: newRating,
        user_id: user.id,
        item_name: item.name,
        restaurant_id: Number.isNaN(parsedRestaurantId) ? null : parsedRestaurantId,
        display_email: displayEmail,
      };

      if (displayEmail && user.email) {
        payload.email = user.email;
      }

      const { error } = await supabase.from("comments").insert(payload);
      if (error) {
        throw error;
      }

      setNewComment("");
      setNewRating(5);
      setDisplayEmail(false);
      setCommentSuccess("Your comment has been posted.");
      await fetchComments(item.name);
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      setCommentError(error?.message ?? "Failed to submit comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEditingComment = (comment: ItemComment) => {
    const existingRating = comment.stars ?? 5;
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
    setEditingCommentRating(existingRating);
    setEditCommentError(null);
    setEditCommentSuccess(null);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingCommentRating(5);
    setEditCommentError(null);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!user) {
      setEditCommentError("Please sign in to edit your comment.");
      return;
    }

    const trimmedComment = editingCommentText.trim();
    if (!trimmedComment) {
      setEditCommentError("Comment cannot be empty.");
      return;
    }

    setUpdatingComment(true);
    setEditCommentError(null);
    setEditCommentSuccess(null);

    try {
      const { error } = await supabase
        .from("comments")
        .update({
          comment: trimmedComment,
          stars: editingCommentRating,
        })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setEditCommentSuccess("Your comment has been updated.");
      setEditingCommentId(null);
      setEditingCommentText("");
      setEditingCommentRating(5);
      await fetchComments(item?.name ?? null);
    } catch (error: any) {
      console.error("Error updating comment:", error);
      setEditCommentError(error?.message ?? "Failed to update comment.");
    } finally {
      setUpdatingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">Item Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="btn bg-accent hover:bg-secondary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">


      <button
        onClick={() => router.back()}
        className="btn btn-ghost mb-4"
      >
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="w-full">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-auto rounded-lg shadow-xl object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
              <span className="text-base-content/50">No Image Available</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-heading font-bold flex-1">
              {formatName(item.name)}
            </h1>
            {/* Favourite button */}
            {user && (
              <button
                onClick={() => toggleFavorite(item)}
                className="p-2 rounded-full hover:bg-base-200 transition-colors shrink-0"
                aria-label={isFavorite(item.item_id) ? "Remove from favourites" : "Add to favourites"}
              >
                {isFavorite(item.item_id) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-danger-dark">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-neutral-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="text-3xl font-bold text-accent">
            ${item.price.toFixed(2)}
          </div>

          <p className="text-lg font-body">{item.description}</p>

          {/* Nutritional Info */}
          <div className="divider"></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-white border-2 bg-neutral-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Calories</p>
              {/* <p className="text-md font-body font-sm capitalize">{item.calories}</p> */}  {/* add this line back after design review LOLLLLLL*/}
              <p className="text-md font-body font-sm capitalize">450 Cal</p>
            </div>
            
            <div className="p-4 border-white border-2 bg-neutral-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Category</p>
              <p className="text-md font-body font-sm capitalize">
                {item.category.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Ingredients */}
          {item.list_of_ingredients && item.list_of_ingredients.length > 0 && (
            <div>
              <h3 className="text-xl font-heading font-bold mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.list_of_ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-base-200"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergy Information */}
          {item.allergy_information && (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                <strong>Allergy Info:</strong> {item.allergy_information}
              </span>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="divider"></div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                className={`btn shadow-sm border-0 btn-circle btn-sm text-lg ${
                  quantity === 1
                    ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                    : 'bg-neutral-400 text-black hover:bg-neutral-500'
                }`}
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="btn shadow-sm border-0 btn-circle btn-sm text-lg text-black bg-neutral-400 hover:bg-neutral-500"
              >
                +
              </button>
            </div>

            {showNotification ? (
              <div className="btn btn-lg flex-1 bg-success border-0 pointer-events-none">
                <p className="font-heading text-white">Added to cart!</p>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="btn btn-lg flex-1 bg-accent hover:bg-secondary border-0"
              >
                <p className="font-heading text-white">
                  Add to Cart - ${(item.price * quantity).toFixed(2)}
                </p>
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="divider my-8"></div>

      {/* Comments Section */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="p-4 rounded-lg bg-base-200 space-y-3">
          <h3 className="text-xl font-heading font-bold">Leave a review</h3>

          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(stripInjectionChars(e.target.value))}
              placeholder="Share your thoughts about this item..."
              className="textarea textarea-bordered w-full"
              rows={4}
              maxLength={400}
              disabled={!user || submittingComment}
            />

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">Rating:</p>
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setNewRating(value)}
                    className="text-xl"
                    aria-label={`Set rating to ${value} star${value > 1 ? "s" : ""}`}
                    disabled={!user || submittingComment}
                  >
                    <span className={value <= newRating ? "text-rating" : "text-base-content/25"}>★</span>
                  </button>
                );
              })}

              <label className="label cursor-pointer gap-2 p-0 ml-auto">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={displayEmail}
                  onChange={(e) => setDisplayEmail(e.target.checked)}
                  disabled={!user || submittingComment}
                />
                <span className="label-text text-xs">Show my email</span>
              </label>
            </div>

            {!user && (
              <p className="text-sm text-base-content/70">Sign in to submit a comment.</p>
            )}
            {userHasCommented && (
              <p className="text-sm text-base-content/70">Editing your existing review for this item.</p>
            )}
            {commentError && <p className="text-sm text-error">{commentError}</p>}
            {commentSuccess && <p className="text-sm text-success">{commentSuccess}</p>}
            {editCommentSuccess && <p className="text-sm text-success">{editCommentSuccess}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white"
                disabled={!user || submittingComment}
              >
                {submittingComment ? "Saving..." : userHasCommented ? "Update Comment" : "Post Comment"}
              </button>
            </div>
          </form>
        </div>

        <div className="max-h-[580px] overflow-y-auto rounded-lg bg-base-200">
          <div className="sticky top-0 z-10 bg-base-200 px-4 py-3 border-b border-base-300">
            <h3 className="text-xl font-heading font-bold">Community Reviews</h3>
          </div>

          <div className="p-4">
            {commentsLoading ? (
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
                const canEditComment = Boolean(
                  user && comment.userId === user.id && !comment.id.startsWith("comment-")
                );
                const isEditingThisComment = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className="p-4 bg-base-100 rounded-lg">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <div>
                        <p className="font-semibold text-sm">{comment.authorName}</p>
                        {isEditingThisComment
                          ? renderEditableStars(
                              editingCommentRating,
                              setEditingCommentRating,
                              updatingComment
                            )
                          : renderStars(comment.stars)}
                      </div>
                      <div className="flex items-center gap-2">
                        {formattedDate && (
                          <p className="text-xs text-base-content/60 whitespace-nowrap">{formattedDate}</p>
                        )}
                        {canEditComment && !isEditingThisComment && (
                          <button
                            type="button"
                            className="btn btn-xs"
                            onClick={() => startEditingComment(comment)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditingThisComment ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(stripInjectionChars(e.target.value))}
                          className="textarea textarea-bordered w-full"
                          rows={3}
                          maxLength={400}
                          disabled={updatingComment}
                        />

                        {editCommentError && (
                          <p className="text-sm text-error">{editCommentError}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-xs bg-accent hover:bg-secondary border-0 text-white"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={updatingComment}
                          >
                            {updatingComment ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs"
                            onClick={cancelEditingComment}
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
      </div>
    </div>
  );
}
