"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { signOut } from "@/helpers/authHelpers";

const links1 = [
  { name: "menu", path: "/" },
  { name: "select location", path: "/select-location" },
  { name: "cart", path: "/cart" },
];

const links2 = [
  { name: "login", path: "/login" },
  { name: "sign up", path: "/sign-up" },
];

const authenticatedLinks = [
  { name: "account", path: "/account" },
  { name: "order history", path: "/order-history" },
  { name: "favorites", path: "/favorites" },
];

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      router.push('/logout');
      router.refresh();
    } else {
      router.push('/error');
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-8 lg:px-20 py-3 md:py-4 border-b border-gray-100 bg-gray-50 shadow-lg">
        
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
        <div className="hidden md:flex items-center gap-6">
          {/* Main Links: Menu, Select Location, Cart */}
          {links1.map((link, index) => (
            <Link
              href={link.path}
              key={index}
              className={`${link.path === pathname && "text-accent"} text-lg capitalize font-heading font-semibold hover:text-accent transition-all`}
            >
              {link.name}
            </Link>
          ))}

          {/* Separator between main links and auth links */}
          <div className="w-px h-5 bg-gray-300"></div>

          {/* Auth Links: Login/Sign Up OR Account Links */}
          {!user ? (
            links2.map((link, index) => (
              <Link
                href={link.path}
                key={index}
                className={`${link.path === pathname && "text-accent"} text-lg capitalize font-heading font-semibold hover:text-accent transition-all`}
              >
                {link.name}
              </Link>
            ))
          ) : (
            <>
              {authenticatedLinks.map((link, index) => (
                <Link
                  href={link.path}
                  key={index}
                  className={`${link.path === pathname && "text-accent"} text-lg capitalize font-heading font-semibold hover:text-accent transition-all`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="text-lg capitalize font-heading font-semibold hover:text-accent cursor-pointer transition-all"
              >
                sign out
              </button>
            </>
          )}
        </div>

        {/* Hamburger Button - Only on mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Toggle menu"
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
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`md:hidden fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
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
          
          {/* Main Links */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 uppercase mb-3">Navigation</h3>
            <div className="space-y-2">
              {links1.map((link, index) => (
                <Link
                  href={link.path}
                  key={index}
                  className={`block p-3 rounded ${link.path === pathname ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Links */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 uppercase mb-3">
              {user ? 'Account' : 'Login'}
            </h3>
            <div className="space-y-2">
              {!user ? (
                links2.map((link, index) => (
                  <Link
                    href={link.path}
                    key={index}
                    className={`block p-3 rounded ${link.path === pathname ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))
              ) : (
                <>
                  {authenticatedLinks.map((link, index) => (
                    <Link
                      href={link.path}
                      key={index}
                      className={`block p-3 rounded ${link.path === pathname ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-3 rounded text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          {user && (
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