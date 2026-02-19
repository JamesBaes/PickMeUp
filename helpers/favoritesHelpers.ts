import { supabase } from '@/utils/supabase/client';
import { MenuItem } from '@/types';

/**
 * Fetch user's favorite menu items from the database
 * Requires user to be authenticated
 */
export async function getUserFavorites(userId: string): Promise<MenuItem[]> {
  try {
    // Fetch favorites for the user, joining with menu_items table
    const { data, error } = await supabase
      .from('favorites')
      .select('menu_item_id, menu_items(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // Extract menu items from the join result
    if (!data) return [];

    const favorites = data
      .map((fav: any) => fav.menu_items)
      .filter((item: MenuItem | null) => item !== null) as MenuItem[];

    return favorites;
  } catch (error) {
    console.error('Error in getUserFavorites:', error);
    return [];
  }
}

/**
 * Add an item to user's favorites
 */
export async function addToFavorites(userId: string, menuItemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        menu_item_id: menuItemId,
      });

    if (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addToFavorites:', error);
    return false;
  }
}

/**
 * Remove an item from user's favorites
 */
export async function removeFromFavorites(userId: string, menuItemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId);

    if (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeFromFavorites:', error);
    return false;
  }
}

/**
 * Check if an item is in user's favorites
 */
export async function isFavorited(userId: string, menuItemId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}
