"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types";
import Image from "next/image";
import { useCart } from "@/context/cartContext";
import { useLocation } from "@/context/locationContext";

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

useEffect(() => {
  if (!isHydrated) return;
  
  console.log("Effect fired - itemId:", itemId, "isHydrated:", isHydrated);
  fetchItem();
}, [itemId, isHydrated, currentLocation?.id]);

  const fetchItem = async () => {
  setLoading(true);
  try {
    console.log("Fetching item:", itemId);
    console.log("Current location:", currentLocation);
    
    let query = supabase
      .from("menu_items_restaurant_locations")
      .select("*")
      .eq("item_id", itemId);

    // Only filter by restaurant_id if a location is selected
    if (currentLocation?.id) {
      const numericId = parseInt(currentLocation.id, 10);
      query = query.eq("restaurant_id", numericId);
      console.log("Filtering by restaurant_id:", numericId);
    } else {
      console.log("No location selected, fetching any available item");
    }

    const { data, error } = await query.single();

    console.log("Fetched data:", data);
    console.log("Fetch error:", error);

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
          <h1 className="text-4xl font-heading font-bold">
            {formatName(item.name)}
          </h1>

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
