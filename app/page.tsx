'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { MenuItem } from '@/types/';
import { groupByCategory } from '@/helpers/menuHelpers';
import CategorySection from '@/components/CategorySection';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });


      setMenuItems((data as MenuItem[]) || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items. Please try again later.');
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