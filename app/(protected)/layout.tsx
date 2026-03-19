"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import { toast } from "sonner";

const navLinks = [
  { label: "Favourites", href: "/favorites", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 19.364l6.364-6.364 6.364 6.364M12 3v10" /></svg>
  ) },
  { label: "Order History", href: "/order-history", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ) },
  { label: "Account Settings", href: "/account", icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    toast("Signing out...");
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-52 border-b md:border-b-0 md:border-r border-base-200 pt-3 md:pt-10 px-3 md:px-4 shrink-0 bg-white">
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          {navLinks.map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
<<<<<<< HEAD
              className={`text-sm font-body py-2 px-3 rounded transition-colors whitespace-nowrap ${
                pathname === href
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
=======
              className={`text-sm font-body py-2 px-3 rounded transition-colors whitespace-nowrap ${
                pathname === href
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
>>>>>>> origin/main
            >
              {icon}
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-2 md:mt-4 border-t border-base-200 pt-2 md:pt-4 pb-2 md:pb-0">
          <button
            onClick={handleLogout}
<<<<<<< HEAD
            className="text-sm font-body py-2 px-3 rounded text-neutral-700 hover:text-neutral-900 transition-colors w-full text-left"
=======
            className="text-sm font-body py-2 px-3 rounded text-neutral-700 hover:text-neutral-900 transition-colors w-full text-left"
>>>>>>> origin/main
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
