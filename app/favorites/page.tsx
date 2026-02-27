"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types";
import { getUserFavoriteItems, removeFavorite } from "@/helpers/favoritesHelpers";
import MenuItemCard from "@/components/MenuItemCard";
import type { User } from "@supabase/supabase-js";

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  const fetchUserAndFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const items = await getUserFavoriteItems(user.id);
        setFavoriteItems(items);
        setFavoriteItemIds(new Set(items.map((item) => item.item_id)));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    if (!user) return;

    // Remove from favorites (on this page, toggling always removes)
    const success = await removeFavorite(user.id, itemId);
    if (success) {
      setFavoriteItems((prev) => prev.filter((item) => item.item_id !== itemId));
      setFavoriteItemIds((prev) => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading favorites...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🤍</div>
          <h1 className="text-3xl font-heading font-bold mb-3">Your Favorites</h1>
          <p className="text-gray-500 mb-6">
            Please log in to view and save your favorite items.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-accent text-white font-heading font-semibold rounded-lg hover:bg-secondary transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Logged in but no favorites
  if (favoriteItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🤍</div>
          <h1 className="text-3xl font-heading font-bold mb-3">No Favorites Yet</h1>
          <p className="text-gray-500 mb-6">
            Browse the menu and tap the heart icon to save your favorites!
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-accent text-white font-heading font-semibold rounded-lg hover:bg-secondary transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  // Logged in with favorites
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold mb-2">My Favorites</h1>
        <p className="text-gray-500">
          {favoriteItems.length} {favoriteItems.length === 1 ? "item" : "items"} saved
        </p>
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {favoriteItems.map((item) => (
          <MenuItemCard
            key={item.item_id}
            item={item}
            isFavorited={favoriteItemIds.has(item.item_id)}
            onToggleFavorite={handleToggleFavorite}
            userId={user.id}
          />
        ))}
      </div>
    </div>
  );
}
