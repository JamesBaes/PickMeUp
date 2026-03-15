'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { MenuItem, CartItem, CartContextType, CartProvideProps } from '@/types'
import { useAuth } from './authContext';
import { useLocation } from './locationContext';
import supabase from '@/utils/supabase/client';

const GUEST_CART_KEY = 'cart';

type CartItemRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  item_id: string;
  restaurant_id: string | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image_url: string | null;
  currency: string;
  location_id: string | null;
  created_at: string;
  updated_at: string;
};

const toCartItem = (row: CartItemRow): CartItem => ({
  item_id: row.item_id,
  restaurant_id: row.restaurant_id || '',
  name: row.name,
  description: '',
  price: row.unit_price_cents / 100,
  category: '',
  calories: 0,
  allergy_information: '',
  image_url: row.image_url || '',
  list_of_ingredients: [],
  quantity: row.quantity,
});

const toUnitPriceCents = (price: number) => Math.round(price * 100);

// create cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// provider component for the cart context
export const CartProvider: React.FC<CartProvideProps> = ({ children }) => {

  const { user, loading } = useAuth();
  const { currentLocation, isHydrated } = useLocation();
  const [ items, setItems ] = useState<CartItem[]>([])

  const applyLocationFilter = <T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(query: T) => {
    if (currentLocation?.id) {
      return query.eq('location_id', currentLocation.id);
    }
    return query.is('location_id', null);
  };

  const fetchUserCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    let query = supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    query = applyLocationFilter(query);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch user cart:', error);
      setItems([]);
      return;
    }

    setItems((data || []).map((row) => toCartItem(row as CartItemRow)));
  };

  const mergeGuestCartToUserCart = async () => {
    if (!user) {
      return;
    }

    let guestItems: CartItem[] = [];
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (!raw) {
        return;
      }
      guestItems = JSON.parse(raw) as CartItem[];
    } catch (error) {
      console.error('Failed to parse guest cart for merge:', error);
      return;
    }

    if (!guestItems.length) {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }

    for (const guestItem of guestItems) {
      let existingQuery = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('item_id', guestItem.item_id)
        .limit(1);

      existingQuery = applyLocationFilter(existingQuery);

      const { data: existingRows, error: existingError } = await existingQuery;

      if (existingError) {
        console.error('Failed to check existing cart row during merge:', existingError);
        continue;
      }

      const existing = existingRows?.[0];
      if (existing) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + guestItem.quantity })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Failed to merge existing cart row:', updateError);
        }
        continue;
      }

      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          session_id: null,
          item_id: guestItem.item_id,
          restaurant_id: guestItem.restaurant_id,
          name: guestItem.name,
          unit_price_cents: toUnitPriceCents(guestItem.price),
          quantity: guestItem.quantity,
          image_url: guestItem.image_url,
          currency: 'CAD',
          location_id: currentLocation?.id || null,
        });

      if (insertError) {
        console.error('Failed to merge new cart row:', insertError);
      }
    }

    localStorage.removeItem(GUEST_CART_KEY);
  };

  useEffect(() => {
    const loadCart = async () => {
      if (!isHydrated || loading) {
        return;
      }

      if (user) {
        await fetchUserCart();
        return;
      }

      try {
        const savedCart = localStorage.getItem(GUEST_CART_KEY);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
          return;
        }
        setItems([]);
      } catch (error) {
        console.error('Failed to load guest cart:', error);
      }
    };
    void loadCart();
  }, [user, currentLocation?.id, isHydrated, loading]);

  useEffect(() => {
    if (!isHydrated || loading || !user) {
      return;
    }

    const mergeThenFetch = async () => {
      await mergeGuestCartToUserCart();
      await fetchUserCart();
    };

    void mergeThenFetch();
  }, [user?.id, currentLocation?.id, isHydrated, loading]);

  useEffect(() => {
    if (!user || !currentLocation?.id || loading) {
      return;
    }

    const syncLocation = async () => {
      const { error } = await supabase
        .from('cart_items')
        .update({ location_id: currentLocation.id })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to sync cart location:', error);
      }
    };

    void syncLocation();
  }, [user, currentLocation?.id, loading]);

  // save card to localStorage whenever an item changes
  useEffect(() => {
    if (user) {
      return;
    }

    const saveCart = async() => {
      try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart:", error)
      }
    }
    void saveCart()
  }, [items, user])

  // function for adding item to the cart
  const addItem = (menuItem: MenuItem, quantity: number = 1) => {
    if (user) {
      const existingItem = items.find((item) => item.item_id === menuItem.item_id)
      const unitPriceCents = Math.round(menuItem.price * 100)

      if (existingItem) {
        const updatedQuantity = existingItem.quantity + quantity

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.item_id === menuItem.item_id
              ? { ...item, quantity: updatedQuantity }
              : item,
          ),
        )

        const syncExisting = async () => {
          let query = supabase
            .from('cart_items')
            .update({ quantity: updatedQuantity, location_id: currentLocation?.id || null })
            .eq('user_id', user.id)
            .eq('item_id', menuItem.item_id)

          query = applyLocationFilter(query)

          const { error } = await query
          if (error) {
            console.error('Failed to update cart item:', error)
            await fetchUserCart()
          }
        }

        void syncExisting()
        return
      }

      const newCartItem: CartItem = {
        ...menuItem,
        quantity,
      }

      setItems((prevItems) => [...prevItems, newCartItem])

      const insertItem = async () => {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            session_id: null,
            item_id: menuItem.item_id,
            restaurant_id: menuItem.restaurant_id,
            name: menuItem.name,
            unit_price_cents: unitPriceCents,
            quantity,
            image_url: menuItem.image_url,
            currency: 'CAD',
            location_id: currentLocation?.id || null,
          })

        if (error) {
          console.error('Failed to insert cart item:', error)
          await fetchUserCart()
        }
      }

      void insertItem()
      return
    }

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
      if (user) {
        setItems((prevItems) => prevItems.filter(item => item.item_id !== itemId))

        const deleteItem = async () => {
          let query = supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId)

          query = applyLocationFilter(query)

          const { error } = await query
          if (error) {
            console.error('Failed to remove cart item:', error)
            await fetchUserCart()
          }
        }

        void deleteItem()
        return
      }

      setItems((prevItems) => prevItems.filter(item => item.item_id !== itemId))
  }

  // function to update the quantity of an item
  const updateQuantity = (itemId: string, quantity: number) => {
      if(quantity <= 0) {
          removeItem(itemId)
          return
      }

      if (user) {
        setItems((prevItems) => 
          prevItems.map((item) =>
            item.item_id === itemId ? {...item, quantity} : item
          )
        )

        const syncQuantity = async () => {
          let query = supabase
            .from('cart_items')
            .update({ quantity, location_id: currentLocation?.id || null })
            .eq('user_id', user.id)
            .eq('item_id', itemId)

          query = applyLocationFilter(query)

          const { error } = await query
          if (error) {
            console.error('Failed to update cart quantity:', error)
            await fetchUserCart()
          }
        }

        void syncQuantity()
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
      if (user) {
        setItems([])

        const clearUserCart = async () => {
          let query = supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)

          query = applyLocationFilter(query)

          const { error } = await query
          if (error) {
            console.error('Failed to clear cart:', error)
            await fetchUserCart()
          }
        }

        void clearUserCart()
        return
      }

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

