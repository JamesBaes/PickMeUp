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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 border-r border-base-200 pt-10 flex flex-col gap-2 px-4 shrink-0">
        {navLinks.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-body py-2 px-3 rounded transition-colors ${
              pathname === href
                ? "font-semibold text-foreground"
                : "text-base-content/60 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}

        <div className="mt-4 border-t border-base-200 pt-4">
          <button
            onClick={handleLogout}
            className="text-sm font-body py-2 px-3 rounded text-base-content/60 hover:text-foreground transition-colors w-full text-left"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
