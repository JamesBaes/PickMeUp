'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { MenuItem } from '@/types/';
import { groupByCategory } from '@/helpers/menuHelpers';
import CategorySection from '@/components/CategorySection';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setMenuItems((data as MenuItem[]) || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = groupByCategory(menuItems);
  const categories = Object.keys(groupedItems);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Our Menu</h1>
        <p className="text-xl text-base-content/70">
          Discover our legendary selection of burgers, sides, and beverages
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No menu items available at the moment.</span>
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