'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { MenuItem, CartItem, CartContextType, CartProvideProps } from '@/types'
import { useAuth } from './authContext';
import supabase from '@/utils/supabase/client';

// Central cart state used by menu, cart, and checkout flows.
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider owns the cart lifecycle for this browser session.
export const CartProvider: React.FC<CartProvideProps> = ({ children }) => {

  // Auth state is available for future behavior branching (guest vs logged-in).
  const { user } = useAuth();
  const [ items, setItems ] = useState<CartItem[]>([])
  const [lastCartSyncAt, setLastCartSyncAt] = useState<number | null>(null);
  const cartStorageKey = 'cart';
  const tabInstanceIdRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const lastSyncedHashRef = useRef('');
  const realtimeChannelRef = useRef<any>(null);
  const isRealtimeSyncEnabled = Boolean(user?.id);

  const getCartHash = (cart: CartItem[]) => JSON.stringify(cart);

  useEffect(() => {
    // Rehydrate cart on first render from localStorage.
    const loadCart = async () => {
      try {
        const savedCart = localStorage.getItem(cartStorageKey);
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart) as CartItem[];
            lastSyncedHashRef.current = getCartHash(parsedCart);
            setItems(parsedCart);
        }
      } catch (error) {
          console.error("Failed to load cart:", error);
      }
    };
    loadCart();
  }, []);

  // Persist cart after every mutation to keep page refreshes non-destructive.
  useEffect(() => {
    const saveCart = async() => {
      try {
        localStorage.setItem(cartStorageKey, JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart:", error)
      }
    }
    saveCart()
  }, [items])

  useEffect(() => {
    // Keep cart in sync for other tabs/windows of the same browser profile.
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== cartStorageKey || !event.newValue) return;

      try {
        const incomingItems = JSON.parse(event.newValue) as CartItem[];
        const incomingHash = getCartHash(incomingItems);
        if (incomingHash === lastSyncedHashRef.current) return;

        lastSyncedHashRef.current = incomingHash;
        setItems(incomingItems);
        setLastCartSyncAt(Date.now());
      } catch (error) {
        console.error('Failed to sync cart from storage event:', error);
      }
    };

    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  useEffect(() => {
    // Cross-browser sync via Supabase Realtime broadcast (same signed-in user).
    if (!user?.id) return;

    const channel = supabase
      .channel(`cart-sync:${user.id}`)
      .on('broadcast', { event: 'cart-updated' }, ({ payload }) => {
        const incoming = payload as { sourceId?: string; items?: CartItem[] };
        if (!incoming?.items) return;
        if (incoming.sourceId === tabInstanceIdRef.current) return;

        const incomingHash = getCartHash(incoming.items);
        if (incomingHash === lastSyncedHashRef.current) return;

        lastSyncedHashRef.current = incomingHash;
        setItems(incoming.items);
        setLastCartSyncAt(Date.now());
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      realtimeChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const currentHash = getCartHash(items);
    if (currentHash === lastSyncedHashRef.current) return;

    lastSyncedHashRef.current = currentHash;
    if (!user?.id) return;

    if (!realtimeChannelRef.current) return;

    void realtimeChannelRef.current.send({
      type: 'broadcast',
      event: 'cart-updated',
      payload: {
        sourceId: tabInstanceIdRef.current,
        items,
      },
    });
  }, [items, user?.id]);

  // Add a new item, or increment quantity when it already exists.
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
  
  // Remove one line item entirely from cart.
  const removeItem = (itemId: string) => {
      setItems((prevItems) => prevItems.filter(item => item.item_id !== itemId))
  }

  // Update quantity and auto-remove when quantity reaches zero.
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

    // Remove all cart contents at once.
  const clearCart = () => {
      setItems([]);
  }

  // Swap cart items from one location to equivalent items at another location.
  // Each swap provides the old item_id and the replacement MenuItem from the target location.
  // Quantity is preserved; only item_id and restaurant_id change.
  const swapItemsToNewLocation = (swaps: Array<{ oldItemId: string; newItem: MenuItem }>) => {
    setItems((prevItems) =>
      prevItems.map((cartItem) => {
        const swap = swaps.find((s) => s.oldItemId === cartItem.item_id);
        if (swap) {
          return { ...swap.newItem, quantity: cartItem.quantity };
        }
        return cartItem;
      })
    );
  };

    // Helper used by navbar badge.
  const getItemCount = () => {
      return items.reduce((total, item) => total + item.quantity, 0)
  }

    // Helper used by order summary and checkout.
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
        getTotal,
        lastCartSyncAt,
        isRealtimeSyncEnabled,
        swapItemsToNewLocation,
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

