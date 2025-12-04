import Image from "next/image";
import { MenuItem } from "@/types";
import { formatPrice } from "@/helpers/menuHelpers";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {

  // Just a function to capitalize plus replace _ with spaces.
  const formattedName = ():string => {
      return item.name
      .replace(/_/g, " ") // replace where there's underscore with a space
      .split(' ') // then split where there's a space
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // use map function to convert each of the words to uppercase
      .join(' '); // group words together again
  }

  return (
<<<<<<< HEAD
    <div className="card bg-base-100 w-96 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      {item.image_url && (
        <figure>
          <img src={item.image_url} alt={item.name} />
        </figure>
      )}
      <div className="card-body">
        <h2 className="card-title">{item.name}</h2>
        <p>${item.price}</p>
        <p>{item.description}</p>
=======
    <div className="card bg-background w-full max-w-xs shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
      <figure>
        <img
          src={item.image_url}
          alt={item.name} />
      </figure>
      <div className="card-body shadow-lg">
        <h2 className="card-title text-foreground font-heading">{formattedName()}</h2>
        <p className="text-foreground font-heading">${item.price}</p>
        <p className="text-foreground font-heading">{item.description}</p>
>>>>>>> james-branch
        <div className="card-actions justify-end">
          <button className="btn border-0 shadow-none bg-accent"><p className="font-heading">Add to Cart</p></button>
        </div>
      </div>
    </div>
  );
}
