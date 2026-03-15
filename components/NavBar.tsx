"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cartContext";

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkUserOnRouteChange = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUserOnRouteChange();
  }, [pathname]);

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

  const navLinkClass = (path: string) =>
    `font-heading font-semibold text-lg capitalize hover:text-accent transition-all ${
      pathname === path ? "text-accent" : ""
    }`;

  return (
    <div className="navbar bg-gray-50 border-b border-gray-100 shadow-lg px-6 md:px-12">
      {/* Left: Logo */}
      <div className="navbar-start">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/gladiator-logo.png"
            alt="Gladiator Logo"
            title="Gladiator Logo"
            width={40}
            height={40}
          />
          <span className="font-heading font-extrabold text-accent text-3xl">
            Gladiator
          </span>
        </Link>
      </div>
      {/* Right: Cart + Profile/Auth */}
      <div className="navbar-end flex items-center gap-2">
        {/* Cart icon with badge */}
        <Link href="/cart" className="btn btn-ghost btn-circle relative">
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

        {/* Authenticated: profile dropdown */}
        {user ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
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
          /* Unauthenticated: login + signup */
          <div className="flex items-center gap-4 ml-4">
            <Link
              href="/login"
              className="btn btn-medium font-heading font-semibold capitalize text-white border-none bg-black hover:bg-gray-800"
            >
              login
            </Link>
            <Link
              href="/sign-up"
              className="btn btn-medium font-heading font-semibold capitalize text-white border-none bg-blue-600 hover:bg-blue-700"
            >
              sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;
