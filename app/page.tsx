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

      // USE MOCK DATA FOR TESTING - Remove later when database has data
      if (!data || data.length === 0) {
        console.log("Using mock data for testing");
        const mockData: MenuItem[] = [
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
            name: 'Chicken_Burger',
            description: 'Our premium chicken burger with fresh ingredients',
            price: 19.99,
            category: 'beef_burgers',
            calories: 650,
            allergy_information: 'Contains wheat, dairy',
            image_url: '/burger2.jpg',
            list_of_ingredients: ['Chicken patty', 'Lettuce', 'Tomato', 'Special sauce']
          },
          {
            item_id: '3',
            restaurant_id: 'gladiator',
            name: 'Chickpea_Burger',
            description: 'Vegetarian option with chickpea patty',
            price: 19.99,
            category: 'beef_burgers',
            calories: 550,
            allergy_information: 'Contains gluten',
            image_url: '/burger3.jpg',
            list_of_ingredients: ['Chickpea patty', 'Lettuce', 'Tomato', 'Vegan mayo']
          },
          {
            item_id: '4',
            restaurant_id: 'gladiator',
            name: 'Chickpea_Burger',
            description: 'Based on fresh ingredients and made to order',
            price: 19.99,
            category: 'veggie_burgers',
            calories: 550,
            allergy_information: 'Contains gluten',
            image_url: '/veggie-burger.jpg',
            list_of_ingredients: ['Chickpea patty', 'Fresh vegetables', 'Special sauce']
          }
        ];
        setMenuItems(mockData);
      } else {
        setMenuItems((data as MenuItem[]) || []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // sort category by a specific order, and not alphabetical
  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  return (
    <div>
      {/* GLADIATOR HEADER - THIS WAS MISSING */}
      <div className="text-center py-8 px-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4">
          GLADIATOR
        </h1>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-10">
            <p>No menu items available.</p>
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