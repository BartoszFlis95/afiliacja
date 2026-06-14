"use client";

import { Role } from "@prisma/client";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<Role, string> = {
  BRAND: "Marka",
  INFLUENCER: "Influencer",
  ADMIN: "Administrator",
};

const ROLE_COLORS: Record<Role, string> = {
  BRAND: "bg-blue-50 text-blue-700 border-blue-200",
  INFLUENCER: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-red-50 text-red-700 border-red-200",
};

interface HeaderProps {
  email: string;
  role: Role;
}

export function Header({ email, role }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full border",
            ROLE_COLORS[role]
          )}
        >
          {ROLE_LABELS[role]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-400 hover:text-slate-600"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 ml-1 cursor-pointer hover:opacity-80">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {email.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700 leading-none">
              {email.split("@")[0]}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{email}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}