"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRangeDays = 7 | 30 | 90;

const OPTIONS: { value: DateRangeDays; label: string }[] = [
  { value: 7, label: "7 dni" },
  { value: 30, label: "30 dni" },
  { value: 90, label: "90 dni" },
];

export function getDateRange(days: DateRangeDays): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeDays;
  onChange: (value: DateRangeDays) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-7 px-3 text-xs font-medium hover:bg-zinc-100",
            value === opt.value &&
              "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white"
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
