"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import MenuItemCard from "@/components/MenuItemCard";
import EmptyFavorites from "./empty-state";

// Mock favorites data - remove when you have real data
const MOCK_FAVORITES: MenuItem[] = [
  {
    item_id: '1',
    restaurant_id: 'gladiator',
    name: 'Chicken_Burger',
    description: 'Our premium chicken burger with fresh ingredients',
    price: 19.99,
    category: 'beef_burgers',
    calories: 650,
    allergy_information: 'Contains wheat, dairy',
    image_url: '/burger1.jpg',
    list_of_ingredients: ['Chicken patty', 'Lettuce', 'Tomato', 'Special sauce']
  },
  {
    item_id: '2',
    restaurant_id: 'gladiator',
    name: 'Double_Cheese_Burger',
    description: 'Double patty with extra cheese',
    price: 22.99,
    category: 'beef_burgers',
    calories: 850,
    allergy_information: 'Contains wheat, dairy',
    image_url: '/double-cheese.jpg',
    list_of_ingredients: ['Beef patty x2', 'Cheese', 'Lettuce', 'Special sauce']
  },
  {
    item_id: '3',
    restaurant_id: 'gladiator',
    name: 'Chickpea_Burger',
    description: 'Vegetarian option with chickpea patty',
    price: 19.99,
    category: 'veggie_burgers',
    calories: 550,
    allergy_information: 'Contains gluten',
    image_url: '/chickpea-burger.jpg',
    list_of_ingredients: ['Chickpea patty', 'Lettuce', 'Tomato', 'Vegan mayo']
  }
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setFavorites(MOCK_FAVORITES); // Use mock data for now
      setIsLoading(false);
    }, 500);
  }, []);

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
                      onClick={() => {
                        // Remove from favorites
                        setFavorites(favorites.filter(fav => fav.item_id !== item.item_id));
                      }}
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