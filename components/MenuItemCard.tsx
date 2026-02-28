import Link from "next/link";
import { MenuItem, MenuItemCardProps } from "@/types";
import { useState } from "react";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/authContext";
import { useFavorites } from "@/context/favoritesContext";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Just a function to capitalize plus replace _ with spaces.
  const formattedName = (): string => {
    return item.name
      .replace(/_/g, " ") // replace where there's underscore with a space
      .split(" ") // then split where there's a space
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // use map function to convert each of the words to uppercase
      .join(" "); // group words together again
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addItem(item, 1);

    // buffer to show that added notification
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <Link href={`/${item.item_id}`}>
      <div className="card bg-background w-full h-full shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col">
        {/* Image Container */}
        {item.image_url && (
          <figure className="flex-shrink-0 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-white"></div>
            )}
            {/* Favourite button — only for signed-in users */}
            {user && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(item);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
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
                    className="w-5 h-5 text-accent"
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
                    className="w-5 h-5 text-gray-500"
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
        <div className="card-body flex flex-col flex-grow">
          <h2 className="card-title text-foreground font-heading line-clamp-2">
            {formattedName()}
          </h2>

          <p className="text-foreground font-heading font-bold text-lg mb-2">
            ${item.price.toFixed(2)}
          </p>

          <p className="text-foreground font-body text-sm line-clamp-4 flex-grow mb-4">
            {item.description}
          </p>

          <div className="card-actions justify-end mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="btn border-0 shadow-none bg-accent hover:bg-secondary active:bg-active disabled:opacity-70 btn-sm sm:btn-md w-full sm:w-auto"
            >
              <p className="font-heading text-white text-xs sm:text-base truncate">
                {isAdding ? "Added!" : "Add to Cart"}
              </p>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
