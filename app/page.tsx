"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import { groupByCategory, categryOrder } from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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

  const groupedItems = groupByCategory(menuItems);
  const categories = Object.keys(groupedItems);

  return (
    <div className="container mx-auto px-4 py-8">
      {categories.length === 0 ? (
        <div className="alert alert-info">
          <p>No menu items available at the moment.</p>
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
