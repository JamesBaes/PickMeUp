"use client";

import { useFavorites } from "@/context/favoritesContext";
import { useCart } from "@/context/cartContext";
import Link from "next/link";

export default function FavoritesPage() {
  const { favoriteItems, isFavorite, toggleFavorite, loading } = useFavorites();
  const { addItem } = useCart();

  const formatName = (name: string): string => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-heading font-bold mb-8">Favourites</h1>

      {favoriteItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-body text-base-content/60 mb-4">
            You haven&apos;t added any favourites yet.
          </p>
          <Link href="/" className="btn bg-accent hover:bg-secondary border-0 text-white font-heading">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {favoriteItems.map((item) => (
            <div
              key={item.item_id}
              className="flex items-center gap-5 border border-base-200 rounded-xl p-4 shadow-sm bg-white"
            >
              {/* Circular image */}
              <div className="shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                    <span className="text-base-content/30 text-xs">No img</span>
                  </div>
                )}
              </div>

              {/* Name & description */}
              <div className="flex-1 min-w-0">
                <Link href={`/${item.item_id}`} className="hover:underline">
                  <p className="font-heading font-bold text-lg leading-tight truncate">
                    {formatName(item.name)}
                  </p>
                </Link>
                <p className="font-body text-sm text-base-content/60 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
              </div>

              {/* Price */}
              <div className="shrink-0 font-heading font-bold text-lg w-20 text-right">
                ${item.price.toFixed(2)}
              </div>

              {/* Add to cart */}
              <button
                onClick={() => addItem(item, 1)}
                className="btn bg-accent hover:bg-secondary border-0 text-white font-heading shrink-0"
              >
                Add Cart
              </button>

              {/* Remove from favourites */}
              <button
                onClick={() => toggleFavorite(item)}
                className="p-2 rounded-full hover:bg-base-200 transition-colors shrink-0"
                aria-label="Remove from favourites"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-accent">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
