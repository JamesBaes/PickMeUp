"use client";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";

// Sidebar navigation links for protected pages
const navLinks = [
  // Favorites button
  { label: "Favourites", href: "/favorites", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 19.364l7.778-7.778a4 4 0 10-5.657-5.657l-1.415 1.414a4 4 0 000 5.657l7.778 7.778a2 2 0 002.828 0l1.415-1.414a2 2 0 000-2.828l-7.778-7.778" /></svg>
  ) },
  // Order History button
  { label: "Order History", href: "/order-history", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ) },
  // Account Settings button
  { label: "Account Settings", href: "/account", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar for account and protected pages */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-white to-stone-50 border-b md:border-b-0 md:border-r border-stone-200 pt-6 md:pt-12 px-4 md:px-6 shrink-0 shadow-sm">
        {/* Navigation links */}
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          {navLinks.map(({ label, href, icon }) => (
            // Sidebar button for each section
            <Link
              key={href}
              href={href}
              className={`flex items-center text-base font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap ${
                pathname === href
                  ? "bg-neutral-100 text-accent font-semibold shadow"
                  : "text-neutral-700 hover:bg-neutral-50 hover:text-accent"
              }`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>

        {/* Log Out button at the bottom of the sidebar */}
        <div className="mt-4 md:mt-8 border-t border-stone-200 pt-4 pb-2 md:pb-0">
          <button
            onClick={handleLogout}
            className="flex items-center text-base font-medium py-2 px-4 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-accent transition-colors w-full text-left"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
