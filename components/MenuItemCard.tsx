import Image from "next/image";
import Link from "next/link";
import { MenuItem } from "@/types";
import { formatPrice } from "@/helpers/menuHelpers";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  // Just a function to capitalize plus replace _ with spaces.
  const formattedName = (): string => {
    return item.name
      .replace(/_/g, " ") // replace where there's underscore with a space
      .split(" ") // then split where there's a space
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // use map function to convert each of the words to uppercase
      .join(" "); // group words together again
  };

  return (
    <Link href={`/${item.item_id}`} className="h-full">
      <article className="h-full bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer rounded-md overflow-hidden flex flex-col">
        {item.image_url ? (
          <div className="h-40 w-full overflow-hidden shrink-0">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-40 w-full bg-gray-100 shrink-0 flex items-center justify-center">
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
  );
}
