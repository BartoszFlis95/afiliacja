"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  ShoppingBag,
  Link2,
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

type BottomNavRole = "BRAND" | "INFLUENCER";

// Tylko 4 najważniejsze pozycje per rola — pełna nawigacja (7 pozycji)
// zostaje dostępna przez "Więcej" (otwiera ten sam Sheet co hamburger
// w headerze). Admin nie dostaje bottom nav — zgodnie ze specyfikacją.
const BOTTOM_NAV_ITEMS: Record<
  BottomNavRole,
  { title: string; href: string; icon: React.ElementType }[]
> = {
  BRAND: [
    { title: "Dashboard", href: "/brand/dashboard", icon: LayoutDashboard },
    { title: "Produkty", href: "/brand/products", icon: Package },
    { title: "Komisje", href: "/brand/commissions", icon: Receipt },
    { title: "Statystyki", href: "/brand/stats", icon: BarChart3 },
  ],
  INFLUENCER: [
    { title: "Dashboard", href: "/influencer/dashboard", icon: LayoutDashboard },
    { title: "Produkty", href: "/influencer/products", icon: ShoppingBag },
    { title: "Linki", href: "/influencer/links", icon: Link2 },
    { title: "Komisje", href: "/influencer/commissions", icon: Receipt },
  ],
};

export function MobileBottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  if (role !== "BRAND" && role !== "INFLUENCER") return null;
  const items = BOTTOM_NAV_ITEMS[role];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-zinc-100 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ title, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive ? "text-zinc-900" : "text-zinc-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {title}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-zinc-400 transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
        Więcej
      </button>
    </nav>
  );
}
