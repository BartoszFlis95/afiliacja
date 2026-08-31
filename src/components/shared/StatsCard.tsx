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
  green:  "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  zinc:   "bg-zinc-100 text-zinc-600",
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
    <Card className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-3xl font-semibold text-zinc-900">{value}</p>
          </div>
          <span
            className={cn(
              "flex items-center justify-center rounded-xl p-4 [&>svg]:h-5 [&>svg]:w-5",
              COLOR_CLASSES[color]
            )}
          >
            {icon}
          </span>
        </div>

        {trend ? (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.value >= 0 ? "text-green-600" : "text-red-500"
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
            <span className="text-xs text-zinc-400">{trend.label}</span>
          </div>
        ) : (
          description && <p className="mt-3 text-xs text-zinc-400">{description}</p>
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
