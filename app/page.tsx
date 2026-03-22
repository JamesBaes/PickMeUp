"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import supabase from "@/utils/supabase/client";
import { MenuItem } from "@/types/";
import {
  groupByCategory,
  categoryOrder,
  transformMenuItemData,
  formatCategoryName,
} from "@/helpers/menuHelpers";
import CategorySection from "@/components/CategorySection";
import { useLocation } from "@/context/locationContext";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // SHOULD ADD A LOADING STATE PROBABLY (LIKE HOW WE DID IN MOBILE DEV CPRG-303)
  const [loading, setLoading] = useState(true);
  const [isRefreshingMenu, setIsRefreshingMenu] = useState(false);
  const [hasFetchedMenu, setHasFetchedMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryNavRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  // Incrementing request id protects UI from race conditions when users
  // change location quickly and multiple fetches complete out of order.
  const fetchRequestIdRef = useRef(0);

  // Incorporates the location for each menu item, so that we can filter items based on the user's selected location in the future (if needed)
  const {
    currentLocation,
    isHydrated,
    locations,
    setCurrentLocation,
    loading: locationLoading,
  } = useLocation();

  useEffect(() => {
    // Wait for browser-only location hydration before first fetch.
    if (!isHydrated) return;

    const requestId = ++fetchRequestIdRef.current;
    const isInitialLoad = !hasFetchedMenu;
    
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshingMenu(true);
    }
  // Fetch menu items based on current location (or default if no location selected)
    const loadMenu = async () => {
      try {
        const items = currentLocation?.id
          ? await fetchLocationMenuItems(currentLocation.id)
          : await fetchDefaultMenuItems();

        if (fetchRequestIdRef.current !== requestId) return;

        setMenuItems(items);
      } catch (error) {
        if (fetchRequestIdRef.current !== requestId) return;
        console.error("Error loading menu:", error);
        setMenuItems([]);
      }
      finally {
        if (fetchRequestIdRef.current !== requestId) return;
        setLoading(false);
        setHasFetchedMenu(true);
        setTimeout(() => setIsRefreshingMenu(false), 140);
      }
    };

    void loadMenu();
  }, [currentLocation, isHydrated]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch default/global menu when no location is selected.
  const fetchDefaultMenuItems = async (): Promise<MenuItem[]> => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .neq("is_hidden", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data as MenuItem[]) || [];
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  };

  // Fetch location-specific menu variant.
  const fetchLocationMenuItems = async (
    restaurantId: string,
  ): Promise<MenuItem[]> => {
    try {
      const numericRestaurantId = parseInt(restaurantId, 10);

      const { data: locationData, error: locationError } = await supabase
        .from("menu_items_restaurant_locations")
        .select(
          "item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information, is_hidden",
        )
        .eq("restaurant_id", numericRestaurantId)
        .neq("is_hidden", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (locationError) throw locationError;

      if (!locationData || locationData.length === 0) {
        console.warn("⚠️ No menu items found for this location");
        return [];
      }

      const items = locationData.map(transformMenuItemData);
      return items as MenuItem[];
    } catch (error) {
      console.error("Error fetching location menu items:", error);
      return [];
    }
  };
  // Keep menu category order consistent with business UX, not alphabetic sorting.
  const groupedItems = groupByCategory(menuItems);
  const categories = categoryOrder.filter((category) => groupedItems[category]);

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    // Scrollspy: mark the category currently nearest the top viewport anchor.
    const updateActiveCategory = () => {
      const scrollOffset = 180;
      const currentScrollPosition = window.scrollY + scrollOffset;

      let currentCategory = categories[0];

      for (const category of categories) {
        const section = document.getElementById(category);
        if (!section) continue;

        if (section.offsetTop <= currentScrollPosition) {
          currentCategory = category;
        }
      }

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;

      if (nearBottom) {
        currentCategory = categories[categories.length - 1];
      }

      setActiveCategory((prev) =>
        prev === currentCategory ? prev : currentCategory,
      );
    };

    updateActiveCategory();

    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    window.addEventListener("resize", updateActiveCategory);

    return () => {
      window.removeEventListener("scroll", updateActiveCategory);
      window.removeEventListener("resize", updateActiveCategory);
    };
  }, [categories]);

  useEffect(() => {
    // Auto-scroll active category chip into horizontal view when needed.
    if (!activeCategory) {
      return;
    }

    const navContainer = categoryNavRef.current;
    const activeButton = categoryButtonRefs.current[activeCategory];

    if (!navContainer || !activeButton) {
      return;
    }

    const navRect = navContainer.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const isOutOfView =
      buttonRect.left < navRect.left || buttonRect.right > navRect.right;

    if (isOutOfView) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  const scrollToCategory = (category: string) => {
    const el = document.getElementById(category);
    if (el) {
      setActiveCategory(category);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    // Changing location triggers menu refetch through currentLocation effect.
    const selectedId = event.target.value;
    const selectedLocation =
      locations.find((location) => location.id === selectedId) || null;
    setCurrentLocation(selectedLocation);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Show loading state while menu is being fetched
  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="font-body text-neutral-600">Loading menu...</p>
      </div>
    );

  return (
    <div className="relative">
      {/* Category navigation bar with scrollable category buttons */}
      {categories.length > 0 && (
        <nav className="sticky top-16 z-20 bg-background border-b border-neutral-200 shadow-sm">
          <div
            ref={categoryNavRef}
            className="overflow-x-auto no-scrollbar px-4 py-2"
          >
            <div className="flex w-max min-w-full flex-nowrap gap-1 md:justify-center">
              {/* Category buttons for quick navigation */}
              {categories.map((category) => (
                <button
                  key={category}
                  ref={(element) => {
                    categoryButtonRefs.current[category] = element;
                  }}
                  onClick={() => scrollToCategory(category)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors shrink-0 ${
                    activeCategory === category
                      ? "bg-danger-dark text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {formatCategoryName(category)}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
      {/* Main menu content area */}
      
      <div
        className={`container mx-auto px-4 py-8 transition-opacity duration-300 ${
          isRefreshingMenu ? "opacity-45" : "opacity-100"
        }`}
      >
        {/* Location selector dropdown */}
        <div className="mb-6 w-56">
          <select
            value={currentLocation?.id || ""}
            onChange={handleLocationChange}
            disabled={locationLoading}
            className="w-full rounded-lg border border-neutral-300 bg-background px-3 py-2 font-body text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-neutral-100"
          >
            <option value="" disabled>
              {locationLoading ? "Loading locations..." : "Select Location"}
            </option>
            {/* Location options */}
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        {/* Render menu item cards grouped by category */}
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
      {/* Show menu updating spinner when refreshing */}
      {isRefreshingMenu && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-20 flex justify-center">
          <div className="rounded-full border border-neutral-200 bg-background/95 px-4 py-1.5 shadow-sm">
            <p className="font-body text-sm text-neutral-600">Updating menu...</p>
          </div>
        </div>
      )}
      {/* Scroll-to-top floating button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
