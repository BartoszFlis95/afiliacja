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
  blue:   "bg-primary/10 text-primary",
  green:  "bg-success/10 text-success",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  zinc:   "bg-muted text-muted-foreground",
  red:    "bg-destructive/10 text-destructive",
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
    <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
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

        <p className="mb-1 text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {!trend && description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && <p className="mt-1 text-xs text-muted-foreground">{trend.label}</p>}
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
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
