'use client';

import { use } from 'react';
import { useItemPage } from '@/hooks/useItemPage';
import { formatItemPageName } from '@/helpers/itemHelpers';
import ReviewForm from '@/components/item/ReviewForm';
import ReviewList from '@/components/item/ReviewList';

interface ItemPageProps {
  params: Promise<{ item: string }>;
}

export default function ItemPage({ params }: ItemPageProps) {
  const { item: itemId } = use(params);
  const {
    item,
    loading,
    quantity,
    setQuantity,
    showNotification,
    user,
    isFavorite,
    toggleFavorite,
    router,
    comments,
    commentsLoading,
    newComment,
    setNewComment,
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
    setEditingCommentText,
    editingCommentRating,
    setEditingCommentRating,
    updatingComment,
    editCommentError,
    editCommentSuccess,
    handleAddToCart,
    handleSubmitComment,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
  } = useItemPage(itemId);

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
          <button onClick={() => router.push('/')} className="btn bg-accent hover:bg-secondary">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="btn btn-ghost mb-4">← Back</button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="w-full">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-auto rounded-lg shadow-xl object-cover" />
          ) : (
            <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
              <span className="text-base-content/50">No Image Available</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-heading font-bold flex-1">{formatItemPageName(item.name)}</h1>
            {user && (
              <button
                onClick={() => toggleFavorite(item)}
                className="p-2 rounded-full hover:bg-base-200 transition-colors shrink-0 cursor-pointer group"
                aria-label={isFavorite(item.item_id) ? 'Remove from favourites' : 'Add to favourites'}
              >
                {isFavorite(item.item_id) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-danger-dark group-hover:text-neutral-400 transition-colors">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-neutral-400 group-hover:text-danger-dark transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="text-3xl font-bold text-accent">${item.price.toFixed(2)}</div>
          <p className="text-lg font-body">{item.description}</p>

          <div className="divider"></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-white border-2 bg-neutral-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Calories</p>
              <p className="text-md font-body font-sm capitalize">{item.calories}</p>
            </div>
            <div className="p-4 border-white border-2 bg-neutral-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Category</p>
              <p className="text-md font-body font-sm capitalize">{item.category.replace(/_/g, ' ')}</p>
            </div>
          </div>

          {item.list_of_ingredients && item.list_of_ingredients.length > 0 && (
            <div>
              <h3 className="text-xl font-heading font-bold mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.list_of_ingredients.map((ingredient, index) => (
                  <span key={index} className="badge badge-lg bg-base-200">{ingredient}</span>
                ))}
              </div>
            </div>
          )}

          {item.allergy_information && (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span><strong>Allergy Info:</strong> {item.allergy_information}</span>
            </div>
          )}

          <div className="divider"></div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                className={`btn shadow-sm border-0 btn-circle btn-sm text-lg ${quantity === 1 ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed' : 'bg-neutral-400 text-black hover:bg-neutral-500'}`}
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
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
              <button onClick={handleAddToCart} className="btn btn-lg flex-1 bg-accent hover:bg-secondary border-0">
                <p className="font-heading text-white">Add to Cart - ${(item.price * quantity).toFixed(2)}</p>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="divider my-8"></div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <ReviewForm
          newComment={newComment}
          onCommentChange={setNewComment}
          newRating={newRating}
          onRatingChange={setNewRating}
          displayEmail={displayEmail}
          onDisplayEmailChange={setDisplayEmail}
          submitting={submittingComment}
          error={commentError}
          success={commentSuccess}
          editSuccess={editCommentSuccess}
          user={user}
          userHasCommented={userHasCommented}
          onSubmit={handleSubmitComment}
        />
        <ReviewList
          comments={comments}
          loading={commentsLoading}
          user={user}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          onEditingTextChange={setEditingCommentText}
          editingCommentRating={editingCommentRating}
          onEditingRatingChange={setEditingCommentRating}
          updatingComment={updatingComment}
          editCommentError={editCommentError}
          onStartEditing={startEditingComment}
          onCancelEditing={cancelEditingComment}
          onUpdateComment={handleUpdateComment}
        />
      </div>
    </div>
  );
}
