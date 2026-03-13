"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { signOut } from "@/helpers/authHelpers";
import { User as UserIcon, ShoppingCart, LogOut } from "lucide-react";
import {
  getSelectedLocation,
  setSelectedLocation,
  LOCATION_CHANGE_EVENT,
} from "@/helpers/locationHelpers";

const links1 = [
  { name: "menu", path: "/" },
];

const links2 = [
  { name: "login", path: "/login" },
  { name: "sign up", path: "/sign-up" },
];

const authenticatedLinks = [
  { name: "account", path: "/account" },
  { name: "cart", path: "/cart" },
];

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(true);
  const [selectedLocation, setSelectedLocationState] = useState<string>("");

  const isActive = (path: string) => pathname === path;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Check user
  useEffect(() => {
    setIsHydrated(true);
    const storedLocation = getSelectedLocation();
    setSelectedLocationState(storedLocation ?? "");

    const handleLocationChange = () => {
      const currentLocation = getSelectedLocation();
      setSelectedLocationState(currentLocation ?? "");
    };

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchLocations(storedLocation);
      } else {
        setAvailableLocations([]);
        setIsLocationsLoading(false);
      }
    };

    const fetchLocations = async (currentStoredLocation?: string | null) => {
      setIsLocationsLoading(true);

      const { data, error } = await supabase
        .from("menu_items")
        .select("restaurant_id")
        .not("restaurant_id", "is", null)
        .order("restaurant_id", { ascending: true });

      if (error) {
        console.warn("Unable to fetch locations", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setAvailableLocations([]);
        setIsLocationsLoading(false);
        return;
      }

      const uniqueLocations = Array.from(
        new Set(
          (data || [])
            .map((item) => item.restaurant_id)
            .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        )
      );

      if (currentStoredLocation && !uniqueLocations.includes(currentStoredLocation)) {
        setSelectedLocationState("");
        setSelectedLocation(null);
      }

      setAvailableLocations(uniqueLocations);
      setIsLocationsLoading(false);
    };

    checkUser();
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        const currentLocation = getSelectedLocation() ?? "";
        fetchLocations(currentLocation);
      } else {
        setAvailableLocations([]);
        setSelectedLocationState("");
        setSelectedLocation(null);
        setIsLocationsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      router.push('/logout');
      router.refresh();
    } else {
      router.push('/error');
    }
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocationState(location);
    setSelectedLocation(location || null);

    if (pathname !== "/") {
      router.push("/");
    }

    router.refresh();
  };

  const getAuthIcon = (name: string) => {
    if (name === "account") {
      return <UserIcon size={18} />;
    }

    if (name === "cart") {
      return <ShoppingCart size={18} />;
    }

    return null;
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-8 lg:px-20 py-3 md:py-4 border-b border-gray-100 bg-gray-50/95 backdrop-blur shadow-lg">
        
        {/* Logo */}
        <Link href={"/"} className="flex gap-2 md:gap-4 items-center">
          <Image
            src="/gladiator-logo.png"
            alt="Gladiator Logo"
            title="Gladiator Logo"
            width="48"
            height="48"
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <h1 className="font-heading font-extrabold text-accent text-2xl md:text-3xl lg:text-4xl">
            Gladiator
          </h1>
        </Link>

        {/* Desktop Navigation - Combined with better spacing */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6">
          {isHydrated && user && (
            <>
              {/* Main Links: Menu, Select Location */}
              {links1.map((link) => (
                <Link
                  href={link.path}
                  key={link.path}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  className={`${isActive(link.path) ? "text-accent" : "text-foreground"} text-lg capitalize font-heading font-semibold hover:text-accent transition-colors`}
                >
                  {link.name}
                </Link>
              ))}

              <label className="flex items-center gap-2.5 pl-1">
                <span className="text-lg capitalize font-heading font-semibold text-foreground">
                  Location
                </span>
                <select
                  className="select select-sm h-9 min-h-9 border-gray-300 bg-white text-foreground focus:outline-none focus:border-accent font-heading"
                  value={selectedLocation}
                  onChange={(event) => handleLocationSelect(event.target.value)}
                  disabled={isLocationsLoading || availableLocations.length === 0}
                  aria-label="Select location"
                >
                  <option value="">
                    {isLocationsLoading
                      ? "Loading locations..."
                      : availableLocations.length === 0
                        ? "No locations available"
                        : "All locations"}
                  </option>
                  {availableLocations.map((locationId) => (
                    <option key={locationId} value={locationId}>
                      {locationId}
                    </option>
                  ))}
                </select>
              </label>

              {/* Separator between main links and auth links */}
              <div className="w-px h-6 bg-gray-300"></div>
            </>
          )}

          {/* Auth Links: Login/Sign Up OR Account Links */}
          {isHydrated && (!user ? (
            links2.map((link) => (
              <Link
                href={link.path}
                key={link.path}
                aria-current={isActive(link.path) ? "page" : undefined}
                className={`${isActive(link.path) ? "text-accent" : "text-foreground"} text-lg capitalize font-heading font-semibold hover:text-accent transition-colors`}
              >
                {link.name}
              </Link>
            ))
          ) : (
            <>
              {authenticatedLinks.map((link) => (
                <Link
                  href={link.path}
                  key={link.path}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  className={`${isActive(link.path) ? "text-accent" : "text-foreground"} text-lg capitalize font-heading font-semibold hover:text-accent transition-colors inline-flex items-center gap-1.5`}
                >
                  {getAuthIcon(link.name)}
                  {link.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="text-lg capitalize font-heading font-semibold text-foreground hover:text-accent cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut size={18} />
                sign out
              </button>
            </>
          ))}
        </div>

        {/* Hamburger Button - Only on mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-30" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        
        {/* Menu Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Image
              src="/gladiator-logo.png"
              alt="Logo"
              width="32"
              height="32"
              className="w-8 h-8"
            />
            <span className="font-bold text-lg">Menu</span>
          </div>
        </div>

        {/* Menu Content */}
        <div className="p-4 overflow-y-auto h-full">
          
          {isHydrated && user && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-500 uppercase mb-3">Navigation</h3>
              <div className="space-y-2">
                {links1.map((link) => (
                  <Link
                    href={link.path}
                    key={link.path}
                    aria-current={isActive(link.path) ? "page" : undefined}
                    className={`block p-3 rounded-lg font-medium capitalize ${isActive(link.path) ? 'bg-red-50 text-accent' : 'text-foreground hover:bg-gray-50'}`}
                    onClick={closeMobileMenu}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm text-gray-500 uppercase mb-3">Location</label>
                <select
                  className="select w-full border-gray-300 bg-white text-foreground focus:outline-none focus:border-accent font-heading"
                  value={selectedLocation}
                  onChange={(event) => handleLocationSelect(event.target.value)}
                  disabled={isLocationsLoading || availableLocations.length === 0}
                  aria-label="Select location"
                >
                  <option value="">
                    {isLocationsLoading
                      ? "Loading locations..."
                      : availableLocations.length === 0
                        ? "No locations available"
                        : "All locations"}
                  </option>
                  {availableLocations.map((locationId) => (
                    <option key={locationId} value={locationId}>
                      {locationId}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Auth Links */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 uppercase mb-3">
              {isHydrated && user ? 'Account' : 'Login'}
            </h3>
            <div className="space-y-2">
              {isHydrated && (!user ? (
                links2.map((link) => (
                  <Link
                    href={link.path}
                    key={link.path}
                    aria-current={isActive(link.path) ? "page" : undefined}
                    className={`block p-3 rounded-lg font-medium capitalize ${isActive(link.path) ? 'bg-red-50 text-accent' : 'text-foreground hover:bg-gray-50'}`}
                    onClick={closeMobileMenu}
                  >
                    {link.name}
                  </Link>
                ))
              ) : (
                <>
                  {authenticatedLinks.map((link) => (
                    <Link
                      href={link.path}
                      key={link.path}
                      aria-current={isActive(link.path) ? "page" : undefined}
                      className={`p-3 rounded-lg font-medium capitalize ${isActive(link.path) ? 'bg-red-50 text-accent' : 'text-foreground hover:bg-gray-50'} flex items-center gap-2`}
                      onClick={closeMobileMenu}
                    >
                      {getAuthIcon(link.name)}
                      {link.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => { handleSignOut(); closeMobileMenu(); }}
                    className="w-full text-left p-3 rounded-lg font-medium text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ))}
            </div>
          </div>

          {/* User Info */}
          {isHydrated && user && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;