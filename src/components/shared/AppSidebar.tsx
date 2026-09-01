"use client";

import Image from "next/image";
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
  BookOpen,
  ShieldAlert,
  Ticket,
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type Role = "BRAND" | "INFLUENCER" | "ADMIN";
type NavItem = { title: string; href: string; icon: React.ElementType };

// Grupy z separatorem między nimi — nie jedna płaska lista.
const NAV_GROUPS: Record<Role, { label: string; items: NavItem[] }[]> = {
  BRAND: [
    {
      label: "Główne",
      items: [
        { title: "Dashboard",  href: "/brand/dashboard",   icon: LayoutDashboard },
        { title: "Produkty",   href: "/brand/products",    icon: Package },
        { title: "Komisje",    href: "/brand/commissions", icon: Receipt },
        { title: "Statystyki", href: "/brand/stats",       icon: BarChart3 },
      ],
    },
    {
      label: "Konto",
      items: [
        { title: "Influencerzy",     href: "/brand/influencers", icon: Users },
        { title: "Ustawienia",       href: "/brand/settings",    icon: Settings },
        { title: "Dokumentacja API", href: "/docs",               icon: BookOpen },
      ],
    },
  ],
  INFLUENCER: [
    {
      label: "Główne",
      items: [
        { title: "Dashboard",  href: "/influencer/dashboard",   icon: LayoutDashboard },
        { title: "Produkty",   href: "/influencer/products",    icon: ShoppingBag },
        { title: "Moje linki", href: "/influencer/links",       icon: Link2 },
        { title: "Komisje",    href: "/influencer/commissions", icon: Receipt },
        { title: "Statystyki", href: "/influencer/stats",       icon: BarChart3 },
      ],
    },
    {
      label: "Konto",
      items: [
        { title: "Dokumenty",  href: "/influencer/documents", icon: FileText },
        { title: "Ustawienia", href: "/influencer/settings",  icon: Settings },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Platforma",
      items: [
        { title: "Dashboard",   href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Użytkownicy", href: "/admin/users",     icon: Users },
        { title: "Produkty",    href: "/admin/products",  icon: Package },
      ],
    },
    {
      label: "Finanse",
      items: [
        { title: "Wypłaty", href: "/admin/payouts", icon: CreditCard },
        { title: "Faktury", href: "/admin/invoices", icon: FileText },
        { title: "Finanse", href: "/admin/finance",  icon: DollarSign },
      ],
    },
    {
      label: "Ochrona",
      items: [
        { title: "Fraud",          href: "/admin/fraud",        icon: ShieldAlert },
        { title: "Kody zaproszeń", href: "/admin/invite-codes", icon: Ticket },
      ],
    },
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
  const { setOpenMobile } = useSidebar();
  const normalizedRole = (role as Role) in NAV_GROUPS ? (role as Role) : "INFLUENCER";
  const groups = NAV_GROUPS[normalizedRole];
  const initials = email.slice(0, 2).toUpperCase();

  // Sidebar to zawsze nakładka (offcanvas) — po przejściu na inną stronę
  // trzeba ją zamknąć, inaczej zasłania nową stronę do ręcznego zamknięcia.
  const closeSidebar = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      {/* Logo — kontener na białym/jasnoniebieskim tle, bo logo.png ma
          nieprzezroczyste szare tło i "invert" zniekształciłby jego
          niebieskie gradienty na sidebarze. Subtelny glow pod spodem
          odwołuje się do niebieskiego akcentu marki bez zmiany tła sidebaru. */}
      <SidebarHeader className="border-b border-slate-800 px-4 py-4">
        <Link href="/" className="flex items-center justify-center">
          {/* Bez białej płytki pod spodem — logo ma własne ciemne tło,
              więc jasny kafelek na granatowym sidebarze tworzył obcą ramkę.
              Zostaje sam niebieski glow jako akcent marki. */}
          <div className="relative inline-block rounded-xl shadow-[0_0_28px_rgba(59,130,246,0.25)]">
            <Image
              src="/logo.png"
              alt="Deneeu"
              width={2720}
              height={1536}
              sizes="220px"
              className="h-11 w-auto rounded-lg object-contain"
              priority
            />
          </div>
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-4">
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            {groupIndex > 0 && <SidebarSeparator className="mb-3 bg-slate-800" />}
            <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map(({ title, href, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "flex h-11 items-center gap-2.5 rounded-xl border-l-2 border-transparent px-3 text-sm font-medium transition-all duration-150 ease-out",
                          isActive
                            ? "border-l-blue-400 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <Link href={href} onClick={closeSidebar}>
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
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-800 p-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-slate-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-blue-400/30">
            <span className="text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{email}</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[normalizedRole]}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-slate-400 transition-all duration-150 ease-out hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Wyloguj się</span>
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
