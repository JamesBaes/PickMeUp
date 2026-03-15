"use client";

import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import { groupByCategory, categoryOrder, transformMenuItemData, formatCategoryName } from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";
import { useLocation } from "@/context/locationContext";

export default function MenuPage() {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // SHOULD ADD A LOADING STATE PROBABLY (LIKE HOW WE DID IN MOBILE DEV CPRG-303)
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Incorporates the location for each menu item, so that we can filter items based on the user's selected location in the future (if needed)
  const { currentLocation, isHydrated } = useLocation();

  useEffect(() => {
    // Only fetch when hydration is complete
    if (!isHydrated) return;


    if (currentLocation?.id) {
      fetchLocationMenuItems(currentLocation.id);
    } else {
      fetchDefaultMenuItems();
    }
  }, [currentLocation, isHydrated]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    const fetchDefaultMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setMenuItems((data as MenuItem[]) || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

const fetchLocationMenuItems = async (restaurantId: string) => {
  setLoading(true);
  try {
    
    const numericRestaurantId = parseInt(restaurantId, 10);
    
    const { data: locationData, error: locationError } = await supabase
      .from("menu_items_restaurant_locations")
      .select("item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information")
      .eq("restaurant_id", numericRestaurantId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    
    if (locationError) throw locationError;

    if (!locationData || locationData.length === 0) {
      console.warn("⚠️ No menu items found for this location");
      setMenuItems([]);
      setLoading(false);
      return;
    }

  const items = locationData.map(transformMenuItemData);
  setMenuItems(items);

    
    // DEBUG: Log all unique categories in the data
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    
    setMenuItems(items as MenuItem[]);
  } catch (error) {
    setMenuItems([]);
  } finally {
    setLoading(false);
  }
};
  // sort category by a specific order, and not alphabetical
  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  const scrollToCategory = (category: string) => {
    const el = document.getElementById(category);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="font-body text-gray-600">Loading menu...</p>
      </div>
    )

  return (
    <div>
      {categories.length > 0 && (
        <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 flex flex-wrap gap-1 py-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => scrollToCategory(category)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-body font-medium text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                {formatCategoryName(category)}
              </button>
            ))}
          </div>
        </nav>
      )}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div>
            <p>No items found.</p>
          </div>
        ) : (
          categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={groupedItems[category]}
            />
          ))
        )}
      </div>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
