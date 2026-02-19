"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import MenuItemCard from "@/components/MenuItemCard";
import EmptyFavorites from "./empty-state";
import supabase from "@/utils/supabase/client";
import { removeFromFavorites } from "@/helpers/favoritesHelpers";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  const fetchUserAndFavorites = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError("Please log in to view your favorites");
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch user's favorites from database
      const { data, error: fetchError } = await supabase
        .from("favorites")
        .select("menu_items(*)")
        .eq("user_id", user.id);

      if (fetchError) {
        console.error("Error fetching favorites:", fetchError);
        setError("Failed to load favorites");
        setFavorites([]);
      } else {
        // Extract menu items from the join result
        const favoritesData = (data || [])
          .map((fav: any) => fav.menu_items)
          .filter((item: MenuItem | null) => item !== null) as MenuItem[];
        
        setFavorites(favoritesData);
      }
    } catch (err) {
      console.error("Error in fetchUserAndFavorites:", err);
      setError("An error occurred while loading favorites");
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId: string) => {
    if (!userId) return;

    try {
      const success = await removeFromFavorites(userId, itemId);
      if (success) {
        setFavorites(favorites.filter(fav => fav.item_id !== itemId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <a href="/login" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Favorites ❤️
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All your loved Gladiator burgers in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold text-gray-800">
                    {favorites.length} Favorite Item{favorites.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-gray-600">Saved just for you</p>
                </div>
                <button 
                  onClick={() => alert("Ordering all favorites!")}
                  className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  Order All Favorites
                </button>
              </div>
            </div>

            {/* Favorites Grid */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Favorite Burgers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((item) => (
                  <div key={item.item_id} className="relative">
                    <MenuItemCard item={item} />
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFavorite(item.item_id)}
                      className="absolute top-3 right-3 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition"
                      title="Remove from favorites"
                    >
                      ❤️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}