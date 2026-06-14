import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = {
  value: string;
  positive: boolean;
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: Trend;
}) {
  return (
    <Card className="border-zinc-200 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
            <Icon className="h-5 w-5 text-zinc-900" />
          </span>
        </div>

        {(description || trend) && (
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend.positive ? "text-emerald-600" : "text-red-600"
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
