"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { signOut } from "@/helpers/authHelpers";
import { useLocation } from "@/components/LocationContext";

const links1 = [
  {
    name: "menu",
    path: "/",
  },
  {
    name: "select location",
    path: "/select-location",
  },
  {
    name: "cart",
    path: "/cart",
  },
];

const links2 = [
  {
    name: "login",
    path: "/login",
  },
  {
    name: "sign up",
    path: "/sign-up",
  },
];

const authenticatedLinks = [
  {
    name: "account",
    path: "/account",
  },
  {
    name: "order history",
    path: "/order-history",
  },
  {
    name: "favorites",
    path: "/favorites",
  },
];

// Desktop NavBar (No Account)
const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // useEffect block to check if user is logged in or not
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    // listening for any changes to authentication
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    //stop listening for any changes
    return () => subscription.unsubscribe();
  }, []);

  // recheck user on route/pathname changes
  useEffect(() => {
    const checkUserOnRouteChange = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUserOnRouteChange();
  }, [pathname]);

  // Had to handle the redirect on the client side because of the onclick attribute client-side only.
  // other auth redirects are handled through the authhelper file.
  const handleSignOut = async () => {
    const result = await signOut();
   
    if (result.success) {
      router.push('/logout');
      router.refresh();
    } else {
      router.push('/error');
    }
  }

  //Listen to use Location to change select location into the new locations name in the NavBar
  const { currentLocation, isHydrated } = useLocation();

  return (
    <nav className="flex justify-between w-full px-20 py-4 border-b border-gray-100 bg-gray-50 shadow-lg ">
      <Link href={"/"} className="flex gap-4 items-center">
        <Image
          src="/gladiator-logo.png"
          alt="Gladiator Logo"
          title="Gladiator Logo"
          width="48"
          height="48"
        />
        <h1 className="font-heading font-extrabold text-accent text-4xl">
          Gladiator
        </h1>
      </Link>
      {/* Center navigation: Menu, Select Location, Cart */}
      <div className="flex gap-16">
        {links1.map((link, index) => {
          // Special handling for select location link
          if (link.path === "/select-location") {
            return (
              <Link
                href="/select-location"
                key={index}
                className={`${
                  pathname === "/select-location" && "text-accent"
                } text-xl content-center capitalize font-heading font-semibold hover:text-accent transition-all`}
              >
                {isHydrated ? (currentLocation ? currentLocation.name : "select location") : "select location"}
              </Link>
            );
          }
          
          return (
            <Link
              href={link.path}
              key={index}
              className={`${
                link.path === pathname && "text-accent"
              } text-xl content-center capitalize font-heading font-semibold hover:text-accent transition-all`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
      {/* Log In / Sign Up buttons */}
      {!user ? (
        <div className="flex gap-16">
          {links2.map((link, index) => {
            return (
              <Link
                href={link.path}
                key={index}
                className={`${
                  link.path === pathname && "text-accent"
                } content-center text-xl capitalize font-heading font-semibold hover:text-accent transition-all`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      ) : (
        // Authenticated links after user is logged in
        <div className="flex gap-16">
          {authenticatedLinks.map((link, index) => {
            return (
              <Link
                href={link.path}
                key={index}
                className={`${
                  link.path === pathname && "text-accent"
                } content-center text-xl capitalize font-heading font-semibold hover:text-accent transition-all`}
              >
                {link.name}
              </Link>
            );
          })}
          {/* Sign Out Button */}
          <button
            onClick={() => handleSignOut()}
            className="content-center text-xl capitalize font-heading font-semibold hover:text-accent cursor-pointer transition-all"
          >
            sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
