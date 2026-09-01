import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatsCardColor = "blue" | "green" | "purple" | "orange" | "zinc" | "red";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: StatsCardColor;
}

// Klasy wypisane jawnie (nie budowane przez template string) — Tailwind JIT
// skanuje kod źródłowy w poszukiwaniu literalnych nazw klas i wyciąłby
// dynamicznie sklejone `bg-${color}-50` z finalnego builda.
const COLOR_CLASSES: Record<StatsCardColor, string> = {
  blue:   "bg-blue-50 text-blue-600",
  green:  "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  zinc:   "bg-slate-100 text-slate-600",
  red:    "bg-red-50 text-red-600",
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color = "zinc",
}: StatsCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-0">
        <div className="mb-4 flex items-center justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5",
              COLOR_CLASSES[color]
            )}
          >
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium",
                trend.value >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              )}
            >
              {trend.value >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>

        <p className="mb-1 text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {!trend && description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
        {trend && <p className="mt-1 text-xs text-slate-400">{trend.label}</p>}
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="mt-3 h-3 w-20" />
      </CardContent>
    </Card>
  );
}
