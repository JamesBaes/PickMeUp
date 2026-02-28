"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types";
import Image from "next/image";
import { useCart } from "@/context/cartContext";
import { useLocation } from "@/context/locationContext";
import { useFavorites } from "@/context/favoritesContext";
import { useAuth } from "@/context/authContext";

interface ItemPageProps {
  params: Promise<{
    item: string;
  }>;
}

export default function ItemPage({ params }: ItemPageProps) {
  const { item: itemId } = use(params);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { addItem } = useCart();
  const [showNotification, setShowNotification] = useState(false)
  const { currentLocation, isHydrated } = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

useEffect(() => {
  if (!isHydrated) return;
    fetchItem();
}, [itemId, isHydrated, currentLocation?.id]);

  const fetchItem = async () => {
  setLoading(true);
  try {
    
    let query = supabase
      .from("menu_items_restaurant_locations")
      .select("*")
      .eq("item_id", itemId);

    // Only filter by restaurant_id if a location is selected
    if (currentLocation?.id) {
      const numericId = parseInt(currentLocation.id, 10);
      query = query.eq("restaurant_id", numericId);
    } else {
      console.log("No location selected, fetching any available item");
    }

    const { data, error } = await query.single();


    if (error) throw error;
    setItem(data as MenuItem);
  } catch (error) {
    console.error("Error fetching item:", error);
    setItem(null);
  } finally {
    setLoading(false);
  }
};

  const formatName = (name: string): string => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000)
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">Item Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="btn bg-accent hover:bg-secondary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {showNotification && (
        <div className="w-full rounded-lg bg-green-600/75 text-white text-center py-3 font-semibold shadow-md ">
          Added to cart!
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="btn btn-ghost mb-4"
      >
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="w-full">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-auto rounded-lg shadow-xl object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
              <span className="text-base-content/50">No Image Available</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-heading font-bold flex-1">
              {formatName(item.name)}
            </h1>
            {/* Favourite button — only for signed-in users */}
            {user && (
              <button
                onClick={() => toggleFavorite(item)}
                className="p-2 rounded-full hover:bg-base-200 transition-colors shrink-0"
                aria-label={isFavorite(item.item_id) ? "Remove from favourites" : "Add to favourites"}
              >
                {isFavorite(item.item_id) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-accent">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="text-3xl font-bold text-accent">
            ${item.price.toFixed(2)}
          </div>

          <p className="text-lg font-body">{item.description}</p>

          {/* Nutritional Info */}
          <div className="divider"></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-white border-2 bg-gray-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Calories</p>
              {/* <p className="text-md font-body font-sm capitalize">{item.calories}</p> */}  {/* add this line back after design review LOLLLLLL*/}
              <p className="text-md font-body font-sm capitalize">450 Cal</p>
            </div>
            
            <div className="p-4 border-white border-2 bg-gray-100 rounded-lg">
              <p className="text-xl font-heading font-medium text-black mb-1">Category</p>
              <p className="text-md font-body font-sm capitalize">
                {item.category.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Ingredients */}
          {item.list_of_ingredients && item.list_of_ingredients.length > 0 && (
            <div>
              <h3 className="text-xl font-heading font-bold mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.list_of_ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-base-200"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergy Information */}
          {item.allergy_information && (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                <strong>Allergy Info:</strong> {item.allergy_information}
              </span>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="divider"></div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity === 1}
            className={`btn shadow-sm border-0 btn-circle btn-sm text-lg ${
              quantity === 1 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-gray-400 text-black hover:bg-gray-500'
            }`}
          >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="btn shadow-sm border-0 btn-circle btn-sm text-lg text-black bg-gray-400 hover:bg-gray-500"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-lg flex-1 bg-accent hover:bg-secondary border-0"
            >
              <p className="font-heading text-white">
                Add to Cart - ${(item.price * quantity).toFixed(2)}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
