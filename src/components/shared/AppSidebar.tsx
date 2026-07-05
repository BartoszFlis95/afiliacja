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
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth.actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Role = "BRAND" | "INFLUENCER" | "ADMIN";

const NAV_ITEMS: Record<Role, { title: string; href: string; icon: React.ElementType }[]> = {
  BRAND: [
    { title: "Dashboard",    href: "/brand/dashboard",    icon: LayoutDashboard },
    { title: "Produkty",     href: "/brand/products",     icon: Package },
    { title: "Komisje",      href: "/brand/commissions",  icon: Receipt },
    { title: "Statystyki",   href: "/brand/stats",        icon: BarChart3 },
    { title: "Influencerzy", href: "/brand/influencers",  icon: Users },
    { title: "Ustawienia",   href: "/brand/settings",     icon: Settings },
  ],
  INFLUENCER: [
    { title: "Dashboard",  href: "/influencer/dashboard",   icon: LayoutDashboard },
    { title: "Produkty",   href: "/influencer/products",    icon: ShoppingBag },
    { title: "Moje linki", href: "/influencer/links",       icon: Link2 },
    { title: "Komisje",    href: "/influencer/commissions", icon: Receipt },
    { title: "Statystyki", href: "/influencer/stats",       icon: BarChart3 },
    { title: "Dokumenty",  href: "/influencer/documents",   icon: FileText },
    { title: "Ustawienia", href: "/influencer/settings",    icon: Settings },
  ],
  ADMIN: [
    { title: "Dashboard",   href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Użytkownicy", href: "/admin/users",     icon: Users },
    { title: "Produkty",    href: "/admin/products",  icon: Package },
    { title: "Wypłaty",     href: "/admin/payouts",   icon: CreditCard },
    { title: "Faktury",     href: "/admin/invoices",  icon: FileText },
    { title: "Finanse",     href: "/admin/finance",   icon: DollarSign },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  BRAND:      "Marka",
  INFLUENCER: "Influencer",
  ADMIN:      "Administrator",
};

interface AppSidebarProps {
  role: string;
  email: string;
}

export function AppSidebar({ role, email }: AppSidebarProps) {
  const pathname = usePathname();
  const normalizedRole = (role as Role) in NAV_ITEMS ? (role as Role) : "INFLUENCER";
  const items = NAV_ITEMS[normalizedRole];
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <Sidebar className="border-r border-[#1E293B]">
      {/* Logo */}
      <SidebarHeader className="h-14 border-b border-[#1E293B] px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Deneeu</span>
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-xs uppercase tracking-widest text-slate-600">
            {ROLE_LABEL[normalizedRole]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map(({ title, href, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                      )}
                    >
                      <Link href={href}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-[#1E293B] p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">{email}</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[normalizedRole]}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-[#1E293B] hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Wyloguj się</span>
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
