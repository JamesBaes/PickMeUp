import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import supabase from '@/utils/supabase/client';
import { MenuItem, MenuCategory } from '@/types';
import { groupByCategory, categoryOrder, transformMenuItemData } from '@/helpers/menuHelpers';
import { useLocation } from '@/context/locationContext';

// Fetch global menu — used when no location is selected.
const fetchDefaultMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .neq('is_hidden', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as MenuItem[]) || [];
};

// Fetch location-specific menu variant.
const fetchLocationMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  const numericId = parseInt(restaurantId, 10);
  const { data, error } = await supabase
    .from('menu_items_restaurant_locations')
    .select('item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information, is_hidden')
    .eq('restaurant_id', numericId)
    .neq('is_hidden', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map(transformMenuItemData) as MenuItem[];
};

export function useMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshingMenu, setIsRefreshingMenu] = useState(false);
  const [hasFetchedMenu, setHasFetchedMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryNavRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Incrementing request id protects UI from race conditions when location changes quickly.
  const fetchRequestIdRef = useRef(0);

  const { currentLocation, isHydrated, locations, setCurrentLocation, loading: locationLoading } = useLocation();

  // Fetch menu whenever location changes, once localStorage has hydrated.
  useEffect(() => {
    if (!isHydrated) return;

    const requestId = ++fetchRequestIdRef.current;
    const isInitialLoad = !hasFetchedMenu;

    if (isInitialLoad) setLoading(true);
    else setIsRefreshingMenu(true);

    const loadMenu = async () => {
      try {
        const items = currentLocation?.id
          ? await fetchLocationMenuItems(currentLocation.id)
          : await fetchDefaultMenuItems();

        if (fetchRequestIdRef.current !== requestId) return;
        setMenuItems(items);
      } catch (error) {
        if (fetchRequestIdRef.current !== requestId) return;
        console.error('Error loading menu:', error);
        setMenuItems([]);
      } finally {
        if (fetchRequestIdRef.current !== requestId) return;
        setLoading(false);
        setHasFetchedMenu(true);
        setTimeout(() => setIsRefreshingMenu(false), 140);
      }
    };

    void loadMenu();
  }, [currentLocation, isHydrated]);

  // Show/hide scroll-to-top button based on scroll position.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]) as MenuCategory[];

  // Scrollspy: keep the active category chip in sync with viewport position.
  useEffect(() => {
    if (!categories.length) return;

    const updateActiveCategory = () => {
      const scrollOffset = 180;
      const currentScrollPosition = window.scrollY + scrollOffset;
      let current = categories[0];

      for (const category of categories) {
        const section = document.getElementById(category);
        if (section && section.offsetTop <= currentScrollPosition) current = category;
      }

      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) current = categories[categories.length - 1];

      setActiveCategory((prev) => (prev === current ? prev : current));
    };

    updateActiveCategory();
    window.addEventListener('scroll', updateActiveCategory, { passive: true });
    window.addEventListener('resize', updateActiveCategory);
    return () => {
      window.removeEventListener('scroll', updateActiveCategory);
      window.removeEventListener('resize', updateActiveCategory);
    };
  }, [categories.join(',')]);

  // Auto-scroll the active category chip into horizontal view when it changes.
  useEffect(() => {
    if (!activeCategory) return;
    const navContainer = categoryNavRef.current;
    const activeButton = categoryButtonRefs.current[activeCategory];
    if (!navContainer || !activeButton) return;

    const navRect = navContainer.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const isOutOfView = buttonRect.left < navRect.left || buttonRect.right > navRect.right;

    if (isOutOfView) {
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeCategory]);

  const scrollToCategory = (category: string) => {
    const el = document.getElementById(category);
    if (el) {
      setActiveCategory(category);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = locations.find((loc) => loc.id === event.target.value) || null;
    setCurrentLocation(selected);
  };

  return {
    loading,
    isRefreshingMenu,
    showScrollTop,
    activeCategory,
    groupedItems,
    categories,
    currentLocation,
    locations,
    locationLoading,
    categoryNavRef,
    categoryButtonRefs,
    scrollToCategory,
    handleLocationChange,
  };
}
