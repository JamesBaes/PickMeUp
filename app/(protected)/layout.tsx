"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";

const navLinks = [
  { label: "Favourites", href: "/favorites" },
  { label: "Order History", href: "/order-history" },
  { label: "Account Settings", href: "/account" },
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
      {/* Sidebar */}
      <aside className="w-full md:w-52 border-b md:border-b-0 md:border-r border-base-200 pt-3 md:pt-10 px-3 md:px-4 shrink-0">
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-body py-2 px-3 rounded transition-colors whitespace-nowrap ${
                pathname === href
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-700 hover:text-neutral-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-2 md:mt-4 border-t border-base-200 pt-2 md:pt-4 pb-2 md:pb-0">
          <button
            onClick={handleLogout}
            className="text-sm font-body py-2 px-3 rounded text-neutral-700 hover:text-neutral-900 transition-colors w-full text-left"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
