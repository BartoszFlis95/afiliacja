import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Trend = {
  value: string;
  positive: boolean;
};

type IconColor = "zinc" | "blue" | "emerald" | "amber" | "red" | "violet";

// Klasy jawnie wypisane (nie budowane przez template string) — Tailwind JIT
// skanuje kod źródłowy w poszukiwaniu literalnych nazw klas i wyciąłby
// dynamicznie sklejone `bg-${color}-50` z finalnego builda.
const ICON_COLOR_CLASSES: Record<IconColor, string> = {
  zinc:    "bg-zinc-100 text-zinc-600",
  blue:    "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  red:     "bg-red-50 text-red-600",
  violet:  "bg-violet-50 text-violet-600",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "zinc",
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: IconColor;
  trend?: Trend;
}) {
  return (
    <Card className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
            <p className="text-3xl font-semibold text-zinc-900">{value}</p>
          </div>
          <span
            className={cn(
              "flex items-center justify-center rounded-xl p-2.5",
              ICON_COLOR_CLASSES[iconColor]
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>

        {(description || trend) && (
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-sm font-medium",
                  trend.positive ? "text-emerald-600" : "text-red-500"
                )}
              >
                {trend.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
            {description && (
              <p className="text-xs text-zinc-400">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
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
