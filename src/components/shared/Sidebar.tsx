"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  Settings,
  ShoppingBag,
  Link2,
  LogOut,
} from "lucide-react";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth.actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  BRAND: [
    { label: "Dashboard", href: "/brand/dashboard", icon: LayoutDashboard },
    { label: "Produkty", href: "/brand/products", icon: Package },
    { label: "Statystyki", href: "/brand/stats", icon: BarChart3 },
    { label: "Influencerzy", href: "/brand/influencers", icon: Users },
    { label: "Ustawienia", href: "/brand/settings", icon: Settings },
  ],
  INFLUENCER: [
    { label: "Dashboard", href: "/influencer/dashboard", icon: LayoutDashboard },
    { label: "Produkty", href: "/influencer/products", icon: ShoppingBag },
    { label: "Moje linki", href: "/influencer/links", icon: Link2 },
    { label: "Statystyki", href: "/influencer/stats", icon: BarChart3 },
    { label: "Ustawienia", href: "/influencer/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Użytkownicy", href: "/admin/users", icon: Users },
    { label: "Produkty", href: "/admin/products", icon: Package },
  ],
};

interface SidebarProps {
  role: Role;
  email: string;
}

export function Sidebar({ role, email }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <aside className="w-56 min-h-screen flex flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">D</span>
          </div>
          <span className="text-base font-semibold text-slate-900">
            Deneeu
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nawigacja
        </p>
        {items.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-slate-50 mb-2">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">
              {email}
            </p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </button>
        </form>
      </div>
    </aside>
  );
}