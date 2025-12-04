import Image from "next/image";
import { MenuItem } from "@/types";
import { formatPrice } from "@/helpers/menuHelpers";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  return (
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
        <div className="card-actions justify-end">
          <button className="btn btn-secondary">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
