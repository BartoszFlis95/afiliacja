"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Role = "BRAND" | "INFLUENCER" | "ADMIN";

const roleLabels: Record<Role, string> = {
  BRAND:      "Marka",
  INFLUENCER: "Influencer",
  ADMIN:      "Admin",
};

const segmentLabels: Record<string, string> = {
  dashboard:   "Dashboard",
  products:    "Produkty",
  stats:       "Statystyki",
  influencers: "Influencerzy",
  settings:    "Ustawienia",
  links:       "Moje linki",
  users:       "Użytkownicy",
  commissions: "Prowizje",
  payouts:     "Wypłaty",
  onboarding:  "Onboarding",
};

function labelFor(segment: string) {
  return segmentLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

function initials(value: string) {
  const base = value.split("@")[0] ?? value;
  const parts = base.split(/[.\-_\s]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2);
  return letters.toUpperCase();
}

interface DashboardHeaderProps {
  email: string;
  role: string;
}

export function DashboardHeader({ email, role }: DashboardHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const normalizedRole = role as Role;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-4 shadow-sm">
      <SidebarTrigger
        size="icon-lg"
        className="-ml-1 text-zinc-500 hover:text-zinc-900 md:hidden"
      />
      <Separator orientation="vertical" className="mr-1 h-5 md:hidden" />

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;
            return (
              <React.Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-base font-semibold text-zinc-900">
                      {labelFor(segment)}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="text-zinc-500 hover:text-zinc-900">
                      <Link href={href}>{labelFor(segment)}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        <Badge
          variant="outline"
          className="hidden border-zinc-200 bg-zinc-50 text-zinc-600 sm:inline-flex"
        >
          {roleLabels[normalizedRole] ?? role}
        </Badge>
        <Avatar className="h-8 w-8 ring-2 ring-zinc-100">
          <AvatarFallback className="bg-zinc-900 text-xs font-semibold text-white">
            {initials(email)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
