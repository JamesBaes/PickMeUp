import Link from "next/link";
import { MenuItem } from "@/types";
import { formatPrice } from "@/helpers/menuHelpers";

interface MenuItemCardProps {
  item: MenuItem;
  uniformSize?: boolean;
}

export default function MenuItemCard({ item, uniformSize = false }: MenuItemCardProps) {
  // Just a function to capitalize plus replace _ with spaces.
  const formattedName = (): string => {
    return item.name
      .replace(/_/g, " ") // replace where there's underscore with a space
      .split(" ") // then split where there's a space
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // use map function to convert each of the words to uppercase
      .join(" "); // group words together again
  };

  return (
    <Link href={`/${item.item_id}`} className={uniformSize ? "block h-full" : "block"}>
      <div className={`card bg-background w-full shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden ${uniformSize ? "h-full" : "max-w-xs"}`}>
        {item.image_url ? (
          <figure className={uniformSize ? "h-48 w-full overflow-hidden" : "w-full"}>
            <img
              src={item.image_url}
              alt={item.name}
              className={uniformSize ? "h-full w-full object-cover" : "w-full h-auto"}
            />
          </figure>
        ) : (
          <div className={`${uniformSize ? "h-48" : "h-56"} w-full bg-base-200 flex items-center justify-center text-base-content/50 font-heading`}>
            No Image Available
          </div>
        )}

        <div className={`card-body shadow-lg flex flex-col ${uniformSize ? "h-60" : ""}`}>
          <h2 className={`card-title text-foreground font-heading ${uniformSize ? "line-clamp-2 min-h-14" : ""}`}>
            {formattedName()}
          </h2>
          <p className="text-foreground font-heading">{formatPrice(item.price)}</p>
          <p className={`text-foreground font-heading ${uniformSize ? "line-clamp-3 flex-1" : "line-clamp-4"}`}>
            {item.description}
          </p>
          <div className={`card-actions justify-end ${uniformSize ? "mt-2" : ""}`}>
            <button className="btn border-0 shadow-none bg-accent hover:bg-secondary active:bg-active">
              <p className="font-heading text-white">Add to Cart</p>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
