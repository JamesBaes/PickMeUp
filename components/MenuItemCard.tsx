import Image from "next/image";
import Link from "next/link";
import { MenuItem } from "@/types";
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
      <div className="card bg-background w-full max-w-xs shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer" >
      {item.image_url && (
        <figure>
          <img src={item.image_url} alt={item.name} />
        </figure>
      )}
      </div>
      <div className="card-body shadow-lg">
        <h2 className="card-title text-foreground font-heading">
          {formattedName()}
        </h2>
        <p className="text-foreground font-heading">${item.price}</p>
        <p className="hidden lg:line-clamp-4 text-foreground font-heading">
          {item.description}
        </p>
        <div className="card-actions justify-end">
          <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="btn border-0 shadow-none bg-accent hover:bg-secondary active:bg-active disabled:opacity-70"
          >
            <p className="font-heading text-white">
              {isAdding ? 'Added!' : 'Add to Cart'}
            </p>
          </button>
        </div>
      </div>
    </Link>
  );
}
