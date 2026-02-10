"use client";

import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import { groupByCategory, categoryOrder } from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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

      if (fetchError) {
        console.error("Supabase error:", fetchError);
      }

      // REMOVED THE MOCK DATA - JUST USE REAL DATA FROM SUPABASE
      setMenuItems((data as MenuItem[]) || []);
      
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* GLADIATOR HEADER */}
      <div className="text-center py-8 px-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">
          GLADIATOR
        </h1>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">No menu items found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Check if your Supabase 'menu_items' table has data.
            </p>
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
    </div>
  );
}