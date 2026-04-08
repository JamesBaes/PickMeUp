'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';
import { MenuItem } from '@/types';
import { useCart } from '@/context/cartContext';
import { useLocation } from '@/context/locationContext';
import { useFavorites } from '@/context/favoritesContext';
import { useAuth } from '@/context/authContext';
import { usePostHog } from 'posthog-js/react';
import { useItemComments } from './useItemComments';

export function useItemPage(itemId: string) {
  const router = useRouter();
  const { addItem } = useCart();
  const { currentLocation, isHydrated } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const posthog = usePostHog();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  // Incrementing request id prevents stale async results from overwriting newer fetches.
  const fetchRequestIdRef = useRef(0);

  const comments = useItemComments(itemId, item);

  useEffect(() => {
    if (!isHydrated) return;
    fetchItem();
  }, [itemId, isHydrated, currentLocation?.id]);

  const fetchItem = async () => {
    const requestId = ++fetchRequestIdRef.current;
    setLoading(true);
    try {
      let query = supabase
        .from('menu_items_restaurant_locations')
        .select('*')
        .eq('item_id', itemId)
        .neq('is_hidden', true);

      if (currentLocation?.id) {
        query = query.eq('restaurant_id', parseInt(currentLocation.id, 10));
      }

      const { data, error } = await query.single();
      if (fetchRequestIdRef.current !== requestId) return;
      if (error) throw error;

      const fetchedItem = data as MenuItem;
      setItem(fetchedItem);
      comments.fetchComments(fetchedItem.name);
    } catch (error) {
      if (fetchRequestIdRef.current !== requestId) return;
      console.error('Error fetching item:', error);
      setItem(null);
    } finally {
      if (fetchRequestIdRef.current !== requestId) return;
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
    posthog.capture('add_to_cart', {
      item_id: item.item_id,
      item_name: item.name,
      item_price: item.price,
      item_category: item.category,
      quantity,
      source: 'item_page',
    });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return {
    item,
    loading,
    quantity,
    setQuantity,
    showNotification,
    user,
    isFavorite,
    toggleFavorite,
    router,
    ...comments,
  };
}
