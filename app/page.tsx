"use client";

import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import { groupByCategory, categoryOrder } from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";

export default function MenuPage() {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // SHOULD ADD A LOADING STATE PROBABLY (LIKE HOW WE DID IN MOBILE DEV CPRG-303)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("menu_items")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      setMenuItems((data as MenuItem[]) || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  // sort category by a specific order, and not alphabetical
  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  if (loading) 
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="font-body text-gray-600">Loading menu...</p>
      </div>
    )

  return (
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
  );
}
