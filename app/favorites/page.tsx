"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import MenuItemCard from "@/components/MenuItemCard";
import EmptyFavorites from "./empty-state";
import supabase from "@/utils/supabase/client";
import { removeFromFavorites } from "@/helpers/favoritesHelpers";

const DUMMY_FAVORITES: MenuItem[] = [
  {
    item_id: "dummy-1",
    restaurant_id: "demo-restaurant",
    name: "double_cheese_smash",
    description: "Double smashed beef patties, cheddar cheese, lettuce, tomato, and secret sauce.",
    price: 12.99,
    category: "beef_burgers",
    calories: 890,
    allergy_information: "Contains dairy and gluten.",
    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80&auto=format&fit=crop",
    list_of_ingredients: ["beef patty", "cheddar", "lettuce", "tomato", "brioche bun", "secret sauce"],
  },
  {
    item_id: "dummy-2",
    restaurant_id: "demo-restaurant",
    name: "crispy_chicken_blaze",
    description: "Crispy chicken fillet with spicy mayo, pickles, and slaw.",
    price: 11.49,
    category: "chicken_burgers",
    calories: 760,
    allergy_information: "Contains egg and gluten.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80&auto=format&fit=crop",
    list_of_ingredients: ["chicken fillet", "spicy mayo", "pickles", "slaw", "potato bun"],
  },
  {
    item_id: "dummy-3",
    restaurant_id: "demo-restaurant",
    name: "veggie_power_stack",
    description: "Grilled veggie patty, avocado spread, caramelized onions, and fresh greens.",
    price: 10.99,
    category: "veggie_burgers",
    calories: 620,
    allergy_information: "May contain soy.",
    image_url: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=1200&q=80&auto=format&fit=crop",
    list_of_ingredients: ["veggie patty", "avocado", "onions", "greens", "whole wheat bun"],
  },
  {
    item_id: "dummy-4",
    restaurant_id: "demo-restaurant",
    name: "triple_bbq_boss",
    description: "Triple beef layers with smoky BBQ sauce, onion rings, and pepper jack.",
    price: 14.99,
    category: "beef_burgers",
    calories: 1040,
    allergy_information: "Contains dairy and gluten.",
    image_url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=1200&q=80&auto=format&fit=crop",
    list_of_ingredients: ["triple beef patties", "bbq sauce", "onion rings", "pepper jack", "sesame bun"],
  },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDummyData, setIsDummyData] = useState(false);

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  const fetchUserAndFavorites = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setFavorites(DUMMY_FAVORITES);
        setIsDummyData(true);
        setError(null);
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
        console.warn("Unable to fetch favorites", {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        });
        setFavorites(DUMMY_FAVORITES);
        setIsDummyData(true);
        setError(null);
      } else {
        // Extract menu items from the join result
        const favoritesData = (data || [])
          .map((fav: any) => fav.menu_items)
          .filter((item: MenuItem | null) => item !== null) as MenuItem[];

        if (favoritesData.length === 0) {
          setFavorites(DUMMY_FAVORITES);
          setIsDummyData(true);
        } else {
          setFavorites(favoritesData);
          setIsDummyData(false);
        }
      }
    } catch (err) {
      console.warn("Unexpected error in fetchUserAndFavorites", err);
      setFavorites(DUMMY_FAVORITES);
      setIsDummyData(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId: string) => {
    if (isDummyData) {
      setFavorites((prev) => prev.filter((fav) => fav.item_id !== itemId));
      return;
    }

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
                    <MenuItemCard item={item} uniformSize />
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