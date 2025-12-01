import Image from 'next/image';
import { MenuItem } from '@/types';
import { formatPrice } from '@/helpers/menuHelpers';

interface MenuItemCardProps {
  item: MenuItem;
}

const TRANSPARENT_IMAGE_PATH = '/transparent.png';

export default function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <div className="card bg-base-100 w-96 shadow-sm">
      <figure>
        <img
          src={item.image_url || TRANSPARENT_IMAGE_PATH}
          alt={item.name} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{item.name}</h2>
        <p>${item.price}</p>
        <p>{item.description}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Add to Cart</button>
        </div>
      </div>
    </div>

        
  );
}