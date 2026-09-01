"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Receipt,
  Users,
  Settings,
  Link2,
  UserCog,
  Wallet,
  ShieldAlert,
} from "lucide-react";

type Role = "BRAND" | "INFLUENCER" | "ADMIN";
type NavItem = { title: string; href: string; icon: React.ElementType };

export function openCommandPalette() {
  window.dispatchEvent(new Event("open-command-palette"));
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  BRAND: [
    { title: "Dashboard", href: "/brand/dashboard", icon: LayoutDashboard },
    { title: "Produkty", href: "/brand/products", icon: Package },
    { title: "Nowy produkt", href: "/brand/products/new", icon: PlusCircle },
    { title: "Komisje", href: "/brand/commissions", icon: Receipt },
    { title: "Influencerzy", href: "/brand/influencers", icon: Users },
    { title: "Ustawienia", href: "/brand/settings", icon: Settings },
  ],
  INFLUENCER: [
    { title: "Dashboard", href: "/influencer/dashboard", icon: LayoutDashboard },
    { title: "Produkty", href: "/influencer/products", icon: Package },
    { title: "Moje linki", href: "/influencer/links", icon: Link2 },
    { title: "Komisje", href: "/influencer/commissions", icon: Receipt },
    { title: "Ustawienia", href: "/influencer/settings", icon: Settings },
  ],
  ADMIN: [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Użytkownicy", href: "/admin/users", icon: UserCog },
    { title: "Produkty", href: "/admin/products", icon: Package },
    { title: "Wypłaty", href: "/admin/payouts", icon: Wallet },
    { title: "Fraud", href: "/admin/fraud", icon: ShieldAlert },
  ],
};

export function CommandPalette({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const normalizedRole = (role as Role) in NAV_ITEMS ? (role as Role) : "INFLUENCER";
  const items = NAV_ITEMS[normalizedRole];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    // Pozwala innym komponentom (np. przycisk-podpowiedź "⌘K" w headerze)
    // otworzyć paletę bez podnoszenia stanu `open` do wspólnego rodzica.
    function handleOpenRequest() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenRequest);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenRequest);
    };
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label="Szybka nawigacja"
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      contentClassName="fixed top-[15%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl bg-card shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4">
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <CommandInput
          placeholder="Szukaj stron..."
          className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <CommandList className="max-h-80 overflow-y-auto p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          Brak wyników.
        </CommandEmpty>
        <CommandGroup heading="Nawigacja" className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
          {items.map(({ title, href, icon: Icon }) => (
            <CommandItem
              key={href}
              value={title}
              onSelect={() => navigate(href)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground aria-selected:bg-primary aria-selected:text-primary-foreground hover:bg-muted"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
