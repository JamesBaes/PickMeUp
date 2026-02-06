"use client";

import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import { groupByCategory, categoryOrder } from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

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
    }
  };

  // sort category by a specific order, and not alphabetical
  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  return (
    <div>
      {/* GLADIATOR header - ADDED BACK */}
      <div className="text-center py-8 px-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">
          GLADIATOR
        </h1>
      </div>

      {/* Existing menu display */}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div>
            <p></p>
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