import Link from "next/link";
import { MenuItem } from "@/types";
import type { MenuItemCardProps } from "@/types";
import { useState } from "react";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/authContext";
import { useFavorites } from "@/context/favoritesContext";
import { usePostHog } from "posthog-js/react";

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const posthog = usePostHog();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // Just a function to capitalize plus replace _ with spaces.
  const formattedName = (): string => {
    return item.name
      .replace(/_/g, " ") // replace where there's underscore with a space
      .split(" ") // then split where there's a space
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // use map function to convert each of the words to uppercase
      .join(" "); // group words together again
  };

  //Add to cart logic
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addItem(item, quantity);
    posthog.capture("add_to_cart", {
      item_id: item.item_id,
      item_name: item.name,
      item_price: item.price,
      item_category: item.category,
      quantity,
      source: "menu_page",
    });

    setShowSuccess(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(false);
      setQuantity(1);
    }, 1500);
  };

  // Quantity increment/decrement handlers with bounds checking and event handling to prevent card click-through.
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((q) => Math.max(1, q - 1));
  };


  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((q) => q + 1);
  };
// Favorite button click handler with animation trigger and event handling to prevent card click-through.
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeartAnimating(true);
    toggleFavorite(item);

    setTimeout(() => {
      setIsHeartAnimating(false);
    }, 1000);
  };

  return (
    
    // The title carries a "stretched link" (after:absolute after:inset-0) that
    // makes the whole card visually clickable. Buttons sit above it via z-10.
    <div className="group card bg-background w-full h-full shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col relative">
        {/* Image Container */}
        {item.image_url && (
          <figure className="shrink-0 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-white"></div>
            )}
            {/* Favourite button — z-10 so it sits above the stretched link */}
            {user && (
              <button
                onClick={handleFavoriteClick}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-transparent group-hover:bg-white/45 shadow transition-all duration-300 cursor-pointer group/heart ${
                  isHeartAnimating ? "animate-heartbeat" : ""
                }`}
                aria-label={
                  isFavorite(item.item_id)
                    ? "Remove from favourites"
                    : "Add to favourites"
                }
              >
                {isFavorite(item.item_id) ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-danger group-hover/heart:text-neutral-400 transition-colors duration-300"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-neutral-500 group-hover/heart:text-danger transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                )}
              </button>
            )}
          </figure>
        )}

        {/* Card Body */}
        <div className="card-body flex flex-col grow">
          {/* Stretched link on title: after:absolute after:inset-0 covers the full
              card area so it's still fully clickable, with no nested <a> elements. */}
          <h2 className="card-title text-foreground font-heading line-clamp-2">
            <Link
              href={`/${item.item_id}`}
              className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
            >
              {formattedName()}
            </Link>
          </h2>

          <p className="text-foreground font-heading font-bold text-lg mb-2">
            ${item.price.toFixed(2)}
          </p>

          <p className="text-foreground font-body text-sm line-clamp-4 grow mb-4">
            {item.description}
          </p>

          {/* relative z-10 lifts controls above the stretched link pseudo-element */}
          <div className="card-actions justify-between items-center mt-auto relative z-10">
            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleDecrement}
                disabled={quantity === 1 || isAdding}
                aria-label={`Decrease quantity of ${formattedName()}`}
                className={`btn btn-circle btn-xs border-0 shadow-none text-base ${
                  quantity === 1 || isAdding
                    ? "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                    : "bg-neutral-300 text-black hover:bg-neutral-400"
                }`}
              >
                <span aria-hidden="true">-</span>
              </button>
              <span className="text-sm font-bold w-5 text-center" aria-live="polite" aria-atomic="true">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={isAdding}
                aria-label={`Increase quantity of ${formattedName()}`}
                className="btn btn-circle btn-xs border-0 shadow-none text-base bg-neutral-300 text-black hover:bg-neutral-400"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>

            {/* Add to cart / success feedback */}
            {showSuccess ? (
              <div className="btn btn-medium border-0 shadow-none bg-success pointer-events-none">
                <p className="font-heading text-white text-medium">Added!</p>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="btn btn-medium border-0 shadow-none bg-accent hover:bg-secondary active:bg-active disabled:opacity-70"
              >
                <p className="font-heading text-white text-large">
                  Add to Cart
                </p>
              </button>
            )}
          </div>
        </div>
    </div>
  );
}