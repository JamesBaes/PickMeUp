'use client'
import Image from 'next/image';
import { CartItem } from '@/types';

interface CartItemCardProps {
  item: CartItem
  onQuantityChange?: (newQuantity: number) => void
  onRemove?: () => void
}

const CartItemCard = ({ 
  item,
  onQuantityChange,
  onRemove
}: CartItemCardProps) => {

  const handleIncrease = () => {
    onQuantityChange?.(item.quantity + 1)
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange?.(item.quantity - 1)
    }
  };

  const itemTotal = item.price * item.quantity;

  // same format name function as MenuItemCard, replaces _ with spaces and capitalizes
  const formattedName = item.name
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className="flex items-center gap-6 p-4 bg-white  border-gray-200">

      {/* image */}
      <div className="relative w-24 h-24 shrink-0">
        {item.image_url ? (
          <Image 
            src={item.image_url} 
            alt={item.name}
            fill
            className="object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
      </div>

      {/* details */}
      <div className="grow">
        <p className="text-xs text-gray-500 font-body mb-1">{item.category}</p>
        <h3 className="font-heading font-semibold text-xl mb-2">{formattedName}</h3>
        <p className="font-body text-lg font-medium text-gray-900">${itemTotal.toFixed(2)}</p>
      </div>

      {/* quantity */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleDecrease}
          className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 hover:cursor-pointer flex items-center justify-center"
        >
          -
        </button>
        <span className="font-body text-lg w-8 text-center">{item.quantity}</span>
        <button 
          onClick={handleIncrease}
          className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 hover:cursor-pointer flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* remove button */}
      <button 
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-500 hover:cursor-pointer p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default CartItemCard