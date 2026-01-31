'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { MenuItem, CartItem, CartContextType, CartProvideProps } from '@/types'
import { useAuth } from './authContext';

// create cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// provider component for the cart context
export const CartProvider: React.FC<CartProvideProps> = ({ children }) => {

  const { user, isGuest } = useAuth();
  const [ items, setItems ] = useState<CartItem[]>([])

  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
      } catch (error) {
          console.error("Failed to load cart:", error);
      }
    };
    loadCart();
  }, []);

  // save card to localStorage whenever an item changes
  useEffect(() => {
    const saveCart = async() => {
      try {
        localStorage.setItem("cart", JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart:", error)
      }
    }
    saveCart()
  }, [items])

  // function for adding item to the cart
  const addItem = (menuItem: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.item_id === menuItem.item_id)

      if (existingItem) {
        // if the item already exists in the cart, update the quantity
        return prevItems.map(item => 
          item.item_id === menuItem.item_id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }

      const newCartItem: CartItem = {
        ...menuItem,
        quantity
      };

      return [...prevItems, newCartItem]
    })
  }
  
  // function to remove an item from the cart by item_id 
  const removeItem = (itemId: string) => {
      setItems((prevItems) => prevItems.filter(item => item.item_id !== itemId))
  }

  // function to update the quantity of an item
  const updateQuantity = (itemId: string, quantity: number) => {
      if(quantity <= 0) {
          removeItem(itemId)
          return
      }
      setItems((prevItems) => 
          prevItems.map((item) =>
              item.item_id === itemId ? {...item, quantity} : item
          )
      )
  }

  // function for clearing cart
  const clearCart = () => {
      setItems([]);
  }

  // function to get the total number of items in the cart
  const getItemCount = () => {
      return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotal = () => {
      return items.reduce(
          (total, item) => total + item.price * item.quantity, 0
      );
  }

  return (
    <CartContext.Provider 
      value={{
        items,
        addItem, 
        removeItem, 
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within an CartProvider')
  }
  return context
}

