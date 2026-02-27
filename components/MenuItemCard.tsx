"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MenuItem } from "@/types";
import { Heart } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  isFavorited?: boolean;
  onToggleFavorite?: (itemId: string) => void;
  userId?: string | null;
}

export default function MenuItemCard({
  item,
  isFavorited = false,
  onToggleFavorite,
  userId,
}: MenuItemCardProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  // Format name: replace underscores with spaces and capitalize each word
  const formattedName = (): string => {
    return item.name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to item page
    e.stopPropagation();

    if (!userId) {
      // Not logged in — redirect to login
      router.push("/login");
      return;
    }

    const willBeFavorited = !isFavorited;
    showToast(willBeFavorited ? "Added to favorites ❤️" : "Removed from favorites");
    onToggleFavorite?.(item.item_id);
  };

  return (
    <div className="h-full relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-foreground text-white text-xs font-heading font-medium px-3 py-1.5 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

    <Link href={`/${item.item_id}`} className="h-full">
      <article className="h-full bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer rounded-md overflow-hidden flex flex-col">
        {/* Image with heart button overlay */}
        <div className="relative h-40 w-full shrink-0">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7a2 2 0 012-2h3l2 3h6l2-3h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l2.5-3 2 2.5L15 9l3 4" />
                </svg>
                <div className="text-sm">No image</div>
              </div>
            </div>
          )}

          {/* Heart / Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 shadow transition-all duration-200 hover:scale-110"
          >
            <Heart
              size={18}
              className={isFavorited ? "fill-accent text-accent" : "text-gray-400"}
            />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground mb-1">
              {formattedName()}
            </h2>
            <p className="text-sm text-foreground mb-2">${item.price}</p>
            <p className="text-sm text-foreground line-clamp-4">
              {item.description}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="px-3 py-2 bg-accent text-white text-sm rounded-sm hover:bg-secondary">
              Add to Cart
            </button>
          </div>
        </div>
      </article>
    </Link>
    </div>
  );
}
