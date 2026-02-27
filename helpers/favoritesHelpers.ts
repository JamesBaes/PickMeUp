'use client';

import supabase from '@/utils/supabase/client';
import { MenuItem } from '@/types';

/**
 * Get all favorited item IDs for a user as a Set (for O(1) lookup)
 */
export async function getUserFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('favorites')
    .select('favorite_item_id')
    .eq('customer_id', userId);

  if (error) {
    console.error('Error fetching favorite IDs:', error);
    return new Set();
  }

  return new Set((data || []).map((row) => row.favorite_item_id));
}

/**
 * Add an item to the user's favorites
 */
export async function addFavorite(userId: string, itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .insert({ customer_id: userId, favorite_item_id: itemId });

  if (error) {
    console.error('Error adding favorite:', error);
    return false;
  }

  return true;
}

/**
 * Remove an item from the user's favorites
 */
export async function removeFavorite(userId: string, itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('customer_id', userId)
    .eq('favorite_item_id', itemId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }

  return true;
}

/**
 * Get full menu item data for all of a user's favorites
 */
export async function getUserFavoriteItems(userId: string): Promise<MenuItem[]> {
  // First get all favorite item IDs
  const { data: favData, error: favError } = await supabase
    .from('favorites')
    .select('favorite_item_id')
    .eq('customer_id', userId);

  if (favError || !favData || favData.length === 0) {
    if (favError) console.error('Error fetching favorites:', favError);
    return [];
  }

  const itemIds = favData.map((row) => row.favorite_item_id);

  // Then fetch the full menu item data for those IDs
  const { data: itemsData, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .in('item_id', itemIds);

  if (itemsError) {
    console.error('Error fetching favorite menu items:', itemsError);
    return [];
  }

  return (itemsData as MenuItem[]) || [];
}
