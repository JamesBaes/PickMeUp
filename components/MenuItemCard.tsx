import Image from "next/image";
import Link from "next/link";
import { MenuItem, MenuItemCardProps } from "@/types";
import { useState } from "react";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/authContext";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {

  const { user } = useAuth()
  const { addItem } = useCart()

  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [quantity, setQuantity] = useState(1)


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
    addItem(item, 1)

    // buffer to show that added notification
    setTimeout(() => {
      setIsAdding(false)
    }, 1000)
  }

  return (
    <Link href={`/${item.item_id}`}>
      <div className="card bg-background w-full h-full shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col">
        {/* Image Container */}
        {item.image_url && (
        <figure className="flex-shrink-0">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-white"></div>
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
                {isAdding ? 'Added!' : 'Add to Cart'}
              </p>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
