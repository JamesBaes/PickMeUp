"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/authContext";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // SHOULD ADD A LOADING STATE PROBABLY (LIKE HOW WE DID IN MOBILE DEV CPRG-303)
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isRefreshingMenu, setIsRefreshingMenu] = useState(false);
  const [hasFetchedMenu, setHasFetchedMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMergedHeaderVisible, setIsMergedHeaderVisible] = useState(false);
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
  const { getItemCount } = useCart();
  const { user } = useAuth();
  const itemCount = getItemCount();

  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
      setSigningOut(false);
      return;
    }
    setSigningOut(false);
    router.push("/");
    router.refresh();
  };

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
      } finally {
        if (fetchRequestIdRef.current !== requestId) return;
        setLoading(false);
        setHasFetchedMenu(true);
        setTimeout(() => setIsRefreshingMenu(false), 140);
      }
    };

    void loadMenu();
  }, [currentLocation, isHydrated]);

  useEffect(() => {
    // Drive floating "scroll to top" and compact merged header visibility.
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      setIsMergedHeaderVisible(window.scrollY > 88);
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
          "item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information",
        )
        .eq("restaurant_id", numericRestaurantId)
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

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="font-body text-gray-600">Loading menu...</p>
      </div>
    );

  return (
    <div className="relative">
      {categories.length > 0 && (
        <nav className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            {isMergedHeaderVisible && (
              <Link href="/" className="flex items-center gap-2 shrink-0 pr-1">
                <Image
                  src="/gladiator-logo.png"
                  alt="Gladiator Logo"
                  title="Gladiator Logo"
                  width={30}
                  height={30}
                />
              </Link>
            )}

            <div className="w-56 shrink-0">
              <select
                value={currentLocation?.id || ""}
                onChange={handleLocationChange}
                disabled={locationLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-body text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="" disabled>
                  {locationLoading ? "Loading locations..." : "Select Location"}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              ref={categoryNavRef}
              className="flex-1 overflow-x-auto no-scrollbar"
            >
              <div className="flex w-max min-w-full flex-nowrap gap-1 md:justify-center">
                {categories.map((category) => (
                  <button
                    key={category}
                    ref={(element) => {
                      categoryButtonRefs.current[category] = element;
                    }}
                    onClick={() => scrollToCategory(category)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors shrink-0 ${
                      activeCategory === category
                        ? "bg-red-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {formatCategoryName(category)}
                  </button>
                ))}
              </div>
            </div>

            {isMergedHeaderVisible && (
              <div className="flex items-center gap-2 shrink-0 pl-1">
                <Link
                  href="/cart"
                  className="btn btn-ghost btn-circle relative"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {itemCount > 0 && (
                    <span className="badge badge-sm absolute -top-1 -right-1 bg-accent text-white border-none">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      aria-label="Account menu"
                      aria-haspopup="true"
                      className="btn btn-ghost btn-circle"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        aria-hidden="true"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <ul
                      tabIndex={0}
                      className="menu menu-sm dropdown-content bg-base-100 rounded-box shadow-lg mt-3 w-52 p-2 z-50 border border-gray-100"
                    >
                      <li>
                        <Link
                          href="/account"
                          className={`font-heading font-semibold capitalize ${pathname === "/account" ? "text-accent" : ""}`}
                        >
                          account
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/order-history"
                          className={`font-heading font-semibold capitalize ${pathname === "/order-history" ? "text-accent" : ""}`}
                        >
                          order history
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/favorites"
                          className={`font-heading font-semibold capitalize ${pathname === "/favorites" ? "text-accent" : ""}`}
                        >
                          favorites
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="font-heading font-semibold capitalize disabled:opacity-50"
                        >
                          {signingOut ? "signing out..." : "sign out"}
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="btn btn-ghost btn-circle"
                    aria-label="Login"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
      <div
        className={`container mx-auto px-4 py-8 transition-opacity duration-300 ${
          isRefreshingMenu ? "opacity-45" : "opacity-100"
        }`}
      >
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
      {isRefreshingMenu && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-20 flex justify-center">
          <div className="rounded-full border border-gray-200 bg-white/95 px-4 py-1.5 shadow-sm">
            <p className="font-body text-sm text-gray-600">Updating menu...</p>
          </div>
        </div>
      )}
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
